const isPlainObject = require('lodash.isplainobject')
const { deepdiff, isEmptyData, orderedKeys, RoomName } = require('../utils')
const { SnapshotRaw } = require('../models')
const EVENT_TYPE = require('../event/eventType')

const notifyDiff = ({ io, service, bucketName, key, diff }) => {
  console.log(Object.keys(service))
  // define methods
  const notifyRootDiff = async ({ bucketName, key, diff }) => {
    if (!diff) return
  
    // Notify root level change
    const { oldData, newData } = diff
  
    const isCreate = isEmptyData(oldData) && !isEmptyData(newData)
    const isRemove = !isEmptyData(oldData) && isEmptyData(newData)
  
    const rootRef = `${bucketName}`
    const firstLevelChildRef = `${rootRef}/${key}`
  
    try {
      const rootData = await service.getRoot(bucketName)
  
      // Notify root level change [value]
      const rootDataSnapshot = SnapshotRaw({ ref: rootRef, value: rootData })
      Notify.value({ ref: rootRef, snapshotRaw: rootDataSnapshot })
  
      // Notify root level change [childRemoved]
      if (isRemove) {
        const firstLevelChildDataSnapshot = SnapshotRaw({ ref: firstLevelChildRef, value: oldData })
        Notify.chiledRemoved({ ref: rootRef, snapshotRaw: firstLevelChildDataSnapshot })
        return
      }
      
      const rootChildKeys = orderedKeys(rootData)
      const firstLevelChildDataSnapshot = SnapshotRaw({ ref: firstLevelChildRef, value: newData })
      const curChildIndex = rootChildKeys.findIndex(childKey => childKey === key)
      const prevChildKey = curChildIndex === 0 ? null : rootChildKeys[curChildIndex - 1]
      
      // Notify root level change [childAdded]
      if (isCreate) {
        Notify.childAdded({ ref: rootRef, snapshotRaw: firstLevelChildDataSnapshot, prevChildKey })
        return
      }
  
      /**
       * const isChange = !isCreate && !isRemove
       * if (isChange) {
       */
      // Notify root level change [childChanged]
      Notify.childChanged({ ref: rootRef, snapshotRaw: firstLevelChildDataSnapshot, prevChildKey })
      // Notify child change
      notifyChildDiff({ ref: firstLevelChildRef, diff })
      /**
       * }
       */
      return
    } catch (error) {
      // TODO: logger
      console.log('[notifyDiff] Error: failed to notify root level change.')
      console.log(error)
      return
    }
  }
  
  const notifyChildDiff = ({ ref, diff }) => {
    const { oldData, newData, childAdded, childChanged, childRemoved } = diff

    const dataSnapshot = SnapshotRaw({ ref: ref, value: newData })
    Notify.value({ ref, snapshotRaw: dataSnapshot })
    
    if (childAdded) {
      const childKeys = orderedKeys(childAdded)
      childKeys.forEach((childKey, idx) => {
        const childRef = `${ref}/${childKey}`
        const childData = childAdded[childKey]
        const childDataSnapshot = SnapshotRaw({ ref: childRef, value: childData })
        const prevChildKey = idx === 0 ? null : childKeys[idx - 1]
        Notify.childAdded({ ref, snapshotRaw: childDataSnapshot, prevChildKey })
      })
    }
    
    if (childRemoved) {
      const childKeys = orderedKeys(childRemoved)
      childKeys.forEach((childKey) => {
        const childRef = `${ref}/${childKey}`
        const childData = childRemoved[childKey]
        const childDataSnapshot = SnapshotRaw({ ref: childRef, value: childData })
        Notify.childRemoved({ ref, snapshotRaw: childDataSnapshot })
      })
    }

    if (childChanged) {
      const childKeys = orderedKeys(childChanged)
      childKeys.forEach((childKey) => {
        const childRef = `${ref}/${childKey}`
        const childDiff = childChanged[childKey]
        const childData = childDiff.newData
        const childDataSnapshot = SnapshotRaw({ ref: childRef, value: childData })
        Notify.childChanged({ ref, snapshotRaw: childDataSnapshot })
        notifyChildDiff({ ref: childRef, diff: childDiff })
      })
    }
  }
  
  const Notify = {
    base: ({ ref, snapshotRaw, eventType, prevChildKey }) => {
      const room = event = RoomName({ ref, eventType })
      // TODO: change client parameter name - snapshotData -> snapshotRaw
      io.to(room).emit(event, { snapshotRaw }, prevChildKey)
      console.log(`\nBroadcasted \`${eventType}\` event:`, event)
      console.log(' snapshotRaw:\n ', JSON.stringify(snapshotRaw))
    },
    value: (args) => {
      Notify.base({ ...args, eventType: EVENT_TYPE.VALUE })
    },
    childAdded: ({ ref, snapshotRaw, ...args}) => {
      Notify.base({ ref, snapshotRaw, ...args, eventType: EVENT_TYPE.CHILD_ADDED })

      // Deep child added
      const data = snapshotRaw.value
      if (isPlainObject(data)) {
        const childKeys = orderedKeys(data)
        childKeys.forEach((childKey, idx) => {
          const childRef = `${ref}/${childKey}`
          const childData = data[childKey]
          const childDataSnapshot = SnapshotRaw({ ref: childRef, value: childData })
          const prevChildKey = idx === 0 ? null : childKeys[idx - 1]
          Notify.childAdded({ ref, snapshot: childDataSnapshot, prevChildKey })
        })
      }
    },
    childChanged: (args) => {
      Notify.base({ ...args, eventType: EVENT_TYPE.CHILD_CHANGED })
    },
    childRemoved: ({ ref, snapshotRaw, ...args}) => {
      Notify.base({ ref, snapshotRaw, ...args, eventType: EVENT_TYPE.CHILD_REMOVED })

      // Deep child removed
      const data = snapshotRaw.value
      if (isPlainObject(data)) {
        const childKeys = orderedKeys(data)
        childKeys.forEach((childKey) => {
          const childRef = `${ref}/${childKey}`
          const childData = data[childKey]
          const childDataSnapshot = SnapshotRaw({ ref: childRef, value: childData })
          Notify.childRemoved({ ref, snapshot: childDataSnapshot })
        })
      }
    },
  }

  // execute
  notifyRootDiff({ bucketName, key, diff })
}


module.exports = notifyDiff
