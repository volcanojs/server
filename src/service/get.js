const { cluster, N1qlQuery } = require('../couchbase')
const SnapshotRaw = require('../models/SnapshotRaw')
module.exports = function ({ ref, bucketName }) {
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
    
      if (!Array.isArray(results)) {
        // Document doesn't exsit
        resolve(null)
      } else if (results.length === 0) {
        // Document exist but content doesn't exist
        resolve(null)
      } else {
        const result = results[0]
        const resultKeys = Object.keys(result)
        if (resultKeys.length === 0) return resolve(null)
        return resolve(result[resultKeys[0]])
      }
    })
  })
}
