var CONFIG        = require("./config"),
    fs            = require('fs'),
    Client        = require('ftp'),
    c             = new Client(),
    c2            = new Client(),
    latestFolder  = "",
    pathToZip     = ""

downloadZipFromFtp (function () {
  console.log ("done")
})

function downloadZipFromFtp (callback) {
  c.on('ready', function() {
    c.list(function(err, list) {
      if (err) throw err

      latestFolder = getLatestFolder (list)

      c2.on ('ready', function () {
        c2.list(latestFolder, function(err, list) {
          if (err) throw err

          pathToZip = getPathToZip (list)

          c2.get(latestFolder + "/" + pathToZip, function(err, stream) {
            if (err) throw err

            stream.once('close', function() {
              c.end()

              callback()
            })

            stream.pipe(fs.createWriteStream("/tmp/" + latestFolder + ".zip"))
          })
        })

        c2.end()
      })

      c2.connect (CONFIG.CLIENT_OPTIONS)

      c.end()
    })
  })

  c.connect(CONFIG.CLIENT_OPTIONS)
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