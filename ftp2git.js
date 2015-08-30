var CONFIG  = require("./config"),
    fs      = require("fs"),
    Client  = require("ftp"),
    Git     = require("nodegit"),
    del     = require("del"),
    unzip   = require("unzip"),
    logging = require("./logger")(true),
    sys     = require('sys'),
    exec    = require('child_process').exec
function puts(error, stdout, stderr) { sys.puts(stdout) }


listPrimaryDirectory (function (latestFolder) {
  listSecondaryDirectory (latestFolder, function (c, pathToZip) {
    downloadZip (c, pathToZip, function () {
      updateGitFiles (function () {
        deleteRepoContents (function () {
          extractZipIntoRepo (function () {
            exec(
              "cd /tmp/ftp2git_repo && " +
              "git add . -A && " +
              "git commit -m \"update\" && " +
              "git push origin master"
            , puts)
          })
        })
      })
    })
  })
})

function updateGitFiles (callback) {
  logging.print ("cloning/pulling repo ... ")

  exec(
    "cd /tmp && " +
    "git clone " + CONFIG.GIT_PATH + " /tmp/ftp2git_repo && " +
    "cd ftp2git_repo && " +
    "git pull"
  , function (error, stdout, stderr) {
    if (error) {
      logging.println ("ERROR" + error)
    }

    logging.println ("done")
    callback()
  })
}

function deleteRepoContents (callback) {
  logging.print ("Deleting old repo files and folders ... ")

  deleteFromFileSystem ("/tmp/ftp2git_repo/*", callback)
}

function deleteFromFileSystem (path, callback) {
  var delete_options = {
    force: true // allow access from outside directory running script (ie /tmp/)
  }

  del([path], delete_options, function (err, paths) {
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

      var latestFolder = getLatestFolder (list)

      logging.println ("done")
      callback (latestFolder)
    })
  })

  c.connect(CONFIG.CLIENT_OPTIONS)
}

function listSecondaryDirectory (latestFolder, callback) {
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