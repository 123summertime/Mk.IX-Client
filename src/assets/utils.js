export const computeTime = function (timestamp) {
  timestamp = Math.round(Number(timestamp.substring(0, 10)))  // 精确到秒的时间戳(10位)
  const todayMidnight = new Date().setHours(0, 0, 0, 0) / 1000

  const time = new Date(timestamp * 1000)
  const year = time.getFullYear()
  const month = time.getMonth() + 1
  const date = time.getDate()
  let hours = time.getHours()
  let minutes = time.getMinutes()

  hours = (hours < 10) ? "0" + hours : hours
  minutes = (minutes < 10) ? "0" + minutes : minutes
  const T = hours + ":" + minutes

  // 1d === 86400s
  if (timestamp >= todayMidnight) {
    return T
  }
  if (timestamp >= todayMidnight - 86400) {
    return "昨天 " + T
  }
  if (timestamp >= todayMidnight - 2 * 86400) {
    return "前天 " + T
  }
  if (timestamp >= todayMidnight - 364 * 86400) {
    return month + "/" + date + " " + T
  }
  return year + "/" + month + "/" + date + " " + T
}

// 格式化为年月日时分秒
export const computeTime2 = function (timestamp) {
  timestamp = Math.round(Number(timestamp.substring(0, 10)))
  const date = new Date(timestamp * 1000)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}