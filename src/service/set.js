const ObjectID = require('mongodb').ObjectID
const { deepdiff } = require('../utils')
const { SnapshotRaw } = require('../models')
const { notifyDiff } = require('../notification')

module.exports = (proto) => {
  proto.set = async function ({ io, query }) {
    const { ref, data } = query
    // TODO: might move `ref` validation outside, have something like `validateAndNormalizeRef(ref)`
    if (!ref) return Promise.reject(new Error(ref === '' ? 'Should not set `root`.' : 'Invalid `ref`.'))
    const nodes = ref.split('/')
    const collName = nodes[0]
    const hasDocumentId = nodes.length > 1
    const _id = hasDocumentId ? ObjectID(nodes[1]) : undefined
    const mongoQuery = {
      _id,
    }
    if (!collName) return Promise.reject(new Error('`collName` not specified.'))
    const coll = this.db.collection(collName)
    let rootData, oldVal, newVal
    if (hasDocumentId) {
      try {
        const doc  = await coll.findOne(mongoQuery)
        if (!doc) rootData = {}
        else rootData = doc
      } catch (error) {
        return Promise.reject(error)
      }
    } else {
      rootData = {}
    }
    oldVal = Object.assign({}, rootData)
    let curNode = rootData, hasChild, lastChildName
    const childNodeNames = nodes.slice(2)
    hasChild = childNodeNames.length > 0
    lastChildName = hasChild ? childNodeNames[childNodeNames.length - 1] : undefined
    for (let i = 0; i < (childNodeNames.length - 1); i++) {
      const childNodeName = childNodeNames[i];
      if (curNode[childNodeName]) {
        curNode = curNode[childNodeName]
      } else {
        curNode[childNodeName] = {}
        curNode = curNode[childNodeName]
      }
    }
    const curNodeVal = hasChild ? curNode[lastChildName] : curNode
    hasChild ? curNode[lastChildName] = data : curNode = data
    const updatedCurNodeVal = hasChild ? curNode[lastChildName] : curNode

    // save change
    try {
      const updatedRecord = await coll.findOneAndUpdate(mongoQuery, { $set: rootData }, { returnOriginal: false, upsert: true })
      newVal = updatedRecord.value
    } catch (error) {
      return Promise.reject(error)
    }

    // notify change
    if (typeof oldVal === 'object' && oldVal !== null) {
      oldVal._id && (typeof oldVal._id === 'object') && (oldVal._id = oldVal._id.toHexString())
    }
    if (typeof newVal === 'object' && newVal !== null) {
      newVal._id && (typeof newVal._id === 'object') && (newVal._id = newVal._id.toHexString())
    }
    const diff = deepdiff({ oldVal, newVal })
    notifyDiff({ io, service: this, collName, diff })

    const snapshot = SnapshotRaw({ ref, value: newVal })
    return Promise.resolve(snapshot)
  }
}