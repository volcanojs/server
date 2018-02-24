const service = require('../service')

module.exports = async ({ socket, io }) => {
  socket.on('volcano-update', async ({ query }, onComplete) => {
    try {
      await service.update({ io, query })
      onComplete()
    } catch (error) {
      onComplete(error)
    }
  })
}
