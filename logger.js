module.exports = function (verbose) {
  var me = {}

  me.print = function (message) {
    if (verbose) {
      process.stdout.write (message)
    }
  }
  me.println = function (message) {
    me.print (message + "\n")
  }

  return me
}