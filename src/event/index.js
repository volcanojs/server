module.exports = ({ socket, io }) => {
  // TODO: validate `ref`
  // require('./off')({ socket, service })
  require('./on')({ socket })
  require('./set')({ socket, io })
  // require('./update')({ io, socket, service })
}