const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const MongoClient = require('mongodb').MongoClient
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
    coll.find({}).toArray()
      .then(projects => {
        res.render('pages/home', {
          projects,
        })
      })
      .catch(error => res.status(500).json({ error }))
  })

  app.post('/api/console/project', jsonParser, (req, res) => {
    try {
      const { name } = req.body
      const curTime = (new Date()).getTime()
      coll.insertOne({ name, createdAt: curTime, updatedAt: curTime })
        .then(doc => res.status(200).json(doc))
        .catch(error => res.status(400).json({ error }))
    } catch (error) {
      return res.status(400).json({ error })
    }
    // coll.insertOne( { x: 1 } )
  })

  io.on('connection', function (socket) {
    // TODO: handle operations on root
    require('./event')({ io, socket, service })
  })
})

