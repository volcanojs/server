module.exports = async (socket, service) => {
  socket.on('volcano-set', async (params, onComplete) => {
    const { query } = params
    try {
      const updatedData = await service.set({ socket, query })
      onComplete({ updatedData })
    } catch (error) {
      console.log(error)
      onComplete({ error })
    }
  })
}
