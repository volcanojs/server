const EVENT_TYPE = require('./eventType')

module.exports = async (socket, service) => {
  socket.on('volcano-on', async (params) => {
    const { eventType, query } = params
    const { ref } = query
    const room = `${ref}-${eventType}`
    socket.join(room)

    try {
      const data = await service.get(query)
      switch (eventType) {
        case EVENT_TYPE.VALUE:
          data && socket.emit(`${ref}-${eventType}-initing`, data)
          break
        case EVENT_TYPE.CHILD_ADDED:
          if (!data || typeof data !== 'object') return
          const keys = Object.keys(data)
          const keysCount = keys.length
          let i = 0
          const sendOne = () => {
            socket.emit(`${ref}-${eventType}-initing`, data[keys[i]], () => {
              ++i
              if (i < keysCount) sendOne()
            })
          }
          break
        default:
          break
      }
    } catch (error) {
      console.log(error)
    }
  })
}