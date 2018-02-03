const deepdiff = require('./deepdiff')
const RoomName = require('./RoomName')
const Snapshot = require('./Snapshot')
const isEmptyData = require('./isEmptyData')
const EVENT_TYPE = require('../events/eventType')

const notifyDiff = async ({ socket, service, collName, diff }) => {
  if (!diff) return
  // TODO: 测试 remove 事件的通知
  const { oldVal, newVal, childAdded, childChanged, chiledRemoved } = diff
  const isCreate = isEmptyData(oldVal) && !isEmptyData(newVal)
  const isRemove = !isEmptyData(oldVal) && isEmptyData(newVal)
  const isChange = !isCreate && !isRemove

  const docRef = `${collName}/${newVal._id}`

  if (isRemove) {
    const docSnapshot = Snapshot({ ref: docRef, value: oldVal })
    Notify.chiledRemoved({ socket, ref: collName, snapshot: docSnapshot })
  }
  
  const docSnapshot = Snapshot({ ref: docRef, value: newVal })
  try {
    const docsOfColl = await service.getAllDocsFromColl(collName)
    const curDocIndex = docsOfColl.findIndex(aDoc => aDoc._id.toHexString() === newVal._id)
    const prevChildKey = curDocIndex === 0 ? null : docsOfColl[curDocIndex - 1]._id.toHexString()
    
    if (isCreate) {
      Notify.childAdded({ socket, ref: collName, snapshot: docSnapshot, prevChildKey })
    }
    if (isChange) {
      Notify.childChanged({ socket, ref: collName, snapshot: docSnapshot, prevChildKey })
    }
  } catch (error) {
    return console.log(error)
  }

  notifyNodeDiff({ socket, service, ref: docRef, diff })
}

const notifyNodeDiff = ({ socket, service, ref, diff }) => {
  if (!diff) return
  const { oldVal, newVal, childAdded, childChanged, chiledRemoved } = diff
  const isCreate = oldVal === null && newVal !== null
  const isRemove = oldVal !== null && newVal === null
  const isChange = !isCreate && !isRemove
  
  const nodeSnapshot = Snapshot({ ref, value: newVal })

  // Notify value change of current node
  Notify.value({ socket, ref: ref, snapshot: nodeSnapshot })

  // Notify child change of current node
  if (chiledRemoved) {
    const keys = Object.keys(chiledRemoved)
    keys.forEach(key => {
      const childDiff = chiledRemoved[key]
      const childRef = `${ref}/${key}`
      const childVal = childDiff.oldVal
      const childSnapshot = Snapshot({ ref: childRef, value: childVal })
      Notify.chiledRemoved({ socket, ref: ref, snapshot: childSnapshot })
    })
  }
  if (childAdded) {
    const parentChildrenKeys = Object.keys(diff.newVal)
    const keys = Object.keys(childAdded)
    keys.forEach(key => {
      const childDiff = childAdded[key]
      const childRef = `${ref}/${key}`
      const childVal = childDiff.newVal
      const childSnapshot = Snapshot({ ref: childRef, value: childVal })
      const curChildIndex = parentChildrenKeys.findIndex(aChildKey => aChildKey === key)
      const prevChildKey = curChildIndex === 0 ? null : parentChildrenKeys[curChildIndex - 1]
      Notify.childAdded({ socket, ref: ref, snapshot: childSnapshot, prevChildKey })
    })
  }
  if (childChanged) {
    const keys = Object.keys(childChanged)
    keys.forEach(key => {
      const childDiff = childChanged[key]
      const childRef = `${ref}/${key}`
      const childVal = childDiff.newVal
      const childSnapshot = Snapshot({ ref: childRef, value: childVal })
      const curChildIndex = parentChildrenKeys.findIndex(aChildKey => aChildKey === key)
      const prevChildKey = curChildIndex === 0 ? null : parentChildrenKeys[curChildIndex - 1]
      Notify.childChanged({ socket, ref: ref, snapshot: childSnapshot, prevChildKey })
      notifyNodeDiff({ socket, service, ref: childRef, diff })
    })
  }
}

const Notify = {
  base: ({ socket, ref, snapshot, eventType, prevChildKey }) => {
    const room = event = RoomName({ ref, eventType })
    socket.to(room).emit(event, snapshot, prevChildKey)
    console.log(`Broadcasted \`${eventType}\` event:`, event)
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
