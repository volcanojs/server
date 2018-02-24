class Service {
  constructor () {
    this.get = require('./get').bind(this)
    this.getRoot = require('./getRoot').bind(this)
    this.set = require('./set').bind(this)
  }
}

const service = new Service()

module.exports = service
