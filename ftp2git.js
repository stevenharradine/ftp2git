var CONFIG         = require("./config"),
    fs             = require("fs"),
    Client         = require("ftp"),
    Git            = require("nodegit"),
    del            = require("del"),
    unzip          = require("unzip"),
    logging        = require("./logger")(true)

listPrimaryDirectory (function (latestFolder) {
  listSecondaryDirectory (latestFolder, function (c, pathToZip) {
//    downloadZip (c, pathToZip, function () {
      updateGitFiles (0, function () {
        deleteRepoContents (function () {
          extractZipIntoRepo (function () {
            // TODO: git add . -A && git commit -m "update" && git push



console.log ("00")
Git.Repository.open("/tmp/ftp2git_repo")
.then(function(indexResult) {
  console.log ("A1")
    index  = indexResult;
console.log ("A2")
    // this file is in the root of the directory and doesn't need a full path
    index.addByPath('.');
console.log ("A3")
    // this will write files to the index
    index.write();
console.log ("A4")
    return index.writeTree();

})/*.then(function(oidResult) {
console.log ("B")
    oid = oidResult;
    return Git.Reference.nameToId(repo, "HEAD");

}).then(function(head) {
console.log ("C")
    return repo.getCommit(head);

}).then(function(parent) {
console.log ("D")
    author = Git.Signature.now("Author Name", "author@email.com");
    committer = Git.Signature.now("Commiter Name", "commiter@email.com");

    return repo.createCommit("HEAD", author, committer, "Added the Readme file for theme builder", oid, [parent]);
}).then(function(commitId) {
  console.log ("E")
    return console.log("New Commit: ", commitId);
})


/// PUSH
.then(function() {
    return repo.getRemote("origin");
}).then(function(remoteResult) {

  console.log('remote Loaded');
  remote = remoteResult;

  remote.setCallbacks({
      credentials: function(url, userName) {
          return Git.Cred.sshKeyFromAgent(userName)
      }
  });

  console.log('remote Configured');
  return remote.connect(Git.Enums.DIRECTION.PUSH);

}).then(function() {
  console.log('remote Connected?', remote.connected())

  return remote.push(
            ["refs/heads/master:refs/heads/master"],
            null,
            repo.defaultSignature(),
            "Push to master")
}).then(function() {
    console.log('remote Pushed!')
})*/
.catch(function(reason) {
    console.log("E"+reason);
})




          })
        })
      })
//    })
  })
})

function updateGitFiles (fail_counter, callback) {
  var options = {
    remoteCallbacks: {
      credentials: function (url, userName) {
        return Git.Cred.sshKeyFromAgent(userName)
//        return Git.Cred.sshKeyNew (userName, 'public.key', 'private.key', '')
      }
    }
  }

  logging.print ("cloning " + (fail_counter >= 1 ? "(again) " : "") + "repo ... ")
  Git.Clone(CONFIG.GIT_PATH, "/tmp/ftp2git_repo", options).then(function(repository) {
    logging.println ("done")

    callback ()
  }, function () {  // Error: folder exists (already cloned?)
    if (fail_counter++ == 0) {
      logging.println ("failed")
      logging.print   ("deleting old repo ... ")

      deleteFromFileSystem ("/tmp/ftp2git_repo/", function () {
        updateGitFiles (fail_counter, callback)
      })
    } else {
      logging.println ("failed!")
    }
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