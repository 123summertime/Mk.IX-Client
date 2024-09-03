export const computeTime = function (timeStamp) {
  timeStamp = Math.round(Number(timeStamp.substring(0, 10)))  // 精确到秒的时间戳(10位)
  const todayMidnight = new Date().setHours(0, 0, 0, 0) / 1000

  const time = new Date(timeStamp * 1000)
  const year = time.getFullYear()
  const month = time.getMonth() + 1
  const date = time.getDate()
  let hours = time.getHours()
  let minutes = time.getMinutes()

  hours = (hours < 10) ? "0" + hours : hours
  minutes = (minutes < 10) ? "0" + minutes : minutes
  const T = hours + ":" + minutes

  // 1d === 86400s
  if (timeStamp >= todayMidnight) {
    return T
  }
  if (timeStamp >= todayMidnight - 86400) {
    return "昨天 " + T
  }
  if (timeStamp >= todayMidnight - 2 * 86400) {
    return "前天 " + T
  }
  if (timeStamp >= todayMidnight - 364 * 86400) {
    return month + "/" + date + " " + T
  }
  return year + "/" + month + "/" + date + " " + T
}