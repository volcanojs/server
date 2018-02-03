function deepdiff ({oldVal, newVal}) {
  if (typeof oldVal !== 'object' || typeof newVal !== 'object' || oldVal === null || newVal === null) {
    return newVal !== oldVal ? { oldVal, newVal } : null
  }
  const oldKeys = Object.keys(oldVal)
  const newKeys = Object.keys(newVal)
  const commonKeys = newKeys.filter(key => oldKeys.indexOf(key) !== -1)
  const result = { child_removed: {}, child_added: {}, child_changed: {} }
  oldKeys.forEach(key => {
    if (commonKeys.indexOf(key) === -1) {
      result.child_removed[key] = oldVal[key]
    }
  })
  newKeys.forEach(key => {
    if (commonKeys.indexOf(key) === -1) {
      result.child_added[key] = newVal[key]
    }
  })
  commonKeys.forEach(key => {
    const diffAtKey = deepdiff({ oldVal: oldVal[key], newVal: newVal[key] })
    if (diffAtKey) {
      result.child_changed[key] = diffAtKey
    }
  })
  Object.keys(result.child_removed).length === 0 && (delete result.child_removed)
  Object.keys(result.child_added).length === 0 && (delete result.child_added)
  Object.keys(result.child_changed).length === 0 && (delete result.child_changed)
  if (Object.keys(result).length === 0) {
    return null
  } else {
    result.oldVal = oldVal
    result.newVal = newVal
    return result
  }
}

module.exports = deepdiff
