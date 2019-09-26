module.exports = ({ socket, io }) => {
  // TODO: validate `ref`
  require('./on')({ socket })
  require('./off')({ socket })
  require('./set')({ socket, io })
  require('./update')({ socket, io })
}