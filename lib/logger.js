module.exports = (...msg) => {
  if (!process.env.ENV) {
    process.stdout.write(msg.join(' '))
    process.stdout.write('\n')
  }
}
