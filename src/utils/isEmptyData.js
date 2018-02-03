const isEmptyData = (data) => !data || (typeof data === 'object' && Object.keys(data).length === 0)

module.exports = isEmptyData
