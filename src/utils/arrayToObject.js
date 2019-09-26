const arrayToObject = (array, keyField = '_id') => array.reduce((obj, item) => { obj[item[keyField]] = item; return obj}, {})

module.exports = arrayToObject
