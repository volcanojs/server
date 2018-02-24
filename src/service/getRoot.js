const { cluster, clusterManager, N1qlQuery } = require('../couchbase')

module.exports = function (bucketName) {
  return new Promise((resolve, reject) => {
    let queryStr = `SELECT {META(data).id: data}.* FROM \`${bucketName}\` AS data`

    console.log(queryStr)

    const bucket = cluster.openBucket(bucketName)
    const query = N1qlQuery.fromString(queryStr)
    bucket.query(query, (error, result) => {
      if (error) {
        return reject(error)
      }
      console.log(result)
      if (!Array.isArray(result) || result.length === 0) {
        return resolve({})
      } else {
        return resolve(result[0])
      }
    })
  })
}
