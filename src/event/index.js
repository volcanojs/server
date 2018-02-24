module.exports = ({ socket, io }) => {
  // TODO: validate `ref`
  // require('./off')({ socket, service })
  require('./on')({ socket })
  require('./set')({ socket, io })
  require('./update')({ socket, io })
}