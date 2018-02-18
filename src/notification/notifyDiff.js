const { arrayToObject, deepdiff, isEmptyData, RoomName } = require('../utils')
const { SnapshotRaw } = require('../models')
const EVENT_TYPE = require('../event/eventType')

const notifyDiff = async ({ io, service, bucketName, key, diff }) => {
  if (!diff) return
  // TODO: 测试 remove 事件的通知
  const { oldData, newData, childAdded, childChanged, chiledRemoved } = diff
  console.log('---diff---')
  console.log(diff && JSON.stringify(diff))
  console.log('\n---old value---')
  console.log(oldData && JSON.stringify(oldData))
  console.log('\n---new value---')
  console.log(newData && JSON.stringify(newData))
  const isCreate = isEmptyData(oldData) && !isEmptyData(newData)
  const isRemove = !isEmptyData(oldData) && isEmptyData(newData)
  const isChange = !isCreate && !isRemove

  const docRef = `${bucketName}/${key}`

  try {
    const rootData = await service.getRoot(bucketName)
    const rootChildKeys = Object.keys(rootData)

    // Notify value change of collection node
    const rootSnapshot = SnapshotRaw({ ref: bucketName, value: isEmptyData(rootData) ? null : rootData })
    Notify.value({ io, ref: bucketName, snapshot: rootSnapshot })

    if (isRemove) {
      const docSnapshot = SnapshotRaw({ ref: docRef, value: oldData })
      Notify.chiledRemoved({ io, ref: bucketName, snapshot: docSnapshot })
    }
    
    const docSnapshot = SnapshotRaw({ ref: docRef, value: newData })
    const curDocIndex = rootChildKeys.findIndex(childKey => childKey === key)
    const prevChildKey = curDocIndex === 0 ? null : rootChildKeys[curDocIndex - 1]
    
    if (isCreate) {
      Notify.childAdded({ io, ref: bucketName, snapshot: docSnapshot, prevChildKey })
    }
    if (isChange) {
      Notify.childChanged({ io, ref: bucketName, snapshot: docSnapshot, prevChildKey })
    }
  } catch (error) {
    return console.log(error)
  }

  notifyNodeDiff({ io, ref: docRef, diff })
}

const notifyNodeDiff = ({ io, ref, diff }) => {
  if (!diff) return
  const { oldData, newData, childAdded, childChanged, chiledRemoved } = diff
  const isCreate = oldData === null && newData !== null
  const isRemove = oldData !== null && newData === null
  const isChange = !isCreate && !isRemove
  
  const nodeSnapshot = SnapshotRaw({ ref, value: newData })

  // Notify value change of current node
  Notify.value({ io, ref: ref, snapshot: nodeSnapshot })

  // Notify child change of current node
  if (chiledRemoved) {
    // TODO: handleDeepChildRemoved
    const keys = Object.keys(chiledRemoved)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const childDiff = chiledRemoved[key]
      const childRef = `${ref}/${key}`
      const childVal = childDiff.oldData
      const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
      Notify.chiledRemoved({ io, ref: ref, snapshot: childSnapshot })
    }
  }
  if (childAdded) {
    const handleDeepChildAdded = ({ io, ref, value }) => {
      const keys = Object.keys(value)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const childVal = value[key]
        const childRef =  `${ref}/${key}`
        const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
        const prevChildKey = i === 0 ? null : keys[i - 1]

        // Notify value events of child nodes of this child node
        Notify.childAdded({ io, ref: ref, snapshot: childSnapshot, prevChildKey })

        // Notify value change of current child node
        Notify.value({  io, ref: childRef, snapshot: childSnapshot })
        if (typeof childVal === 'object' && childVal !== null) {
          handleDeepChildAdded({ io, ref: childRef, value: childVal })
        }
      }
    }
    const parentChildrenKeys = Object.keys(diff.newData)
    const keys = Object.keys(childAdded)
    console.log(childAdded)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const childVal = childAdded[key]
      const childRef = `${ref}/${key}`
      const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
      const curChildIndex = parentChildrenKeys.findIndex(aChildKey => aChildKey === key)
      const prevChildKey = curChildIndex === 0 ? null : parentChildrenKeys[curChildIndex - 1]
      Notify.childAdded({ io, ref: ref, snapshot: childSnapshot, prevChildKey })

      // Notify value change of added child node
      Notify.value({ io, ref: childRef, snapshot: childSnapshot })

      // Notify value events of child nodes of this added child node
      if (typeof childVal === 'object' && childVal !== null) {
        handleDeepChildAdded({ io, ref: childRef, value: childVal })
      }
    }
  }
  if (childChanged) {
    const parentChildrenKeys = Object.keys(diff.newData)
    const keys = Object.keys(childChanged)
    console.log(JSON.stringify(childChanged))
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const childDiff = childChanged[key]
      const childRef = `${ref}/${key}`
      const childVal = childDiff.newData
      const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
      const curChildIndex = parentChildrenKeys.findIndex(aChildKey => aChildKey === key)
      const prevChildKey = curChildIndex === 0 ? null : parentChildrenKeys[curChildIndex - 1]
      Notify.childChanged({ io, ref: ref, snapshot: childSnapshot, prevChildKey })
      notifyNodeDiff({ io, ref: childRef, diff: childDiff })
    }
  }
}

const Notify = {
  base: ({ io, ref, snapshot, eventType, prevChildKey }) => {
    const room = event = RoomName({ ref, eventType })
    io.to(room).emit(event, { snapshotData: snapshot }, prevChildKey)
    console.log(`\nBroadcasted \`${eventType}\` event:`, event)
    console.log(' snapshot:\n ', JSON.stringify(snapshot))
  },
  value: (params) => {
    Notify.base({ ...params, eventType: EVENT_TYPE.VALUE })
  },
  childAdded: (params) => {
    Notify.base({ ...params, eventType: EVENT_TYPE.CHILD_ADDED })
  },
  childChanged: (params) => {
    Notify.base({ ...params, eventType: EVENT_TYPE.CHILD_CHANGED })
  },
  childMoved: (params) => {
    Notify.base({ ...params, eventType: EVENT_TYPE.CHILD_REMOVED })
  },
}

module.exports = notifyDiff
