const service = require('../service')
const EVENT_TYPE = require('./eventType')

module.exports = async ({ socket }) => {
  socket.on('volcano-on', async ({ eventType, query }) => {
    const { ref, bucketName } = query
    const room = `${bucketName}/${ref}-${eventType}`
    socket.join(room)

    try {
      const data = await service.get(query)
      console.log(eventType)
      switch (eventType) {
        case EVENT_TYPE.VALUE:
          const result = { snapshotData: data }
          console.log(data)
          console.log(`${room}-initing`)
          data && socket.emit(`${room}-initing`, result, () => {
            socket.emit(`${room}-inited`)
          })
          break
        case EVENT_TYPE.CHILD_ADDED:
          if (!data || typeof data !== 'object') return
          const keys = Object.keys(data)
          const keysCount = keys.length
          let i = 0
          const sendOne = () => {
            const result = { snapshotData: data[keys[i]] }
            socket.emit(`${room}-initing`, result, () => {
              ++i
              if (i < keysCount) {
                sendOne()
              } else {
                socket.emit(`${room}-inited`)
              }
            })
          }
          if (keyCount) sendOne()
          break
        default:
          socket.emit(`${room}-inited`)
          break
      }
    } catch (error) {
      console.log(error)
    }
  })
}