const isPlainObject = require('lodash.isplainobject')
const service = require('../service')
const { SnapshotRaw } = require('../models')
const EVENT_TYPE = require('./eventType')
const { orderedKeys } = require('../utils')

module.exports = async ({ socket }) => {
  socket.on('volcano-on', async ({ eventType, query }) => {
    const { ref, bucketName } = query
    const room = `${bucketName}/${ref}-${eventType}`
    socket.join(room)

    try {
      console.log({eventType, query})
      const data = await service.get(query)
      console.log(eventType)
      switch (eventType) {
        case EVENT_TYPE.VALUE:
          console.log(`${room}-initing`)
          const snapshotRaw = SnapshotRaw({ ref, value: data })
          const result = { snapshotRaw }
          console.log(result)
          data && socket.emit(`${room}-initing`, result, () => {
            socket.emit(`${room}-inited`)
          })
          break
        case EVENT_TYPE.CHILD_ADDED:
          if (!data || !isPlainObject(data)) return
          const keys = data ? orderedKeys(data) : []
          console.log(data, keys)
          const keysCount = keys.length
          let i = 0
          const sendOne = () => {
            const childKey = keys[i]
            const childRef = `${ref}/${childKey}`
            const childSnapshotRaw = SnapshotRaw({ ref: childRef, value: data[childKey]})
            const result = { snapshotRaw: childSnapshotRaw }
            socket.emit(`${room}-initing`, result, () => {
              ++i
              if (i < keysCount) {
                sendOne()
              } else {
                socket.emit(`${room}-inited`)
              }
            })
          }
          if (keysCount) sendOne()
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