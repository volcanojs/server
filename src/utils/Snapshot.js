function Snapshot ({ ref, value }) {
  this.ref = ref
  this.val = value
  this.key = value ? value._id : null
  return {
    key: this.key,
    ref: this.ref,
    val: () => this.val,
    exists: () => !!this.val,
  }
}

module.exports = (params) => new Snapshot(params)
