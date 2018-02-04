const ObjectID = require('mongodb').ObjectID
const { SnapshotRaw } = require('../models')
module.exports = (proto) => {
  proto.get = function (query) {
    return new Promise((resolve, reject) => {
      const { ref } = query
      const nodes = ref.split('/')
      const nodesL = nodes.length
      const collName = nodes[0]
      const mongoQuery = {
        _id: nodesL > 1 ? ObjectID(nodes[1]) : undefined,
      }
      if (!collName) return reject(new Error('`collName` not specified.'))
      console.log(query)
      console.log(mongoQuery)
      this.db.collection(collName).find(mongoQuery).toArray()
        .then(docs => {
          console.log(docs)
          if (docs.length === 0) return resolve(null)
          const collRoot = docs[0]

          let curNode = collRoot;
          const childNodeNames = nodes.slice(2)
          for (let i = 0; i < childNodeNames.length; i++) {
            const childNodeName = childNodeNames[i];
            curNode = curNode[childNodeName] || null;
            if (!curNode) break;
          }
          const snapshot = SnapshotRaw({ ref, value: curNode })
          return resolve(snapshot)
        })
        .catch(error => reject(error))
    })
  }
}