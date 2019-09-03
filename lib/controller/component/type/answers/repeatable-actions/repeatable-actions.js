const defaultRepeatableAdd = 'Add another'
const defaultRepeatableDelete = 'Remove'

const processRepeatableAnswer = (stepInstance, userData) => {
  let stepRemove
  let stepAdd

  let {namePrefix, repeatableMinimum, repeatableMaximum, repeatableAdd, repeatableDelete} = stepInstance
  repeatableAdd = repeatableAdd || defaultRepeatableAdd
  repeatableDelete = repeatableDelete || defaultRepeatableDelete
  if (repeatableMinimum === undefined) {
    repeatableMinimum = 1
  }
  let currentInstanceCount = 1
  namePrefix = namePrefix || ''
  namePrefix = namePrefix.replace(/\[(\d+)\]$/, (m, m1) => {
    currentInstanceCount = Number(m1)
    return ''
  })
  let currentCount = (userData.getUserCountProperty(namePrefix) || {}).current
  if (currentCount === undefined) {
    currentCount = repeatableMinimum
  }
  if (currentCount > repeatableMinimum) {
    stepRemove = {
      remove: `${namePrefix}=${currentInstanceCount}`,
      repeatableDelete
    }
  }

  if (currentInstanceCount >= repeatableMinimum) {
    if (currentInstanceCount === currentCount) {
      if (!repeatableMaximum || repeatableMaximum > currentCount) {
        stepAdd = {
          add: `${stepInstance._id}/${namePrefix}`,
          repeatableAdd
        }
      }
    }
  }

  return {
    stepRemove,
    stepAdd
  }
}

module.exports = processRepeatableAnswer
