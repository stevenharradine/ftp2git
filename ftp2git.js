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
    }

function print (message) {
  process.stdout.write (message)
}

function println (message) {
  print (message + "\n")
}

listPrimaryDirectory (function () {
  listSecondaryDirectory (function (c, pathToZip) {
    downloadZip (c, pathToZip, function () {
      updateGitFiles ()  // TODO: cant have a callback in a promise?
    })
  })
})

function updateGitFiles () {
  print ("cloning repo ... ")
  Git.Clone(CONFIG.GIT_PATH, "/tmp/ftp2git_repo").then(function(repository) {
    println ("done")

    deleteRepoContents (function () {
    })
  }, function () {  // Error: folder exists (already cloned?)
    println ("failed")
    print   ("deleting old repo ... ")

    del(["/tmp/ftp2git_repo/"], delete_options, function (err, paths) {
      println ("done")

      updateGitFiles ()
    })
  })
}

function deleteRepoContents () {
  print ("Deleting old repo files and folders ... ")

  del(["/tmp/ftp2git_repo/*"], delete_options, function (err, paths) {
    println ("done")

    extractZipIntoRepo ()
  })
}

function extractZipIntoRepo () {
  print ("Extracting zip into repo ... ")

  fs.createReadStream("/tmp/ftp2git.zip")
    .pipe(unzip.Extract({ path: "/tmp/ftp2git_repo" }))
    .on("close", function () {
      println ("done")
    })
}

function listPrimaryDirectory (callback) {
  var c = new Client()

  print ("Listing primary dir ... ")
  c.on("ready", function() {
    c.list(function(err, list) {
      if (err) throw err
      println ("done")

      c.end()

      latestFolder = getLatestFolder (list)

      callback ()
    })
  })

  c.connect(CONFIG.CLIENT_OPTIONS)
}

function listSecondaryDirectory (callback) {
  var c = new Client()

  print ("Listing secondary dir ... ")
  c.on ("ready", function () {
    c.list(latestFolder, function(err, list) {
      if (err) throw err
      println ("done")

      var pathToZip = latestFolder + "/" + getPathToZip (list)

      callback (c, pathToZip)
    })
  })

  c.connect (CONFIG.CLIENT_OPTIONS)
}

function downloadZip (c, pathToZip, callback) {
  print ("downloading zip file ... ")
  c.get(pathToZip, function(err, stream) {
    if (err) throw err

    stream.once("close", function() {
      c.end()

      println ("done")

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