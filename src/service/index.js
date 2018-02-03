function Service (db) {
  if (!this) throw new Error('Should initialize "Service" with `new`')
  this.db = db
}
const proto = Service.prototype
require('./get')(proto)
require('./set')(proto)

require('./getAllDocsFromColl')(proto)

module.exports = (db) => new Service(db)
