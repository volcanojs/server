module.exports = async ({ socket, service }) => {
  socket.on('volcano-off', async ({ room }, onComplete) => {
    socket.leave(room)
    console.log('---leave room:', room, '---')
    onComplete()
  })
}
