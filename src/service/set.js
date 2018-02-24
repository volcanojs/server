const cloneDeep = require('lodash.clonedeep')
const isPlainObject = require('lodash.isplainobject')
const { deepdiff } = require('../utils')
const { notifyDiff } = require('../notification')
const { cluster, N1qlQuery } = require('../couchbase')

module.exports = async function ({ query, io }) {
  console.log(this)
  return new Promise((resolve, reject) => {
    const { bucketName, ref, value } = query
    if (!bucketName) return reject(new Error('`Project Name` not specified.'))
    const nodes = ref.split('/')
    const nodesL = nodes.length

    let key = nodesL > 0 ? nodes[0] : ''
    if (!key) return reject(new Error('Set `root` not allowed.'))

    const getDocQueryStr = `SELECT * FROM \`${bucketName}\` USE KEYS '${key}'`

    console.log('getDocQueryStr:', getDocQueryStr)
    let bucket
    try {
      bucket = cluster.openBucket(bucketName)
    } catch(error) {
      console.log(error)
    }
    const getDocQuery = N1qlQuery.fromString(getDocQueryStr)
    bucket.query(getDocQuery, (error, results) => {
      if (error) {
        console.log('Get Query failed', error)
        return reject(error)
      }
      console.log('Get Query succeed!', results)
      
      let oldData
      let newData
      if (!Array.isArray(results) || results.length === 0) {
        console.log('not found')
        // 1. Document doesn't exsit, or
        // 2. Document exist but content doesn't exist
        oldData = {}

        const childNodeNames = nodes.slice(1)
        console.log(childNodeNames)
        if (childNodeNames.length > 0) {
          newData = {}
          let curNode = newData
          const childNodeNamesLastIdx = childNodeNames.length - 1
          for (let i = 0; i < childNodeNamesLastIdx; i++) {
            const childNodeName = childNodeNames[i]
            curNode[childNodeName] = {}
            curNode = curNode[childNodeName]
          }
          curNode[childNodeNames[childNodeNamesLastIdx]] = value
        } else {
          newData = value
        }
      } else {
        const result = results[0]
        const resultKeys = Object.keys(result)
        const childNodeNames = nodes.slice(1)
        oldData = result[resultKeys[0]]
        if (childNodeNames.length > 0) {
          newData = cloneDeep(oldData)
          let curNode = newData
          const childNodeNamesLastIdx = childNodeNames.length - 1
          for (let i = 0; i < childNodeNamesLastIdx; i++) {
            const childNodeName = childNodeNames[i]
            if (isPlainObject(curNode) && curNode[childNodeName]) {
              curNode = curNode[childNodeName]
            } else {
              curNode[childNodeName] = {}
              curNode = curNode[childNodeName]
            }
          }
          curNode[childNodeNames[childNodeNamesLastIdx]] = value
        } else {
          newData = value
        }
      }


      const upsertQueryStr = `UPSERT INTO \`${bucketName}\` (KEY, VALUE) VALUES ("${key}", ${JSON.stringify(newData)})`
      console.log('upsertQueryStr:', upsertQueryStr)
      const upsertQuery = N1qlQuery.fromString(upsertQueryStr)
      bucket.query(upsertQuery, (error, results) => {
        if (error) {
          console.log('Upsert Query failed', error)
          return reject(error)
        }
        console.log('Upsert Result', results)
        console.log('oldData:', oldData)
        console.log('newData:', newData)

        const diff = deepdiff({ oldData, newData })
        console.log(this)
        notifyDiff({ io, service: this, bucketName, key, diff })

        return resolve()
      })
    })
  })
}
