const nodeCleanup = require('node-cleanup')

const cleanupTasks = []

nodeCleanup((exitCode, signal) => {
  cleanupTasks.forEach(task => {
    task()
  })
})

const addCleanupTask = (task) => {
  cleanupTasks.push(task)
}

module.exports = {
  addCleanupTask
}
