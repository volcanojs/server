const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)
const path = require('path')

app.use(express.static(path.join(__dirname, 'public')))

app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'pug')

const bodyParser = require('body-parser')
const jsonParser = bodyParser.json()

const { clusterManager } = require('./couchbase')
const service = require('./service')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
  // application specific logging, throwing an error, or other logic here
})

app.get('/', (req, res) => {
  res.render('pages/home')
})

io.on('connection', function (socket) {
  console.log('Welcome', socket.id)
  // TODO: handle operations on root
  require('./event')({ socket, io })

  socket.on('/api/console/projects', async (_, callback) => {
    clusterManager.listBuckets((error, bucketsInfo) => {
      if (error) {
        console.log(`Listing buckets info failed:`, error)
        callback({ error })
      }
      const bucketNames = bucketsInfo.map(bucket => bucket.name)
      callback({ data: bucketNames })
    })
  })
  socket.on('post /api/console/project', async ({ name }, callback) => {

    clusterManager.createBucket(name, {}, (error) => {
      if (error) {
        console.log(`Creation of ${name} bucket failed:`, error)
        callback({ error })
      }
      socket.emit('/api/console/project-new', name)
      callback({ data: name })
    })
  })
  socket.on('delete /api/console/project', async ({ name }, callback) => {
    clusterManager.removeBucket(name, (error) => {
      if (error) {
        console.log(`Could not delete ${name} bucket: `, error)
        callback({ error })
      }
      callback({})
    })
  })
})

server.listen(2306)
