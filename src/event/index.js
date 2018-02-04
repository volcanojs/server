module.exports = ({ io, socket, service }) => {
  // TODO: validate `ref`
  require('./off')({ socket, service })
  require('./on')({ io, socket, service })
  require('./set')({ io, socket, service })
  require('./update')({ io, socket, service })
}