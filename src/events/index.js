module.exports = (socket, service) => {
  // TODO: validate `ref`
  require('./on')(socket, service)
  require('./set')(socket, service)
}