const { arrayToObject, deepdiff, isEmptyData, RoomName } = require('../utils')
const { SnapshotRaw } = require('../models')
const EVENT_TYPE = require('../event/eventType')

const notifyDiff = async ({ io, service, collName, diff }) => {
  if (!diff) return
  // TODO: 测试 remove 事件的通知
  const { oldVal, newVal, childAdded, childChanged, chiledRemoved } = diff
  console.log('---diff---')
  console.log(JSON.stringify(diff))
  console.log('\n---old value---')
  console.log(JSON.stringify(oldVal))
  console.log('\n---new value---')
  console.log(JSON.stringify(newVal))
  const isCreate = isEmptyData(oldVal) && !isEmptyData(newVal)
  const isRemove = !isEmptyData(oldVal) && isEmptyData(newVal)
  const isChange = !isCreate && !isRemove

  const docRef = `${collName}/${newVal._id}`

  try {
    const docsOfColl = await service.getAllDocsFromColl(collName)

    // Notify value change of collection node
    const newCollVal = arrayToObject(docsOfColl)
    const collSnapshot = SnapshotRaw({ ref: collName, value: isEmptyData(newCollVal) ? null : newCollVal })
    Notify.value({ io, ref: collName, snapshot: collSnapshot })

    if (isRemove) {
      const docSnapshot = SnapshotRaw({ ref: docRef, value: oldVal })
      Notify.chiledRemoved({ io, ref: collName, snapshot: docSnapshot })
    }
    
    const docSnapshot = SnapshotRaw({ ref: docRef, value: newVal })
    const curDocIndex = docsOfColl.findIndex(aDoc => aDoc._id.toHexString() === newVal._id)
    const prevChildKey = curDocIndex === 0 ? null : docsOfColl[curDocIndex - 1]._id.toHexString()
    
    if (isCreate) {
      Notify.childAdded({ io, ref: collName, snapshot: docSnapshot, prevChildKey })
    }
    if (isChange) {
      Notify.childChanged({ io, ref: collName, snapshot: docSnapshot, prevChildKey })
    }
  } catch (error) {
    return console.log(error)
  }

  notifyNodeDiff({ io, service, ref: docRef, diff })
}

const notifyNodeDiff = ({ io, service, ref, diff }) => {
  if (!diff) return
  const { oldVal, newVal, childAdded, childChanged, chiledRemoved } = diff
  const isCreate = oldVal === null && newVal !== null
  const isRemove = oldVal !== null && newVal === null
  const isChange = !isCreate && !isRemove
  
  const nodeSnapshot = SnapshotRaw({ ref, value: newVal })

  // Notify value change of current node
  Notify.value({ io, ref: ref, snapshot: nodeSnapshot })

  // Notify child change of current node
  if (chiledRemoved) {
    const keys = Object.keys(chiledRemoved)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const childDiff = chiledRemoved[key]
      const childRef = `${ref}/${key}`
      const childVal = childDiff.oldVal
      const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
      Notify.chiledRemoved({ io, ref: ref, snapshot: childSnapshot })
    }
  }
  if (childAdded) {
    const handleDeepChildAdded = ({ ref, value }) => {
      const keys = Object.keys(value)
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (key === '_id') continue
        const childVal = value[key]
        const childRef =  `${ref}/${key}`
        const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
        const prevChildKey = i === 0 ? null : keys[i - 1]

        // Notify value events of child nodes of this child node
        Notify.childAdded({ io, ref: ref, snapshot: childSnapshot, prevChildKey })

        // Notify value change of current child node
        Notify.value({ io, ref: childRef, snapshot: childSnapshot })
        if (typeof childVal === 'object') handleDeepChildAdded({ ref: childRef, value: childVal })
      }
    }
    const parentChildrenKeys = Object.keys(diff.newVal)
    const keys = Object.keys(childAdded)
    console.log(childAdded)
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (key === '_id') continue
      const childVal = childAdded[key]
      const childRef = `${ref}/${key}`
      const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
      const curChildIndex = parentChildrenKeys.findIndex(aChildKey => aChildKey === key)
      const prevChildKey = curChildIndex === 0 ? null : parentChildrenKeys[curChildIndex - 1]
      Notify.childAdded({ io, ref: ref, snapshot: childSnapshot, prevChildKey })

      // Notify value change of added child node
      Notify.value({ io, ref: childRef, snapshot: childSnapshot })

      // Notify value events of child nodes of this added child node
      if (typeof childVal === 'object') handleDeepChildAdded({ ref: childRef, value: childVal })
    }
  }
  if (childChanged) {
    const parentChildrenKeys = Object.keys(diff.newVal)
    const keys = Object.keys(childChanged)
    console.log(JSON.stringify(childChanged))
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const childDiff = childChanged[key]
      const childRef = `${ref}/${key}`
      const childVal = childDiff.newVal
      const childSnapshot = SnapshotRaw({ ref: childRef, value: childVal })
      const curChildIndex = parentChildrenKeys.findIndex(aChildKey => aChildKey === key)
      const prevChildKey = curChildIndex === 0 ? null : parentChildrenKeys[curChildIndex - 1]
      Notify.childChanged({ io, ref: ref, snapshot: childSnapshot, prevChildKey })
      notifyNodeDiff({ io, service, ref: childRef, diff: childDiff })
    }
  }
}

const Notify = {
  base: ({ io, ref, snapshot, eventType, prevChildKey }) => {
    const room = event = RoomName({ ref, eventType })
    io.to(room).emit(event, snapshot, prevChildKey)
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
