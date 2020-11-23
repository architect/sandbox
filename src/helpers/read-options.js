module.exports = function (options) {
  // Set up verbositude
  let verbose = false
  let findVerbose = option => [ '-v', '--verbose', 'verbose' ].includes(option)
  if (options && options.some(findVerbose)) {
    verbose = true
  }

  // Set up scheduled
  let runScheduled = false
  let findScheduled = option => [ '-s', '--scheduled', 'scheduled' ].includes(option)
  if (options && options.some(findScheduled)) {
    runScheduled = true
  }

  return { verbose, runScheduled }
}
