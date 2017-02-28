'use strict';

var url = require('url');

var TaskService = require('./TaskService');

module.exports.tasksCategoriesGET = function tasksCategoriesGET (req, res, next) {
  TaskService.tasksCategoriesGET(req.swagger.params, res, next);
};

module.exports.tasksCleanupPOST = function tasksCleanupPOST (req, res, next) {
  TaskService.tasksCleanupPOST(req.swagger.params, res, next);
};

module.exports.tasksGET = function tasksGET (req, res, next) {
  TaskService.tasksGET(req.swagger.params, res, next);
};

module.exports.tasksIdCompleteDELETE = function tasksIdCompleteDELETE (req, res, next) {
  TaskService.tasksIdCompleteDELETE(req.swagger.params, res, next);
};

module.exports.tasksIdCompletePOST = function tasksIdCompletePOST (req, res, next) {
  TaskService.tasksIdCompletePOST(req.swagger.params, res, next);
};

module.exports.tasksIdDELETE = function tasksIdDELETE (req, res, next) {
  TaskService.tasksIdDELETE(req.swagger.params, res, next);
};

module.exports.tasksIdGET = function tasksIdGET (req, res, next) {
  TaskService.tasksIdGET(req.swagger.params, res, next);
};

module.exports.tasksIdPUT = function tasksIdPUT (req, res, next) {
  TaskService.tasksIdPUT(req.swagger.params, res, next);
};

module.exports.tasksPOST = function tasksPOST (req, res, next) {
  TaskService.tasksPOST(req.swagger.params, res, next);
};
