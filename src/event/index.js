module.exports = ({ io, socket, service }) => {
  // TODO: validate `ref`
  require('./on')({ io, socket, service })
  require('./off')({ socket, service })
  require('./set')({ io, socket, service })
}