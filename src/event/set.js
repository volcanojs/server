module.exports = async ({ socket, service, io }) => {
  socket.on('volcano-set', async (params, onComplete) => {
    const { query } = params
    try {
      const updatedSnapshotData = await service.set({ io, query })
      onComplete({ updatedSnapshotData })
    } catch (error) {
      console.log(error)
      onComplete({ error })
    }
  })
}
