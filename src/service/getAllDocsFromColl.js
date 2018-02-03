module.exports = (proto) => {
  proto.getAllDocsFromColl = function (collName) {
    return new Promise((resolve, reject) => {
      this.db.collection(collName).find({}).toArray()
        .then(docs => resolve(docs))
        .catch(error => reject(error))
    })
  }
}