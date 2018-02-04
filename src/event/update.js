module.exports = async ({ socket, service, io }) => {
  socket.on('volcano-update', async ({ query }, onComplete) => {
    try {
      const updatedSnapshotData = await service.update({ io, query })
      onComplete({ updatedSnapshotData })
    } catch (error) {
      console.log(error)
      onComplete({ error })
    }
  })
}
