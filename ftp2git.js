var CONFIG        = require("./config"),
    fs            = require('fs'),
    Client        = require('ftp'),
    latestFolder  = "",
    pathToZip     = ""

listPrimaryDirectory (function () {
  listSecondaryDirectory (function (c, pathToZip) {
    downloadZip (c, pathToZip, function () {
      console.log ("done")
    })
  })
})

function listPrimaryDirectory (callback) {
  var c = new Client()

  c.on('ready', function() {
    c.list(function(err, list) {
      if (err) throw err

      latestFolder = getLatestFolder (list)

      c.end()

      callback ()
    })
  })

  c.connect(CONFIG.CLIENT_OPTIONS)
}

function listSecondaryDirectory (callback) {
  var c = new Client()

  c.on ('ready', function () {
    c.list(latestFolder, function(err, list) {
      if (err) throw err

      var pathToZip = latestFolder + "/" + getPathToZip (list)

      callback (c, pathToZip)
    })

    c.end()
  })

  c.connect (CONFIG.CLIENT_OPTIONS)
}

function downloadZip (c, pathToZip, callback) {
  c.get(pathToZip, function(err, stream) {
    if (err) throw err

    stream.once('close', function() {
      c.end()

      callback()
    })

    stream.pipe(fs.createWriteStream("/tmp/" + latestFolder + ".zip"))
  })
}

function getLatestFolder (list) {
  var latestFolder

  for (l in list) {
    var current_folder_name = list[l].name

    if (current_folder_name.indexOf(CONFIG.KEY_WORD) >= 0) {
      latestFolder = current_folder_name
    }
  }

  return latestFolder
}

function getPathToZip (list) {
  var pathToZip

  for (l in list) {
    var filename = list[l].name

    pathToZip = filename
  }

  return pathToZip
}