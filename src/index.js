const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const mongodb = require('mongodb')
const MongoClient = mongodb.MongoClient
const ObjectID = mongodb.ObjectID
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')))

app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'pug')

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

// Connection URL
const url = 'mongodb://localhost:27017'
const dbName = 'volcanodb'
const collName = 'volcano-server'

// Use connect method to connect to the server
MongoClient.connect(url, (err, client) => {
  if (err) throw new Error('MongoClient Error')
  console.log("Connected successfully to server")

  server.listen(2306)

  const db = client.db(dbName)
  const coll = db.collection(collName)
  const service = require('./service')(db)

  app.get('/', (req, res) => {
    res.render('pages/home')
  })

  io.on('connection', function (socket) {
    console.log('Welcome', socket.id)
    // TODO: handle operations on root
    require('./event')({ io, socket, service })

    socket.on('/api/console/projects', async (_, callback) => {
      console.log('Hi')
      try {
        const projects = await coll.find({}).sort( { createdAt: -1 } ).toArray()
        console.log(projects)
        callback({ data: projects })
      } catch (error) {
        callback({ error })
      }
    })
    socket.on('post /api/console/project', async ({ name }, callback) => {
      try {
        const curTime = (new Date()).getTime()
        const result = await coll.insertOne({ name, createdAt: curTime, updatedAt: curTime })
        socket.emit('/api/console/project-new', result.ops[0])
        callback({})
      } catch (error) {
        callback({ error })
      }
    })
    socket.on('delete /api/console/project', async ({ _id }, callback) => {
      try {
        const curTime = (new Date()).getTime()
        const result = await coll.deleteOne({ _id: ObjectID(_id) })
        console.log(result)
        callback({ error: result.deletedCount > 0 ? null : 'Failed to delete.' })
      } catch (error) {
        callback({ error })
      }
    })
  })
})

