const service = require('../service')
module.exports = async ({ socket, io }) => {
  socket.on('volcano-set', async ({ query }, onComplete) => {
    try {
      await service.set({ query, io })
      onComplete()
    } catch (error) {
      onComplete(error)
    }
  })
}
