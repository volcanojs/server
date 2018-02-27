const service = require('../service')

module.exports = async ({ socket }) => {
  socket.on('volcano-off', async ({ room }, onComplete) => {
    socket.leave(room)
    console.log('---leave room:', room, '---')
    onComplete()
  })
}
