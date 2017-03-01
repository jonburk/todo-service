'use strict';

var dbHost = require('../index');
var _ = require('lodash');
var ObjectId = require('mongodb').ObjectID;
var moment = require('moment');

exports.tasksCategoriesGET = function(args, res, next) {
  /**
   * Gets the list of task category names currently in use
   *
   * returns List
   **/
  dbHost.getDb().collection('tasks').distinct('category', function (err, result) {
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
  dbHost.getDb().collection('tasks').deleteMany({ dueDate: null }, null, function (err, result) {
    if (hasError(err, res)) return;

    if (result.deletedCount > 0) {
      res.statusCode = 204;
    } else {
      res.statusCode = 304;
    }

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
       $sort: { dueDate: 1 }
     },     
     {
       $group: {
         _id: '$category', 
         tasks: { $push : "$$ROOT" }
       }
     }
   ]

  dbHost.getDb().collection('tasks').aggregate(pipeline).toArray(function (err, result) {
    if (hasError(err, res)) return;   
    
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
  dbHost.getDb().collection('tasks').findOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;
    
    delete result._id;

    if (result.lastDueDate) {
      result.dueDate = result.lastDueDate;
      result.lastDueDate = null;
    } else {
      res.statusCode = 304;
      res.end();
      return;
    }

    dbHost.getDb().collection('tasks').updateOne({ _id: ObjectId(args.id.value) }, result, null, function(err, result) {
      if (hasError(err, res)) return;

      if (result.modifiedCount === 0) {
        res.statusCode = 404;
      } else {
        res.statusCode = 204;
      }

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
  dbHost.getDb().collection('tasks').findOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;
    
    delete result._id;

    if (result.dueDate) {
      result.lastDueDate = result.dueDate;
    }

    if (!_.isEmpty(result.repeat)) {
      var now = moment();

      do {
        result.dueDate = moment(result.dueDate).add(result.repeat.rate, result.repeat.unit).format('YYYY-MM-DD');
      } while (now.isSameOrAfter(result.dueDate));
    } else {
      result.dueDate = null;
    }

    dbHost.getDb().collection('tasks').updateOne({ _id: ObjectId(args.id.value) }, result, null, function(err, result) {
      if (hasError(err, res)) return;

      if (result.modifiedCount === 0) {
        res.statusCode = 404;
      } else {
        res.statusCode = 204;
      }

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
  dbHost.getDb().collection('tasks').deleteOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;

    if (result.deletedCount === 0) {
      res.statusCode = 404;
    } else {
      res.statusCode = 204;
    }
    
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
  dbHost.getDb().collection('tasks').findOne({ _id: ObjectId(args.id.value) }, function(err, result) {
    if (hasError(err, res)) return;

    if (_.isEmpty(result)) {
      res.statusCode = 404;
      res.end();
    } else {
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

  dbHost.getDb().collection('tasks').updateOne({ _id: ObjectId(args.id.value) }, args.task.value, null, function(err, result) {
    if (hasError(err, res)) return;

    if (result.modifiedCount === 0) {
      res.statusCode = 404;
    } else {
      res.statusCode = 204;
    }

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
  dbHost.getDb().collection('tasks').insert(args.task.value, function(err, result) {
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

