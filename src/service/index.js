function Service () {
  if (!this) throw new Error('Should initialize "Service" with `new`')
}
const proto = Service.prototype
require('./get')(proto)
// require('./set')(proto)
// require('./update')(proto)

// require('./getAllDocsFromColl')(proto)

module.exports = () => new Service()
