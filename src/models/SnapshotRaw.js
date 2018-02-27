const { isEmptyData } = require('../utils')
// Snapshot object should be constructed on client side.
const SnapshotRaw = ({ ref, value }) => ({
  ref,
  value: isEmptyData(value) ? null : value,
})

module.exports = SnapshotRaw
