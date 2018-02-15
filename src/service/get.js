const { SnapshotRaw } = require('../models')
const { cluster, clusterManager, N1qlQuery } = require('../index')
module.exports = (proto) => {
  proto.get = function ({ ref, bucketName }) {
    return new Promise((resolve, reject) => {
      if (!bucketName) return reject(new Error('`Project Name` not specified.'))
      const nodes = ref.split('/')
      const nodesL = nodes.length

      let key = nodesL > 0 ? nodes[0] : ''
      let select = nodes.slice(1).join('.')
      if (select === '') select = '*'

      let queryStr = `SELECT ${select} FROM \`${bucketName}\``
      if (key) queryStr += `USE KEYS '${key}'`

      console.log(queryStr)

      const bucket = cluster.openBucket(bucketName)
      const query = N1qlQuery.fromString(queryStr)
      bucket.query(query, (error, results) => {
        if (error) {
          console.log('Query failed', error)
          return reject(error)
        }
        console.log('Query succeed!', results)
        // const snapshot = SnapshotRaw({ ref, value: curNode })
        // return resolve(snapshot)
        const result = results[0]
        const resultKeys = Object.keys(result)
        if (resultKeys.length === 0) return resolve({ ref, value: null })
        return resolve({ ref, value: result[resultKeys[0]] })
      })
    })
  }
}