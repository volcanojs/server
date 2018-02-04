const EVENT_TYPE = require('./eventType')

module.exports = async ({ socket, service }) => {
  socket.on('volcano-on', async (params) => {
    const { eventType, query } = params
    const { ref } = query
    const room = `${ref}-${eventType}`
    console.log(room)
    socket.join(room, () => {
      let rooms = Object.keys(socket.rooms);
      console.log(rooms); // [ <socket.id>, 'room 237' ]
    })

    try {
      const data = await service.get(query)
      switch (eventType) {
        case EVENT_TYPE.VALUE:
          console.log(data)
          console.log(`${ref}-${eventType}-initing`)
          data && socket.emit(`${ref}-${eventType}-initing`, data, () => {
            socket.emit(`${ref}-${eventType}-inited`)
          })
          break
        case EVENT_TYPE.CHILD_ADDED:
          if (!data || typeof data !== 'object') return
          const keys = Object.keys(data)
          const keysCount = keys.length
          let i = 0
          const sendOne = () => {
            socket.emit(`${ref}-${eventType}-initing`, data[keys[i]], () => {
              ++i
              if (i < keysCount) {
                sendOne()
              } else {
                socket.emit(`${ref}-${eventType}-inited`)
              }
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