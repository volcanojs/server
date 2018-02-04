const deepdiff = ({oldVal, newVal}) => {
  if (typeof oldVal !== 'object' || typeof newVal !== 'object' || oldVal === null || newVal === null) {
    return newVal !== oldVal ? { oldVal, newVal } : null
  }
  const oldKeys = Object.keys(oldVal)
  const newKeys = Object.keys(newVal)
  const commonKeys = newKeys.filter(key => oldKeys.indexOf(key) !== -1)
  const result = { childRemoved: {}, childAdded: {}, childChanged: {} }
  oldKeys.forEach(key => {
    if (commonKeys.indexOf(key) === -1) {
      result.childRemoved[key] = oldVal[key]
    }
  })
  newKeys.forEach(key => {
    if (commonKeys.indexOf(key) === -1) {
      const childVal = newVal[key]
      if (typeof childVal === 'object') {
        result.childAdded[key] = {
          oldVal: null,
          newVal: childVal
        }
      } else {
        result.childAdded[key] = {
          oldVal: null,
          newVal: childVal
        }
      }
    }
  })
  commonKeys.forEach(key => {
    const diffAtKey = deepdiff({ oldVal: oldVal[key], newVal: newVal[key] })
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
    result.oldVal = oldVal
    result.newVal = newVal
    return result
  }
}

module.exports = deepdiff
