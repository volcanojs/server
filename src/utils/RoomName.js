const RoomName = ({ ref, eventType, addition }) => `${ref}-${eventType}` + (addition ? `-${addition}` : '')
module.exports = RoomName
