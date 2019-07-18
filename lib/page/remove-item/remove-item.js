const removeItem = async (pageInstance, userData) => {
  const {remove} = userData.getBodyInput()
  if (remove) {
    const [removeLookup, removeIndex] = remove.split('=')
    // error if no such item

    const removeCount = userData.getUserCountProperty(removeLookup) || {}
    // error if no removeCount
    if (removeCount.current > (removeCount.minimum || 0)) {
      const lookupArray = userData.getUserDataProperty(removeLookup)
      if (lookupArray) {
      // error if item doesn't exist
        lookupArray.splice(removeIndex, 1)
        userData.setUserDataProperty(removeLookup, lookupArray)
        const compositeRemoveLookup = `COMPOSITE.${removeLookup}`
        const compositeLookupArray = userData.getUserDataProperty(compositeRemoveLookup)
        if (compositeLookupArray) {
          compositeLookupArray.splice(removeIndex, 1)
          userData.setUserDataProperty(compositeRemoveLookup, compositeLookupArray)
        }
      }
      removeCount.current--
      userData.setUserCountProperty(removeLookup, removeCount)
      pageInstance.redirectToSelf = true
    } else {
      // error if removing would take too low
    }
  }
  return pageInstance
}

module.exports = removeItem
