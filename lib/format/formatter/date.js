const moment = require('moment')
const parseArgs = require('../parse-args')

const formatDate = (date, args = {}) => {
  args.format = args.format || 'D MMMM Y'
  let interimDate = date
  try {
    interimDate = new Date(interimDate)
  } catch (e) {
    // let moment handle non-standard date object creation
  }
  return moment(interimDate).format(args.format)
}

const dateFormatter = (input, ...rest) => {
  const args = parseArgs(rest[1])
  return formatDate(input, args)
}

module.exports = {
  date: formatDate,
  dateFormatter
}
