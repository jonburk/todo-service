'use strict';

exports.tasksCategoriesGET = function(args, res, next) {
  /**
   * Gets the list of task category names currently in use
   *
   * returns List
   **/
  var examples = {};
  examples['application/json'] = [ "aeiou" ];
  if (Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  } else {
    res.end();
  }
}

exports.tasksCleanupPOST = function(args, res, next) {
  /**
   * Removes completed tasks that are not configured to repeat
   *
   * no response value expected for this operation
   **/
  res.end();
}

exports.tasksGET = function(args, res, next) {
  /**
   * Returns all tasks grouped by category and sorted by due date. 
   *
   * dueDate date The minimum due date of the tasks to return (optional)
   * returns List
   **/
  var examples = {};
  examples['application/json'] = [ {
  "dueDate" : "2000-01-23",
  "repeat" : {
    "unit" : "aeiou",
    "rate" : 123
  },
  "name" : "aeiou",
  "id" : "aeiou",
  "category" : "aeiou",
  "lastDueDate" : "2000-01-23"
} ];
  if (Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  } else {
    res.end();
  }
}

exports.tasksIdCompleteDELETE = function(args, res, next) {
  /**
   * Uncompletes a task, restoring its previous due date
   *
   * id String Task ID
   * no response value expected for this operation
   **/
  res.end();
}

exports.tasksIdCompletePOST = function(args, res, next) {
  /**
   * Completes a task
   *
   * id String Task ID
   * no response value expected for this operation
   **/
  res.end();
}

exports.tasksIdDELETE = function(args, res, next) {
  /**
   * Deletes a task
   *
   * id String Task ID
   * no response value expected for this operation
   **/
  res.end();
}

exports.tasksIdGET = function(args, res, next) {
  /**
   * Gets a task
   *
   * id String Task ID
   * returns Task
   **/
  var examples = {};
  examples['application/json'] = {
  "dueDate" : "2000-01-23",
  "repeat" : {
    "unit" : "aeiou",
    "rate" : 123
  },
  "name" : "aeiou",
  "id" : "aeiou",
  "category" : "aeiou",
  "lastDueDate" : "2000-01-23"
};
  if (Object.keys(examples).length > 0) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(examples[Object.keys(examples)[0]] || {}, null, 2));
  } else {
    res.end();
  }
}

exports.tasksIdPUT = function(args, res, next) {
  /**
   * Updates a task
   *
   * id String Task ID
   * task Task The updated task
   * no response value expected for this operation
   **/
  res.end();
}

exports.tasksPOST = function(args, res, next) {
  /**
   * Adds a new task
   *
   * task Task The task to create
   * no response value expected for this operation
   **/
  res.end();
}

