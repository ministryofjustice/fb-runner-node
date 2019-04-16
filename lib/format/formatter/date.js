const moment = require('moment')
const parseArgs = require('../parse-args')

const formatDate = (date, args = {}) => {
  args.format = args.format || 'D MMMM Y'
  return moment(date).format(args.format)
}

const dateFormatter = () => {
  return (input, ...rest) => {
    const args = parseArgs(rest[1])
    return formatDate(input, args)
  }
}

module.exports = {
  date: formatDate,
  dateFormatter
}
