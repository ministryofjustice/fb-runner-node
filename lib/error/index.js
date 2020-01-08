/**
 * @module CommonError
 **/

module.exports = class CommonError extends Error {
  /**
   * CommonError constructor
   *
   * @param {string} message
   * Error message
   *
   * If not passed, will use any value found in options.error.message
   *
   * @param {{error: object, data: any}} options
   * Error options
   *
   * @param {object} options.error
   * Error object or plain object representing an error
   *
   * @param {any} options.data
   * Additional data to attach to the returned error
   *
   * @return {CommonError}
   **/
  constructor (message, options = {}) {
    if (typeof message === 'object') {
      options = message
      message = undefined
    }

    const {
      error,
      data
    } = options

    super(error)

    const {
      constructor,
      constructor: {
        name = 'CommonError'
      }
    } = this

    if (Error.captureStackTrace) Error.captureStackTrace(this, constructor.bind(this))

    this.name = name
    this.message = message || options.message

    if (error) {
      Object
        .entries(error)
        .forEach(([key, value]) => {
          this[key] = value
        })
    }

    if (data) {
      this.data = data
    }
  }
}
