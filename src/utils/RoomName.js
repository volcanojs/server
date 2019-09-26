const RoomName = ({ bucketName, ref, eventType, addition }) => `${bucketName}${ref}-${eventType}` + (addition ? `-${addition}` : '')
module.exports = RoomName
