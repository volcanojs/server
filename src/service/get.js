module.exports = (proto) => {
  proto.get = function (query) {
    return new Promise((resolve, reject) => {
      const { ref } = query
      const nodes = ref.split('/')
      const nodesL = nodes.length
      const collName = nodes[0]
      const mongoQuery = {
        _id: nodesL > 1 ? nodes[1] : undefined,
      }
      if (!collName) return reject(new Error('`collName` not specified.'))
      this.db.collection(collName).find(mongoQuery).toArray()
        .then(docs => {
          if (docs.length === 0) return resolve(null)
          const collRoot = docs[0]

          let curNode = collRoot;
          const childNodeNames = nodes.slice(2)
          for (let i = 0; i < childNodeNames.length; i++) {
            const childNodeName = childNodeNames[i];
            curNode = curNode[childNodeName] || null;
            if (!curNode) break;
          }
          return resolve(curNode)
        })
        .catch(error => reject(error))
    })
  }
}