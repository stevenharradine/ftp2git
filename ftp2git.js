var CONFIG        = require("./config"),
    fs            = require('fs'),
    Client        = require('ftp'),
    c             = new Client(),
    c2            = new Client(),
    clientOptions = {
      "host": CONFIG.FTP_URL,
      "user": CONFIG.FTP_USER,
      "password": CONFIG.FTP_PASS
    },
    latestFolder  = "",
    pathToZip     = ""

c.on('ready', function() {
  c.list(function(err, list) {
    if (err) throw err

    for (l in list) {
      var current_folder_name = list[l].name;

      if (current_folder_name.indexOf(CONFIG.KEY_WORD) >= 0) {
        latestFolder = current_folder_name
      }
    }

    client2Options = {
      "host": CONFIG.FTP_URL,
      "user": CONFIG.FTP_USER,
      "password": CONFIG.FTP_PASS
    }

    c2.on ('ready', function () {
      c2.list(latestFolder, function(err, list) {
        if (err) throw err

        for (l in list) {
          var filename = list[l].name

          pathToZip = filename
        }

        c2.get(latestFolder + "/" + pathToZip, function(err, stream) {
          if (err) throw err;
          stream.once('close', function() { c.end() })
          stream.pipe(fs.createWriteStream("/tmp/" + latestFolder + ".zip"))
        })
      })

      c2.end()
    })

    c2.connect (client2Options)

    c.end()
  })
})

c.connect(clientOptions)