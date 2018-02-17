const { cluster, clusterManager, N1qlQuery } = require('../couchbase')
module.exports = (proto) => {
  proto.getAllDocs = function (bucketName) {
    return new Promise((resolve, reject) => {
      let queryStr = `SELECT meta(data).id, * FROM \`${bucketName}\` AS data`

      console.log(queryStr)

      const bucket = cluster.openBucket(bucketName)
      const query = N1qlQuery.fromString(queryStr)
      bucket.query(query, (error, docs) => {
        if (error) {
          return reject(error)
        }
        console.log(docs)
        if (!Array.isArray(docs) || docs.length === 0) {
          return resolve({ value: {}, ids: [] })
        } else {
          const value = {}
          const ids = []
          for (let i = 0; i < docs.length; i++) {
            const doc = docs[i]
            value[doc.id] = doc.data
            ids.push(doc.id)
          }
          return resolve({ value, ids })
        }
      })
    })
  }
}