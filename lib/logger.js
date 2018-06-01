module.exports = (...msg) => {
  if (!process.env.ENV) {
    const messages = msg.map(message => {
      if (typeof message === 'object') {
        return JSON.stringify(message, null, 2)
      }
      return message
    })
    process.stdout.write(`${messages.join('\n')}\n`)
  }
}
