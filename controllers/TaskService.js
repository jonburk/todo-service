'use strict';

var db = require('../db');
var _ = require('lodash');
var ObjectId = require('mongodb').ObjectID;
var moment = require('moment');

const DATE_PROPERTIES = ['dueDate', 'lastDueDate'].reduce((result, field) => {
  result[field] = {format: 'date'};
  return result;
}, {});

exports.tasksCategoriesGET = function(args, res, next) {
  /**
   * Gets the list of task category names currently in use
   *
   * returns List
   **/
  db.get().collection('tasks').distinct('category', function (err, result) {
    if (hasError(err, res)) return;  
    
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result || {}, null, 2));
  })
}

exports.tasksCleanupPOST = function(args, res, next) {
  /**
   * Removes completed tasks that are not configured to repeat
   *
   * no response value expected for this operation
   **/
  db.get().collection('tasks').deleteMany({ complete: true }, null, function (err, result) {
    if (hasError(err, res)) return;

    res.statusCode = result.deletedCount === 0 ? 304: 204;
    res.end();
  });
}

exports.tasksGET = function(args, res, next) {
  /**
   * Returns all tasks grouped by category and sorted by due date. 
   *
   * dueDate date The minimum due date of the tasks to return (optional)
   * returns List
   **/  
   var pipeline = [
     {
       $match: {
         complete: {$ne: true}
       }
     },
     {
       $sort: { dueDate: 1 }
     },     
     {
       $group: {
         _id: '$category', 
         tasks: { $push : "$$ROOT" }
       }
     }
   ]

  if (args.dueDate.value) {
    pipeline[0].$match = {$or: [{dueDate: {$lt: moment(args.dueDate.value).add(1, 'day').toDate()}, complete: {$ne: true}}, {dueDate: null, complete: {$ne: true}}]}
  }

  db.get().collection('tasks').aggregate(pipeline).toArray(function (err, result) {
    if (hasError(err, res)) return;   

    result.forEach(category => category.tasks.forEach(task => convertDates(task, DATE_PROPERTIES, true)));

    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result || {}, null, 2));
  })
}

exports.tasksIdCompleteDELETE = function(args, res, next) {
  /**
   * Uncompletes a task, restoring its previous due date
   *
   * id String Task ID
   * no response value expected for this operation
   **/
  db.get().collection('tasks').findOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;
    
    delete result._id;

    if (result.complete) {
      result.complete = false;
    }
    else if (result.lastDueDate) {
      result.dueDate = result.lastDueDate;
      result.lastDueDate = null;
    } else {
      res.statusCode = 304;
      res.end();
      return;
    }

    db.get().collection('tasks').updateOne({ _id: ObjectId(args.id.value) }, result, null, function(err, result) {
      if (hasError(err, res)) return;

      res.statusCode = result.modifiedCount === 0 ? 404: 204;
      res.end();
    });
  });
}

exports.tasksIdCompletePOST = function(args, res, next) {
  /**
   * Completes a task
   *
   * id String Task ID
   * no response value expected for this operation
   **/
  db.get().collection('tasks').findOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;
    
    delete result._id;

    if (result.dueDate) {
      result.lastDueDate = result.dueDate;
    }

    if (!_.isEmpty(result.repeat)) {
      var now = moment().utc();

      do {
        result.dueDate = moment(result.dueDate).add(result.repeat.rate, result.repeat.unit).toDate();
      } while (now.isSameOrAfter(result.dueDate));
    } else {
      result.complete = true;
      result.dueDate = null;
    }

    db.get().collection('tasks').updateOne({ _id: ObjectId(args.id.value) }, result, null, function(err, result) {
      if (hasError(err, res)) return;

      res.statusCode = result.modifiedCount === 0 ? 404: 204;
      res.end();
    });
  });
}

exports.tasksIdDELETE = function(args, res, next) {
  /**
   * Deletes a task
   *
   * id String Task ID
   * no response value expected for this operation
   **/
  db.get().collection('tasks').deleteOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;

    res.statusCode = result.deletedCount === 0 ? 404: 204;    
    res.end();
  });
}

exports.tasksIdGET = function(args, res, next) {
  /**
   * Gets a task
   *
   * id String Task ID
   * returns Task
   **/
  db.get().collection('tasks').findOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;

    if (_.isEmpty(result)) {
      res.statusCode = 404;
      res.end();
    } else {
      convertDates(result, DATE_PROPERTIES, true);      
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result || {}, null, 2));    
    }
  })
}

exports.tasksIdPUT = function(args, res, next) {
  /**
   * Updates a task
   *
   * id String Task ID
   * task Task The updated task
   * no response value expected for this operation
   **/
  delete args.task.value._id;
  convertDates(args.task.value, args.task.schema.schema.properties, false);

  db.get().collection('tasks').updateOne({ _id: ObjectId(args.id.value) }, args.task.value, null, function(err, result) {
    if (hasError(err, res)) return;

    res.statusCode = result.modifiedCount === 0 ? 404: 204;
    res.end();
  });
}

exports.tasksPOST = function(args, res, next) {
  /**
   * Adds a new task
   *
   * task Task The task to create
   * no response value expected for this operation
   **/

  convertDates(args.task.value, args.task.schema.schema.properties, false);

  db.get().collection('tasks').insert(args.task.value, function(err, result) {
    if (hasError(err, res)) return;

    res.setHeader('location', '/api/tasks/' + result.insertedIds[0]);
    res.statusCode = 201;
    res.end();
  })
}

function hasError(err, res) {
  if (err) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(err, nul, 2));
  }

  return err;
}

function convertDates(target, properties, toString) {
  Object.keys(properties)
    .filter(key => properties[key].format === 'date')
    .forEach(field => convertDate(target, field, toString));
}

function convertDate(target, field, toString) {
  if (target[field]) {    
    if (toString) {
      target[field] = moment(target[field]).format('YYYY-MM-DD');
    } else {
      target[field] = moment(target[field], 'YYYY-MM-DD').toDate();
    }
  }
}
