var CONFIG         = require("./config"),
    fs             = require("fs"),
    Client         = require("ftp"),
    Git            = require("nodegit"),
    del            = require("del"),
    unzip          = require("unzip"),
    latestFolder   = "",
    pathToZip      = "",
    delete_options = {
      force: true // allow access from outside directory running script (ie /tmp/)
    }, Logging     = function (verbose) {
      this.constructor.prototype.print = function (message) {
        if (verbose)
          process.stdout.write (message)
      }

      this.constructor.prototype.println = function (message) {
        this.print (message + "\n")
      }
    }, logging = new Logging (true)

listPrimaryDirectory (function () {
  listSecondaryDirectory (function (c, pathToZip) {
    downloadZip (c, pathToZip, function () {
      updateGitFiles (function () {
        deleteRepoContents (function () {
          extractZipIntoRepo (function () {} )
        })
      })
    })
  })
})

function updateGitFiles (callback) {
  logging.print ("cloning repo ... ")
  Git.Clone(CONFIG.GIT_PATH, "/tmp/ftp2git_repo").then(function(repository) {
    logging.println ("done")

    callback ()
  }, function () {  // Error: folder exists (already cloned?)
    logging.println ("failed")
    logging.print   ("deleting old repo ... ")

    del(["/tmp/ftp2git_repo/"], delete_options, function (err, paths) {
      logging.println ("done")

      updateGitFiles (callback)
    })
  })
}

function deleteRepoContents (callback) {
  logging.print ("Deleting old repo files and folders ... ")

  del(["/tmp/ftp2git_repo/*"], delete_options, function (err, paths) {
    logging.println ("done")

    callback ()
  })
}

function extractZipIntoRepo (callback) {
  logging.print ("Extracting zip into repo ... ")

  fs.createReadStream("/tmp/ftp2git.zip")
    .pipe(unzip.Extract({ path: "/tmp/ftp2git_repo" }))
    .on("close", function () {
      logging.println ("done")

      callback ()
    })
}

function listPrimaryDirectory (callback) {
  var c = new Client()

  logging.print ("Listing primary dir ... ")
  c.on("ready", function() {
    c.list(function(err, list) {
      if (err) throw err

      c.end()

      latestFolder = getLatestFolder (list)

      logging.println ("done")
      callback ()
    })
  })

  c.connect(CONFIG.CLIENT_OPTIONS)
}

function listSecondaryDirectory (callback) {
  var c = new Client()

  logging.print ("Listing secondary dir ... ")
  c.on ("ready", function () {
    c.list(latestFolder, function(err, list) {
      if (err) throw err

      var pathToZip = latestFolder + "/" + getPathToZip (list)

      logging.println ("done")
      callback (c, pathToZip)
    })
  })

  c.connect (CONFIG.CLIENT_OPTIONS)
}

function downloadZip (c, pathToZip, callback) {
  logging.print ("downloading zip file ... ")

  c.get(pathToZip, function(err, stream) {
    if (err) throw err

    stream.once("close", function() {
      c.end()

      logging.println ("done")
      callback()
    })

    stream.pipe(fs.createWriteStream("/tmp/ftp2git.zip"))
  })
}

function getLatestFolder (list) {
  var latestFolder

  for (i in list) {
    var current_folder_name = list[i].name

    if (current_folder_name.indexOf(CONFIG.KEY_WORD) >= 0) {
      latestFolder = current_folder_name
    }
  }

  return latestFolder
}

function getPathToZip (list) {
  var pathToZip

  for (i in list) {
    var filename = list[i].name

    pathToZip = filename
  }

  return pathToZip
}