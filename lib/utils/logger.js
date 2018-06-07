let verbose = false

const logger = (...msg) => {
  if (verbose) {
    const messages = msg.map(message => {
      if (typeof message === 'object') {
        return JSON.stringify(message, null, 2)
      }
      return message
    })
    process.stdout.write(`${messages.join('\n')}\n`)
  }
}

logger.verbose = (flag) => {
  verbose = flag
}

module.exports = logger
