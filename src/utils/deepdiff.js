const deepdiff = ({oldData, newData}) => {
  if (typeof oldData !== 'object' || typeof newData !== 'object' || oldData === null || newData === null) {
    return newData !== oldData ? { oldData, newData } : null
  }
  const oldKeys = Object.keys(oldData)
  const newKeys = Object.keys(newData)
  const commonKeys = newKeys.filter(key => oldKeys.indexOf(key) !== -1)
  const result = { childRemoved: {}, childAdded: {}, childChanged: {} }
  oldKeys.forEach(key => {
    if (commonKeys.indexOf(key) === -1) {
      result.childRemoved[key] = oldData[key]
    }
  })
  newKeys.forEach(key => {
    if (commonKeys.indexOf(key) === -1) {
      result.childAdded[key] = newData[key]
    }
  })
  commonKeys.forEach(key => {
    const diffAtKey = deepdiff({ oldData: oldData[key], newData: newData[key] })
    if (diffAtKey) {
      result.childChanged[key] = diffAtKey
    }
  })
  Object.keys(result.childRemoved).length === 0 && (delete result.childRemoved)
  Object.keys(result.childAdded).length === 0 && (delete result.childAdded)
  Object.keys(result.childChanged).length === 0 && (delete result.childChanged)
  if (Object.keys(result).length === 0) {
    return null
  } else {
    result.oldData = oldData
    result.newData = newData
    return result
  }
}

module.exports = deepdiff
