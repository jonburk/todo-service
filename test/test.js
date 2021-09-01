/* eslint-env mocha */

var expect = require('expect')
var createServer = require('../index').createServer
var db = require('../db')
var serviceOptions = require('../serviceOptions')
var _ = require('lodash')
var moment = require('moment')
var ObjectId = require('mongodb').ObjectID
var sinon = require('sinon')
var mongo = require('mongodb').MongoClient
var request = null
var tasks = null
var sandbox

describe('API Tests', function () {
  before(function (done) {
    serviceOptions.create(process.env.NODE_ENV, function(options) {
      createServer(options, function (app) {
        tasks = db.get().collection('tasks')
        request = require('supertest')(app)
        done()
      })
    })
  })

  describe('Integration tests', function () {
    beforeEach(function (done) {
      clearCollection(done)
    })

    after(function (done) {
      clearCollection(done)
    })

    it('should get multiple categories', function (done) {
      tasks.insertMany(generateTasks(2, 2), function (err, result) {
        if (err) return done(err)

        request.get('/api/tasks/categories')
          .expect(200, ['Category 1', 'Category 2'])
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should get a single category', function (done) {
      tasks.insertMany(generateTasks(1, 2), function (err, result) {
        if (err) return done(err)

        request.get('/api/tasks/categories')
          .expect(200, ['Category 1'])
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should get no categories', function (done) {
      request.get('/api/tasks/categories')
        .expect(200, [])
        .end(function (err, res) {
          if (err) return done(err)
          done()
        })
    })

    it('should cleanup completed tasks', function (done) {
      var input = [
        {
          name: 'Keeper 1'
        },
        {
          name: 'Keeper 2',
          complete: false
        },
        {
          name: 'Delete me',
          complete: true
        }
      ]

      var expected = _.cloneDeep(input).slice(0, 2)

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/cleanup')
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, res) {
              if (err) return done(err)

              stripIds(res)
              expect(res).toEqual(expected)
              done()
            })
          })
      })
    })

    it('should do nothing on cleanup if there are no completed tasks', function (done) {
      var input = [
        {
          name: 'Keeper 1'
        },
        {
          name: 'Keeper 2',
          complete: false
        }
      ]

      var expected = _.cloneDeep(input)

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/cleanup')
          .expect(304)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, res) {
              if (err) return done(err)

              stripIds(res)
              expect(res).toEqual(expected)
              done()
            })
          })
      })
    })

    it('should return an empty list of tasks', function (done) {
      request.get('/api/tasks')
        .expect(200, [])
        .end(function (err, res) {
          if (err) return done(err)
          done()
        })
    })

    it('should return tasks grouped by a single category', function (done) {
      var input = generateTasks(1, 2)

      var expected = [
        {
          _id: 'Category 1',
          tasks: _.cloneDeep(input)
        }
      ]

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.get('/api/tasks')
          .end(function (err, res) {
            if (err) return done(err)

            _.forEach(res.body, function (category) {
              stripIds(category.tasks)
            })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(expected)
            done()
          })
      })
    })

    it('should return tasks grouped by multiple categories', function (done) {
      var input = generateTasks(2, 2)

      var expected = [
        {
          _id: 'Category 1',
          tasks: _.cloneDeep(input.slice(0, 2))
        },
        {
          _id: 'Category 2',
          tasks: _.cloneDeep(input.slice(2, 4))
        }
      ]

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.get('/api/tasks')
          .end(function (err, res) {
            if (err) return done(err)

            _.forEach(res.body, function (category) {
              stripIds(category.tasks)
            })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(expected)
            done()
          })
      })
    })

    it('should return a list of tasks filtered by due date', function (done) {
      var input = generateTasks(1, 3)
      input[0].dueDate = moment('2020-01-01T00:00:00.000').toDate()
      input[1].dueDate = moment('2020-01-02T00:00:00.000').toDate()
      input[2].dueDate = moment('2020-01-03T00:00:00.000').toDate()

      var expected = [
        {
          _id: 'Category 1',
          tasks: _.cloneDeep(input.slice(0, 2))
        }
      ]

      _.forEach(expected[0].tasks, function (task) {
        task.dueDate = moment(task.dueDate).format('YYYY-MM-DD')
      })

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.get('/api/tasks')
          .query({ dueDate: moment('2020-01-02T00:00:00.000').format('YYYY-MM-DD') })
          .end(function (err, res) {
            if (err) return done(err)

            _.forEach(res.body, function (category) {
              stripIds(category.tasks)
            })

            expect(res.status).toBe(200)
            expect(res.body).toEqual(expected)
            done()
          })
      })
    })

    it('should return an empty list when all tasks exceed the due date', function (done) {
      var input = generateTasks(1, 1)
      input[0].dueDate = moment().add(1, 'day').toDate()

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.get('/api/tasks')
          .query({ dueDate: moment().format('YYYY-MM-DD') })
          .expect(200, [])
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should un-complete a non-recurring task', function (done) {
      var input = [
        {
          name: 'target',
          complete: true
        },
        {
          name: 'not-target',
          complete: true
        }
      ]

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.delete('/api/tasks/' + input[0]._id.toString() + '/complete')
          .end(function (err, res) {
            if (err) return done(err)

            expect(res.status).toBe(204)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)

              _.forEach(result, function (task) {
                if (task.name === 'target') {
                  expect(task.complete).toBe(false)
                } else {
                  expect(task.complete).toBe(true)
                }
              })

              done()
            })
          })
      })
    })

    it('should un-complete a recurring task', function (done) {
      var input = [
        {
          name: 'target',
          lastDueDate: '2010-01-01',
          dueDate: '2010-02-01'
        },
        {
          name: 'not-target',
          lastDueDate: '2010-01-01',
          dueDate: '2010-02-01'
        }
      ]

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.delete('/api/tasks/' + input[0]._id.toString() + '/complete')
          .end(function (err, res) {
            if (err) return done(err)

            expect(res.status).toBe(204)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)

              _.forEach(result, function (task) {
                if (task.name === 'target') {
                  expect(task.lastDueDate).toBeFalsy()
                  expect(task.dueDate).toBe('2010-01-01')
                } else {
                  expect(task.lastDueDate).toBe('2010-01-01')
                  expect(task.dueDate).toBe('2010-02-01')
                }
              })

              done()
            })
          })
      })
    })

    it('should take no action if trying to un-complete an incomplete task', function (done) {
      var input = {
        name: 'target'
      }

      tasks.insertOne(input, function (err, result) {
        if (err) return done(err)

        request.delete('/api/tasks/' + input._id.toString() + '/complete')
          .end(function (err, res) {
            if (err) return done(err)

            expect(res.status).toBe(304)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(1)
              expect(result[0].complete).toBeFalsy()
              done()
            })
          })
      })
    })

    it('should return an error if trying to complete a task that does not exist', function (done) {
      tasks.insertOne({ name: 'test' }, function (err, result) {
        if (err) return done(err)

        request.delete('/api/tasks/' + new ObjectId() + '/complete')
          .expect(404)
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should complete non-recurring tasks without due dates', function (done) {
      var input = generateTasks(1, 2)
      input[1].name = 'target'

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/' + input[1]._id.toString() + '/complete')
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)
              _.forEach(result, function (task) {
                if (task.name === 'target') {
                  expect(task.complete).toBeTruthy()
                } else {
                  expect(task.complete).toBeFalsy()
                }

                expect(task.dueDate).toBeFalsy()
                expect(task.lastDueDate).toBeFalsy()
              })

              done()
            })
          })
      })
    })

    it('should complete non-recurring tasks with due dates', function (done) {
      var input = generateTasks(1, 2)
      input[1].name = 'target'
      input[1].dueDate = '2010-01-02'

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/' + input[1]._id.toString() + '/complete')
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)
              _.forEach(result, function (task) {
                if (task.name === 'target') {
                  expect(task.complete).toBeTruthy()
                  expect(task.lastDueDate).toBe('2010-01-02')
                } else {
                  expect(task.complete).toBeFalsy()
                  expect(task.lastDueDate).toBeFalsy()
                }

                expect(task.dueDate).toBeFalsy()
              })

              done()
            })
          })
      })
    })

    it('should complete recurring tasks without due dates', function (done) {
      var input = generateTasks(1, 2)
      input[1].name = 'target'
      input[1].repeat = {
        rate: 2,
        unit: 'days'
      }

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/' + input[1]._id.toString() + '/complete')
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)
              _.forEach(result, function (task) {
                if (task.name === 'target') {
                  expect(moment(task.dueDate).format('YYYY-MM-DD'))
                    .toEqual(moment().add(2, 'days').format('YYYY-MM-DD'))
                } else {
                  expect(task.dueDate).toBeFalsy()
                }

                expect(task.complete).toBeFalsy()
                expect(task.lastDueDate).toBeFalsy()
              })

              done()
            })
          })
      })
    })

    it('should complete recurring tasks with due dates', function (done) {
      var input = generateTasks(1, 2)
      input[1].name = 'target'
      input[1].dueDate = moment().format('YYYY-MM-DD')
      input[1].repeat = {
        rate: 2,
        unit: 'days'
      }

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/' + input[1]._id.toString() + '/complete')
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)
              _.forEach(result, function (task) {
                if (task.name === 'target') {
                  expect(moment(task.dueDate).format('YYYY-MM-DD'))
                    .toEqual(moment().add(2, 'days').format('YYYY-MM-DD'))
                  expect(moment(task.lastDueDate).format('YYYY-MM-DD'))
                    .toEqual(moment().format('YYYY-MM-DD'))
                } else {
                  expect(task.dueDate).toBeFalsy()
                  expect(task.lastDueDate).toBeFalsy()
                }

                expect(task.complete).toBeFalsy()
              })

              done()
            })
          })
      })
    })

    it('should complete recurring tasks and ensure next due date is in the future', function (done) {
      var input = generateTasks(1, 2)
      input[1].name = 'target'
      input[1].dueDate = moment().add(-3, 'days').format('YYYY-MM-DD')
      input[1].repeat = {
        rate: 2,
        unit: 'days'
      }

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/' + input[1]._id.toString() + '/complete')
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)
              _.forEach(result, function (task) {
                if (task.name === 'target') {
                  expect(moment(task.dueDate).format('YYYY-MM-DD'))
                    .toEqual(moment().add(1, 'days').format('YYYY-MM-DD'))
                  expect(moment(task.lastDueDate).format('YYYY-MM-DD'))
                    .toEqual(moment().add(-3, 'days').format('YYYY-MM-DD'))
                } else {
                  expect(task.dueDate).toBeFalsy()
                  expect(task.lastDueDate).toBeFalsy()
                }

                expect(task.complete).toBeFalsy()
              })

              done()
            })
          })
      })
    })

    it('should return an error if trying to complete a task that does not exist', function (done) {
      tasks.insertOne({ name: 'test' }, function (err, result) {
        if (err) return done(err)

        request.post('/api/tasks/' + new ObjectId() + '/complete')
          .expect(404)
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should delete a task', function (done) {
      var input = generateTasks(1, 2)
      input[0].name = 'keeper'

      tasks.insertMany(input, function (err, result) {
        if (err) return done(err)

        request.delete('/api/tasks/' + input[1]._id.toString())
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(1)
              expect(result[0].name).toBe('keeper')

              done()
            })
          })
      })
    })

    it('should return an error if trying to delete a task that does not exist', function (done) {
      tasks.insertOne({ name: 'test' }, function (err, result) {
        if (err) return done(err)

        request.delete('/api/tasks/' + new ObjectId())
          .expect(404)
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should get a task', function (done) {
      var input = {
        name: 'target',
        dueDate: moment().format('YYYY-MM-DD')
      }

      var expected = _.cloneDeep(input)

      tasks.insertOne(input, function (err, result) {
        if (err) return done(err)

        expected._id = input._id.toString()

        request.get('/api/tasks/' + input._id)
          .expect(200, expected)
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should return an error if trying to get a task that does not exist', function (done) {
      tasks.insertOne({ name: 'test' }, function (err, result) {
        if (err) return done(err)

        request.get('/api/tasks/' + new ObjectId())
          .expect(404)
          .end(function (err, res) {
            if (err) return done(err)
            done()
          })
      })
    })

    it('should update a task', function (done) {
      var initialValues = [
        {
          name: 'unchanged'
        },
        {
          name: 'target',
          dueDate: '2010-01-02',
          category: 'test',
          repeat: {
            rate: 1,
            unit: 'days'
          }
        }
      ]

      tasks.insertMany(initialValues, function (err, result) {
        if (err) return done(err)

        var input = {
          _id: initialValues[1]._id.toString(),
          name: 'target-mod',
          dueDate: '2011-02-03',
          category: 'test-mod',
          repeat: {
            rate: 2,
            unit: 'weeks'
          }
        }

        request.put('/api/tasks/' + input._id)
          .send(input)
          .expect(204)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)
              var unchanged = result.find(function (item) {
                return item.name === 'unchanged'
              })

              var changed = result.find(function (item) {
                return item.name === 'target-mod'
              })

              expect(unchanged).toBeTruthy()
              expect(changed).toBeTruthy()

              expect(unchanged.dueDate).toBeFalsy()
              expect(unchanged.category).toBeFalsy()
              expect(unchanged.repeat).toBeFalsy()

              expect(moment(changed.dueDate).format('YYYY-MM-DD')).toBe('2011-02-03')
              expect(changed.category).toBe('test-mod')
              expect(changed.repeat).toBeTruthy()
              expect(changed.repeat.rate).toBe(2)
              expect(changed.repeat.unit).toBe('weeks')

              done()
            })
          })
      })
    })

    it('should return an error if trying to update a task that does not exist', function (done) {
      tasks.insertOne({ name: 'test' }, function (err, result) {
        if (err) return done(err)

        var input = {
          _id: new ObjectId(),
          name: 'test-mod'
        }

        request.put('/api/tasks/' + input._id.toString())
          .send(input)
          .expect(404)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(1)
              expect(result[0].name).toBe('test')
              done()
            })
          })
      })
    })

    it('should create a new task', function (done) {
      tasks.insertOne({ name: 'original' }, function (err, result) {
        if (err) return done(err)

        var input = {
          name: 'target',
          category: 'test',
          dueDate: '2010-01-02',
          repeat: {
            rate: 1,
            unit: 'days'
          }
        }

        request.post('/api/tasks')
          .send(input)
          .expect(201)
          .end(function (err, res) {
            if (err) return done(err)

            tasks.find().toArray(function (err, result) {
              if (err) return done(err)

              expect(result.length).toBe(2)

              var original = result.find(function (item) {
                return item.name === 'original'
              })

              var target = result.find(function (item) {
                return item.name === 'target'
              })

              expect(original).toBeTruthy()
              expect(target).toBeTruthy()

              expect(original.dueDate).toBeFalsy()
              expect(original.category).toBeFalsy()
              expect(original.repeat).toBeFalsy()

              expect(moment(target.dueDate).format('YYYY-MM-DD')).toBe('2010-01-02')
              expect(target.category).toBe('test')
              expect(target.repeat).toBeTruthy()
              expect(target.repeat.unit).toBe('days')
              expect(target.repeat.rate).toBe(1)

              expect(res.headers.location).toBe('/api/tasks/' + target._id.toString())
              done()
            })
          })
      })
    })
  })

  describe('Database error tests', function () {
    var collection
    var cursor

    before(function () {
      sandbox = sinon.sandbox.create()
    })

    beforeEach(function () {
      cursor = {
        toArray: sandbox.stub().callsArgWith(0, 'Error')
      }

      collection = {
        distinct: sandbox.stub().callsArgWith(1, 'Error'),
        deleteMany: sandbox.stub().callsArgWith(2, 'Error'),
        aggregate: sandbox.stub().returns(cursor),
        findOne: sandbox.stub().callsArgWith(1, 'Error'),
        updateOne: sandbox.stub().callsArgWith(3, 'Error'),
        deleteOne: sandbox.stub().callsArgWith(1, 'Error'),
        insertOne: sandbox.stub().callsArgWith(1, 'Error')
      }

      sandbox.stub(db.get(), 'collection').withArgs('tasks').returns(collection)
    })

    afterEach(function () {
      sandbox.restore()
    })

    it('should handle a database error for GET /api/tasks/categories', function (done) {
      request.get('/api/tasks/categories')
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error for POST /api/tasks/cleanup', function (done) {
      request.post('/api/tasks/cleanup')
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error for GET /api/tasks', function (done) {
      request.get('/api/tasks')
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error finding a task for DELETE /api/tasks/:id/complete', function (done) {
      request.delete('/api/tasks/' + new ObjectId() + '/complete')
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error updating a task for DELETE /api/tasks/:id/complete', function (done) {
      var result = { complete: true }
      collection.findOne = sandbox.stub().callsArgWith(1, null, result)

      request.delete('/api/tasks/' + new ObjectId() + '/complete')
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error finding a task for POST /api/tasks/:id/complete', function (done) {
      request.post('/api/tasks/' + new ObjectId() + '/complete')
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error updating a task for POST /api/tasks/:id/complete', function (done) {
      var result = { complete: false }
      collection.findOne = sandbox.stub().callsArgWith(1, null, result)

      request.post('/api/tasks/' + new ObjectId() + '/complete')
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error for DELETE /api/tasks/:id', function (done) {
      request.delete('/api/tasks/' + new ObjectId())
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error for GET /api/tasks/:id', function (done) {
      request.get('/api/tasks/' + new ObjectId())
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error for PUT /api/tasks/:id', function (done) {
      var input = {
        _id: new ObjectId(),
        name: 'target'
      }

      request.put('/api/tasks/' + input._id)
        .send(input)
        .expect(500)
        .expect('"Error"', done)
    })

    it('should handle a database error for POST /api/tasks', function (done) {
      var input = {
        name: 'target'
      }

      request.post('/api/tasks')
        .send(input)
        .expect(500)
        .expect('"Error"', done)
    })
  })
})

describe('Database connection error tests', function () {
  before(function () {
    sandbox = sinon.sandbox.create()
  })

  afterEach(function () {
    sandbox.restore()
  })

  it('should handle a database connection error', function (done) {
    sandbox.stub(mongo, 'connect').callsArgWith(1, 'Error')
    createServer({ db: { connectionString: '' } }, function (app) {
      expect(db.get()).toBeFalsy()
      expect(app).toBeFalsy()
      done()
    })
  })
})

function clearCollection (done) {
  tasks.deleteMany(null, null, function (err) {
    if (err) return done(err)
    done()
  })
}

function generateTasks (categoryCount, tasksPerCategories) {
  var result = []

  for (var i = 0; i < categoryCount; i++) {
    for (var j = 0; j < tasksPerCategories; j++) {
      result.push({
        name: 'Task ' + (j + 1),
        category: 'Category ' + (i + 1)
      })
    }
  }

  return result
}

function stripIds (target) {
  if (_.isArray(target)) {
    _.forEach(target, function (item) {
      stripIds(item)
    })
  } else {
    if (_.has(target, '_id')) {
      delete target._id
    }
  }
}
