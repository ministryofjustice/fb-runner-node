const bytes = require('bytes')

const formatBytes = (size) => {
  if (typeof size === 'string') {
    return size
  }
  let formattedSize = bytes(size)
  formattedSize = formattedSize.replace(/(\d+)\.(\d+)(\w+)/, (m, int, decimal, unit) => {
    const unitType = unit.toUpperCase()
    const multiplier = unitType === 'KB' ? 100 : 10
    const halfMultiplier = 5 * multiplier
    decimal = parseInt((decimal * multiplier + halfMultiplier) / 100, 10)
    if (decimal >= 10) {
      decimal = ''
      int++
    }
    if (unitType === 'KB') {
      decimal = ''
    }
    return `${int}${decimal ? `.${decimal}` : ''}${unit}`
  })
  return formattedSize
}

module.exports = formatBytes
