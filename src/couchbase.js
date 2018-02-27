const couchbase = require('couchbase')
const cluster = new couchbase.Cluster('couchbase://localhost/')
cluster.authenticate('Administrator', 'password')
const clusterManager = cluster.manager('Administrator', 'password')
const N1qlQuery = couchbase.N1qlQuery

module.exports = {
  cluster,
  clusterManager,
  N1qlQuery,
}
