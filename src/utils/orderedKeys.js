const isPlainObject = require('lodash.isplainobject')
const orderBy = require('lodash.orderby')

module.exports = (object) => {
  if (!isPlainObject(object)) {
    throw new Error('[orderedKeys] Error: first argument is not a plain object.')
  }
  return orderBy(Object.keys(object))
}
