const app = require('express')()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const MongoClient = require('mongodb').MongoClient
const assert = require('assert')

server.listen(2306)

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html')
})

// Connection URL
const url = 'mongodb://localhost:27017'
const dbName = 'volcano-server'

// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err)
  console.log("Connected successfully to server")

  const db = client.db(dbName)
  const service = require('./service')(db)

  io.on('connection', function (socket) {
    // TODO: handle operations on root
    require('./events')(socket, service)
  })
})

