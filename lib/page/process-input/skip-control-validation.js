const skipControlValidation = (pageInstance, userData, nameInstance) => {
  const {$conditionalShow} = nameInstance
  const {evaluate} = userData

  // NB. this mirrors the same check in page.summary.controller
  if ($conditionalShow) {
    const conditionalShow = evaluate($conditionalShow, {
      page: pageInstance,
      instance: nameInstance
    })
    if (!conditionalShow) {
      nameInstance.$skipValidation = true
    }
  }
}

module.exports = skipControlValidation
