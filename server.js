var mysql = require('mysql');

var connection  = mysql.createPool({
  connectionLimit : 100,
  host            : 'samplehost',
  user            : 'sampleuser',
  password        : 'samplepassword',
  database        : 'sampledatabase'
});

var youtubedl = require('youtube-dl');

var passwordHash = require('password-hash');
var billboard = require("billboard-top-100").getChart;
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var request = require('request');
var bodyParser = require('body-parser')

var port = process.env.PORT || 3000;

var cors = require('cors')
var express = require('express')
var path = require("path")

var spotifyToken;

var app = express()
app.use(express.static(__dirname + '/public'));

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    console.log(err);
    res.render('error', {
        message: err.message,
        error: err
    });
  });

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.use(cors())

var sessions = require("client-sessions");
app.use(sessions({
  cookieName: 'session', // cookie name dictates the key name added to the request object
  secret: 'an unguessable string', // should be a large unguessable string
  duration: 24 * 60 * 60 * 1000, // how long the session will stay valid in ms
  activeDuration: 1000 * 60 * 5 // if expiresIn < activeDuration, the session will be extended by activeDuration milliseconds
}));

app.get('/', function (req, res) {
  if (!req.session.email) {
    res.sendFile(path.join(__dirname+'/public/index.html'));
  }
  else {
    res.redirect('/discover');
  }
})

app.get('/albums', function (req, res) {
  billboard('billboard-200', function(songs, err){
      if (err) console.log(err);
  });

  var xmlhttp9 = new XMLHttpRequest();

  xmlhttp9.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var resp2 = JSON.parse(this.responseText);
      var obj = { body: resp2 };
      var myJSON = JSON.stringify(obj);
      res.send(myJSON);
    }
  }

  var reqString = "https://itunes.apple.com/search?term=gorillaz&limit=50&entity=song";
  xmlhttp9.open("GET",reqString);
  xmlhttp9.send();
})

app.get('/unauthorized', function (req, res) {
  res.sendFile(path.join(__dirname+'/public/unauthorized.html'));
})

app.get('/signin', function (req, res) {
  res.sendFile(path.join(__dirname+'/public/signin.html'));
})

app.get('/signup', function (req, res) {
  res.sendFile(path.join(__dirname+'/public/signup.html'));
})

app.get('/search', function (req, res) {
  if (!req.session.email) {
    res.redirect('/signin');
  }
  else {
    var finalReqString = '/public/searchresults.html';
    res.sendFile(path.join(__dirname+finalReqString));
  }
})

app.get('/charts', function (req, res) {
  if (!req.session.email) {
    res.redirect('/signin');
  }
  else {
    var finalReqString = '/public/chart.html';
    res.sendFile(path.join(__dirname+finalReqString));
  }
})

app.get('/discover', function (req, res) {
  if (!req.session.email) {
    res.redirect('/signin');
  }
  else {
    var finalReqString = '/public/discover.html';
    res.sendFile(path.join(__dirname+finalReqString));
  }
})

app.get('/getUsername', function (req, res) {
  if (!req.session.email) {
    res.redirect('/signin');
  }
  else {
    var obj = { username: req.session.username, userId: req.session.userId };
    var myJSON = JSON.stringify(obj);
    res.send(myJSON);
  }
})

app.get('/authenticateCredentials', function (req, res) {
  var email = req.query.email;
  var password = req.query.password;

  var sqlString1 = 'SELECT * FROM soundbit_users WHERE email=\'' + email + '\'';
  connection.query(sqlString1, function (error, results, fields) {
    if (error) {
      throw error;
    }

    var checkUndef = "" + results[0];

    if (checkUndef == "undefined") {
      var obj = { body: 'ERROR: Email address not in use' };
      var myJSON = JSON.stringify(obj);
      res.send(myJSON);
    }
    else {
      if (passwordHash.verify(password, results[0].password)) {
        req.session.email = email;
        req.session.username = results[0].firstName + " " + results[0].lastName;
        req.session.userId = results[0].id;
        var obj = { body: 'OK' };
        var myJSON = JSON.stringify(obj);
        res.send(myJSON);
      }
      else {
        var obj = { body: 'ERROR: Email/password combination invalid' };
        var myJSON = JSON.stringify(obj);
        res.send(myJSON);
      }
    }
  })
})

app.get('/addUser', function (req, res) {
  var firstName = req.query.firstName;
  firstName = firstName.substring(1);
  var lastName = req.query.lastName;
  var email = req.query.email;
  var password = req.query.password;

  var hashedPassword = passwordHash.generate(password);

  var sqlString1 = 'SELECT * FROM soundbit_users WHERE email=\'' + email + '\'';
  connection.query(sqlString1, function (error, results, fields) {
    if (error) {
      throw error;
    }

    var checkUndef = "" + results[0];
    if (checkUndef == "undefined") {
      var sqlString2 = 'INSERT INTO soundbit_users (firstName, lastName, email, password) VALUES (\'' + firstName + '\', \'' + lastName + '\', \'' + email + '\', \'' + hashedPassword + '\')';
      connection.query(sqlString2, function (error) {
        if (error) {
          throw error;
        }
      })

      req.session.email = email;
      req.session.username = firstName + " " + lastName;

      var sqlString3 = 'SELECT id FROM soundbit_users WHERE email=\'' + email + '\'';
      connection.query(sqlString3, function (error, results, fields) {
        if (error) {
          throw error;
        }

        req.session.userId = results[0].id;

        var obj = { body: 'OK' };
        var myJSON = JSON.stringify(obj);
        res.send(myJSON);
      })
    }
    else {
      var obj = { body: 'ERROR: Email already in use' };
      var myJSON = JSON.stringify(obj);
      res.send(myJSON);
    }
  })
})

app.get('/signout', function (req, res) {
  req.session.destroy(function(err) {
     res.redirect('/');
  });
})

app.get('/presearch', function (req, res) {
  /* Read query parameters */
  var code  = req.query.code; // Read the authorization code from the query parameters
  var keyword  = req.query.keyword;
})

app.get('/validate', function (req, res) {
  /* Read query parameters */
  var code  = req.query.code; // Read the authorization code from the query parameters
  var state = req.query.state; // (Optional) Read the state from the query parameter
})

app.get('/downloadSong', function (req, res) {
  var filename = req.query.filename;
  var videoId = req.query.videoId;

  var video = youtubedl('http://www.youtube.com/watch?v=' + videoId,
    // Optional arguments passed to youtube-dl.
    ['--format=18'],
    // Additional options can be given for calling `child_process.execFile()`.
    { cwd: __dirname });

  // Will be called when the download starts.
  video.on('info', function(info) {
  });

  res.writeHead(200, {
      'Content-Type': 'audio/m4a',
      'Content-Disposition': 'attachment; filename=' + filename + '.m4a'
  });

  video.pipe(res);
  res.write('');
})

app.get('/chartContent', function (req, res) {
  billboard('hot-100', function(songs, err){
      if (err) console.log(err);
      var myJSON = JSON.stringify(songs);
      res.send(myJSON);
  });
})

app.get('/discoverArtists', function (req, res) {

})

app.get('/discoverSongs', function (req, res) {

})

app.get('/online', function (req, res) {
  if (!req.session.email) {
    res.redirect('/signin');
  }
  else {
    res.sendFile(path.join(__dirname+'/public/online.html'));
  }
})

app.get('/downloaded', function (req, res) {
  if (!req.session.email) {
    res.redirect('/signin');
  }
  else {
    res.sendFile(path.join(__dirname+'/public/downloaded.html'));
  }
})

app.get('/addToOnlineSongs', function (req, res) {
  var trackId = req.query.trackId;
  var userId = req.query.userId;

  var sqlString1 = 'SELECT * FROM soundbit_users WHERE id=\'' + userId + '\'';
  connection.query(sqlString1, function (error, results, fields) {
    if (error) {
      throw error;
    }

    var checkUndef = "" + results[0];

    if (checkUndef == "undefined") {
      var obj = { body: 'ERROR: User account not found' };
      var myJSON = JSON.stringify(obj);
      res.send(myJSON);
    }
    else {
      var newOnlineSongs;

      if (results[0].onlineSongs) {
        newOnlineSongs = "" + results[0].onlineSongs + "" + trackId + ", ";
      }
      else {
        newOnlineSongs = "" + trackId + ", ";
      }

      var sqlString2 = 'UPDATE soundbit_users SET onlineSongs=\'' + newOnlineSongs + '\' WHERE id=' + userId;
      connection.query(sqlString2, function (error, results, fields) {
        if (error) {
          throw error;
        }
        else {
          var obj = { body: 'OK' };
          var myJSON = JSON.stringify(obj);
          res.send(myJSON);
        }
      })
    }
  })
})

app.get('/addToDownloadedSongs', function (req, res) {
  var trackId = req.query.trackId;
  var userId = req.query.userId;

  var sqlString1 = 'SELECT * FROM soundbit_users WHERE id=\'' + userId + '\'';
  connection.query(sqlString1, function (error, results, fields) {
    if (error) {
      throw error;
    }

    var checkUndef = "" + results[0];

    if (checkUndef == "undefined") {
      var obj = { body: 'ERROR: User account not found' };
      var myJSON = JSON.stringify(obj);
      res.send(myJSON);
    }
    else {
      var newDownloadedSongs;

      if (results[0].downloadedSongs) {
        newDownloadedSongs = "" + results[0].downloadedSongs + "" + trackId + ", ";
      }
      else {
        newDownloadedSongs = "" + trackId + ", ";
      }

      var sqlString2 = 'UPDATE soundbit_users SET downloadedSongs=\'' + newDownloadedSongs + '\' WHERE id=' + userId;
      connection.query(sqlString2, function (error, results, fields) {
        if (error) {
          throw error;
        }
        else {
          var obj = { body: 'OK' };
          var myJSON = JSON.stringify(obj);
          res.send(myJSON);
        }
      })
    }
  })
})

app.get('/callback', function(req, res) {
  /* Read query parameters */
  var code  = req.query.code; // Read the authorization code from the query parameters
  var state = req.query.state; // (Optional) Read the state from the query parameter
})

app.get('/searchInfo', function (req, res) {
  var keyword = req.query.keyword;

  // get top 50 songs related to keyword

  var song1_name;
  var song1_artist;
  var song1_album;
  var song1_image;
  var song2_name;
  var song2_artist;
  var song2_album;
  var song2_image;
  var song3_name;
  var song3_artist;
  var song3_album;
  var song3_image;
  var song4_name;
  var song4_artist;
  var song4_album;
  var song4_image;
  var song5_name;
  var song5_artist;
  var song5_album;
  var song5_image;
  var song6_name;
  var song6_artist;
  var song6_album;
  var song6_image;
  var song7_name;
  var song7_artist;
  var song7_album;
  var song7_image;
  var song8_name;
  var song8_artist;
  var song8_album;
  var song8_image;
  var song9_name;
  var song9_artist;
  var song9_album;
  var song9_image;
  var song10_name;
  var song10_artist;
  var song10_album;
  var song10_image;
  var song11_name;
  var song11_artist;
  var song11_album;
  var song11_image;
  var song12_name;
  var song12_artist;
  var song12_album;
  var song12_image;
  var song13_name;
  var song13_artist;
  var song13_album;
  var song13_image;
  var song14_name;
  var song14_artist;
  var song14_album;
  var song14_image;
  var song15_name;
  var song15_artist;
  var song15_album;
  var song15_image;
  var song16_name;
  var song16_artist;
  var song16_album;
  var song16_image;
  var song17_name;
  var song17_artist;
  var song17_album;
  var song17_image;
  var song18_name;
  var song18_artist;
  var song18_album;
  var song18_image;
  var song19_name;
  var song19_artist;
  var song19_album;
  var song19_image;
  var song20_name;
  var song20_artist;
  var song20_album;
  var song20_image;
  var song21_name;
  var song21_artist;
  var song21_album;
  var song21_image;
  var song22_name;
  var song22_artist;
  var song22_album;
  var song22_image;
  var song23_name;
  var song23_artist;
  var song23_album;
  var song23_image;
  var song24_name;
  var song24_artist;
  var song24_album;
  var song24_image;
  var song25_name;
  var song25_artist;
  var song25_album;
  var song25_image;
  var song26_name;
  var song26_artist;
  var song26_album;
  var song26_image;
  var song27_name;
  var song27_artist;
  var song27_album;
  var song27_image;
  var song28_name;
  var song28_artist;
  var song28_album;
  var song28_image;
  var song29_name;
  var song29_artist;
  var song29_album;
  var song29_image;
  var song30_name;
  var song30_artist;
  var song30_album;
  var song30_image;
  var song31_name;
  var song31_artist;
  var song31_album;
  var song31_image;
  var song32_name;
  var song32_artist;
  var song32_album;
  var song32_image;
  var song33_name;
  var song33_artist;
  var song33_album;
  var song33_image;
  var song34_name;
  var song34_artist;
  var song34_album;
  var song34_image;
  var song35_name;
  var song35_artist;
  var song35_album;
  var song35_image;
  var song36_name;
  var song36_artist;
  var song36_album;
  var song36_image;
  var song37_name;
  var song37_artist;
  var song37_album;
  var song37_image;
  var song38_name;
  var song38_artist;
  var song38_album;
  var song38_image;
  var song39_name;
  var song39_artist;
  var song39_album;
  var song39_image;
  var song40_name;
  var song40_artist;
  var song40_album;
  var song40_image;
  var song41_name;
  var song41_artist;
  var song41_album;
  var song41_image;
  var song42_name;
  var song42_artist;
  var song42_album;
  var song42_image;
  var song43_name;
  var song43_artist;
  var song43_album;
  var song43_image;
  var song44_name;
  var song44_artist;
  var song44_album;
  var song44_image;
  var song45_name;
  var song45_artist;
  var song45_album;
  var song45_image;
  var song46_name;
  var song46_artist;
  var song46_album;
  var song46_image;
  var song47_name;
  var song47_artist;
  var song47_album;
  var song47_image;
  var song48_name;
  var song48_artist;
  var song48_album;
  var song48_image;
  var song49_name;
  var song49_artist;
  var song49_album;
  var song49_image;
  var song50_name;
  var song50_artist;
  var song50_album;
  var song50_image;
  var song1_trackId;
  var song2_trackId;
  var song3_trackId;
  var song4_trackId;
  var song5_trackId;
  var song6_trackId;
  var song7_trackId;
  var song8_trackId;
  var song9_trackId;
  var song10_trackId;
  var song11_trackId;
  var song12_trackId;
  var song13_trackId;
  var song14_trackId;
  var song15_trackId;
  var song16_trackId;
  var song17_trackId;
  var song18_trackId;
  var song19_trackId;
  var song20_trackId;
  var song21_trackId;
  var song22_trackId;
  var song23_trackId;
  var song24_trackId;
  var song25_trackId;
  var song26_trackId;
  var song27_trackId;
  var song28_trackId;
  var song29_trackId;
  var song30_trackId;
  var song31_trackId;
  var song32_trackId;
  var song33_trackId;
  var song34_trackId;
  var song35_trackId;
  var song36_trackId;
  var song37_trackId;
  var song38_trackId;
  var song39_trackId;
  var song40_trackId;
  var song41_trackId;
  var song42_trackId;
  var song43_trackId;
  var song44_trackId;
  var song45_trackId;
  var song46_trackId;
  var song47_trackId;
  var song48_trackId;
  var song49_trackId;
  var song50_trackId;


  var xmlhttp9 = new XMLHttpRequest();

  xmlhttp9.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var resp2 = JSON.parse(this.responseText);

      if (resp2.results[0]) {
        song1_name = (resp2.results[0]).trackName;
        song1_artist = (resp2.results[0]).artistName;
        song1_album = (resp2.results[0]).collectionName;
        song1_image = (resp2.results[0]).artworkUrl100;
        song1_trackId = (resp2.results[0]).trackId;
      }
      if (resp2.results[1]) {
        song2_name = (resp2.results[1]).trackName;
        song2_artist = (resp2.results[1]).artistName;
        song2_album = (resp2.results[1]).collectionName;
        song2_image = (resp2.results[1]).artworkUrl100;
        song2_trackId = (resp2.results[1]).trackId;
      }
      if (resp2.results[2]) {
        song3_name = (resp2.results[2]).trackName;
        song3_artist = (resp2.results[2]).artistName;
        song3_album = (resp2.results[2]).collectionName;
        song3_image = (resp2.results[2]).artworkUrl100;
        song3_trackId = (resp2.results[2]).trackId;
      }
      if (resp2.results[3]) {
        song4_name = (resp2.results[3]).trackName;
        song4_artist = (resp2.results[3]).artistName;
        song4_album = (resp2.results[3]).collectionName;
        song4_image = (resp2.results[3]).artworkUrl100;
        song4_trackId = (resp2.results[3]).trackId;
      }
      if (resp2.results[4]) {
        song5_name = (resp2.results[4]).trackName;
        song5_artist = (resp2.results[4]).artistName;
        song5_album = (resp2.results[4]).collectionName;
        song5_image = (resp2.results[4]).artworkUrl100;
        song5_trackId = (resp2.results[4]).trackId;
      }
      if (resp2.results[5]) {
        song6_name = (resp2.results[5]).trackName;
        song6_artist = (resp2.results[5]).artistName;
        song6_album = (resp2.results[5]).collectionName;
        song6_image = (resp2.results[5]).artworkUrl100;
        song6_trackId = (resp2.results[5]).trackId;
      }
      if (resp2.results[6]) {
        song7_name = (resp2.results[6]).trackName;
        song7_artist = (resp2.results[6]).artistName;
        song7_album = (resp2.results[6]).collectionName;
        song7_image = (resp2.results[6]).artworkUrl100;
        song7_trackId = (resp2.results[6]).trackId;
      }
      if (resp2.results[7]) {
        song8_name = (resp2.results[7]).trackName;
        song8_artist = (resp2.results[7]).artistName;
        song8_album = (resp2.results[7]).collectionName;
        song8_image = (resp2.results[7]).artworkUrl100;
        song8_trackId = (resp2.results[7]).trackId;
      }
      if (resp2.results[8]) {
        song9_name = (resp2.results[8]).trackName;
        song9_artist = (resp2.results[8]).artistName;
        song9_album = (resp2.results[8]).collectionName;
        song9_image = (resp2.results[8]).artworkUrl100;
        song9_trackId = (resp2.results[8]).trackId;
      }
      if (resp2.results[9]) {
        song10_name = (resp2.results[9]).trackName;
        song10_artist = (resp2.results[9]).artistName;
        song10_album = (resp2.results[9]).collectionName;
        song10_image = (resp2.results[9]).artworkUrl100;
        song10_trackId = (resp2.results[9]).trackId;
      }
      if (resp2.results[10]) {
        song11_name = (resp2.results[10]).trackName;
        song11_artist = (resp2.results[10]).artistName;
        song11_album = (resp2.results[10]).collectionName;
        song11_image = (resp2.results[10]).artworkUrl100;
        song11_trackId = (resp2.results[10]).trackId;
  }      if (resp2.results[11]) {
        song12_name = (resp2.results[11]).trackName;
        song12_artist = (resp2.results[11]).artistName;
        song12_album = (resp2.results[11]).collectionName;
        song12_image = (resp2.results[11]).artworkUrl100;
        song12_trackId = (resp2.results[11]).trackId;
  }      if (resp2.results[12]) {
        song13_name = (resp2.results[12]).trackName;
        song13_artist = (resp2.results[12]).artistName;
        song13_album = (resp2.results[12]).collectionName;
        song13_image = (resp2.results[12]).artworkUrl100;
        song13_trackId = (resp2.results[12]).trackId;
  }      if (resp2.results[13]) {
        song14_name = (resp2.results[13]).trackName;
        song14_artist = (resp2.results[13]).artistName;
        song14_album = (resp2.results[13]).collectionName;
        song14_image = (resp2.results[13]).artworkUrl100;
        song14_trackId = (resp2.results[13]).trackId;
  }      if (resp2.results[14]) {
        song15_name = (resp2.results[14]).trackName;
        song15_artist = (resp2.results[14]).artistName;
        song15_album = (resp2.results[14]).collectionName;
        song15_image = (resp2.results[14]).artworkUrl100;
        song15_trackId = (resp2.results[14]).trackId;
  }      if (resp2.results[15]) {
        song16_name = (resp2.results[15]).trackName;
        song16_artist = (resp2.results[15]).artistName;
        song16_album = (resp2.results[15]).collectionName;
        song16_image = (resp2.results[15]).artworkUrl100;
        song16_trackId = (resp2.results[15]).trackId;
  }      if (resp2.results[16]) {
        song17_name = (resp2.results[16]).trackName;
        song17_artist = (resp2.results[16]).artistName;
        song17_album = (resp2.results[16]).collectionName;
        song17_image = (resp2.results[16]).artworkUrl100;
        song17_trackId = (resp2.results[16]).trackId;
  }      if (resp2.results[17]) {
        song18_name = (resp2.results[17]).trackName;
        song18_artist = (resp2.results[17]).artistName;
        song18_album = (resp2.results[17]).collectionName;
        song18_image = (resp2.results[17]).artworkUrl100;
        song18_trackId = (resp2.results[17]).trackId;
  }      if (resp2.results[18]) {
        song19_name = (resp2.results[18]).trackName;
        song19_artist = (resp2.results[18]).artistName;
        song19_album = (resp2.results[18]).collectionName;
        song19_image = (resp2.results[18]).artworkUrl100;
        song19_trackId = (resp2.results[18]).trackId;
  }      if (resp2.results[19]) {
        song20_name = (resp2.results[19]).trackName;
        song20_artist = (resp2.results[19]).artistName;
        song20_album = (resp2.results[19]).collectionName;
        song20_image = (resp2.results[19]).artworkUrl100;
        song20_trackId = (resp2.results[19]).trackId;
  }      if (resp2.results[20]) {
        song21_name = (resp2.results[20]).trackName;
        song21_artist = (resp2.results[20]).artistName;
        song21_album = (resp2.results[20]).collectionName;
        song21_image = (resp2.results[20]).artworkUrl100;
        song21_trackId = (resp2.results[20]).trackId;
  }      if (resp2.results[21]) {
        song22_name = (resp2.results[21]).trackName;
        song22_artist = (resp2.results[21]).artistName;
        song22_album = (resp2.results[21]).collectionName;
        song22_image = (resp2.results[21]).artworkUrl100;
        song22_trackId = (resp2.results[21]).trackId;
  }      if (resp2.results[22]) {
        song23_name = (resp2.results[22]).trackName;
        song23_artist = (resp2.results[22]).artistName;
        song23_album = (resp2.results[22]).collectionName;
        song23_image = (resp2.results[22]).artworkUrl100;
        song23_trackId = (resp2.results[22]).trackId;
  }      if (resp2.results[23]) {
        song24_name = (resp2.results[23]).trackName;
        song24_artist = (resp2.results[23]).artistName;
        song24_album = (resp2.results[23]).collectionName;
        song24_image = (resp2.results[23]).artworkUrl100;
        song24_trackId = (resp2.results[23]).trackId;
  }      if (resp2.results[24]) {
        song25_name = (resp2.results[24]).trackName;
        song25_artist = (resp2.results[24]).artistName;
        song25_album = (resp2.results[24]).collectionName;
        song25_image = (resp2.results[24]).artworkUrl100;
  }      if (resp2.results[25]) {
        song26_name = (resp2.results[25]).trackName;
        song26_artist = (resp2.results[25]).artistName;
        song26_album = (resp2.results[25]).collectionName;
        song26_image = (resp2.results[25]).artworkUrl100;
        song26_trackId = (resp2.results[25]).trackId;
  }      if (resp2.results[26]) {
        song27_name = (resp2.results[26]).trackName;
        song27_artist = (resp2.results[26]).artistName;
        song27_album = (resp2.results[26]).collectionName;
        song27_image = (resp2.results[26]).artworkUrl100;
        song27_trackId = (resp2.results[26]).trackId;
  }      if (resp2.results[27]) {
        song28_name = (resp2.results[27]).trackName;
        song28_artist = (resp2.results[27]).artistName;
        song28_album = (resp2.results[27]).collectionName;
        song28_image = (resp2.results[27]).artworkUrl100;
        song28_trackId = (resp2.results[27]).trackId;
  }      if (resp2.results[28]) {
        song29_name = (resp2.results[28]).trackName;
        song29_artist = (resp2.results[28]).artistName;
        song29_album = (resp2.results[28]).collectionName;
        song29_image = (resp2.results[28]).artworkUrl100;
        song29_trackId = (resp2.results[28]).trackId;
  }      if (resp2.results[29]) {
        song30_name = (resp2.results[29]).trackName;
        song30_artist = (resp2.results[29]).artistName;
        song30_album = (resp2.results[29]).collectionName;
        song30_image = (resp2.results[29]).artworkUrl100;
        song30_trackId = (resp2.results[29]).trackId;
  }      if (resp2.results[30]) {
        song31_name = (resp2.results[30]).trackName;
        song31_artist = (resp2.results[30]).artistName;
        song31_album = (resp2.results[30]).collectionName;
        song31_image = (resp2.results[30]).artworkUrl100;
        song31_trackId = (resp2.results[30]).trackId;
  }      if (resp2.results[31]) {
        song32_name = (resp2.results[31]).trackName;
        song32_artist = (resp2.results[31]).artistName;
        song32_album = (resp2.results[31]).collectionName;
        song32_image = (resp2.results[31]).artworkUrl100;
        song32_trackId = (resp2.results[31]).trackId;
  }      if (resp2.results[32]) {
        song33_name = (resp2.results[32]).trackName;
        song33_artist = (resp2.results[32]).artistName;
        song33_album = (resp2.results[32]).collectionName;
        song33_image = (resp2.results[32]).artworkUrl100;
        song33_trackId = (resp2.results[32]).trackId;
  }      if (resp2.results[33]) {
        song34_name = (resp2.results[33]).trackName;
        song34_artist = (resp2.results[33]).artistName;
        song34_album = (resp2.results[33]).collectionName;
        song34_image = (resp2.results[33]).artworkUrl100;
        song34_trackId = (resp2.results[33]).trackId;
  }      if (resp2.results[34]) {
        song35_name = (resp2.results[34]).trackName;
        song35_artist = (resp2.results[34]).artistName;
        song35_album = (resp2.results[34]).collectionName;
        song35_image = (resp2.results[34]).artworkUrl100;
        song35_trackId = (resp2.results[34]).trackId;
  }      if (resp2.results[35]) {
        song36_name = (resp2.results[35]).trackName;
        song36_artist = (resp2.results[35]).artistName;
        song36_album = (resp2.results[35]).collectionName;
        song36_image = (resp2.results[35]).artworkUrl100;
        song36_trackId = (resp2.results[35]).trackId;
  }      if (resp2.results[36]) {
        song37_name = (resp2.results[36]).trackName;
        song37_artist = (resp2.results[36]).artistName;
        song37_album = (resp2.results[36]).collectionName;
        song37_image = (resp2.results[36]).artworkUrl100;
        song37_trackId = (resp2.results[36]).trackId;
  }      if (resp2.results[37]) {
        song38_name = (resp2.results[37]).trackName;
        song38_artist = (resp2.results[37]).artistName;
        song38_album = (resp2.results[37]).collectionName;
        song38_image = (resp2.results[37]).artworkUrl100;
        song38_trackId = (resp2.results[37]).trackId;
  }      if (resp2.results[38]) {
        song39_name = (resp2.results[38]).trackName;
        song39_artist = (resp2.results[38]).artistName;
        song39_album = (resp2.results[38]).collectionName;
        song39_image = (resp2.results[38]).artworkUrl100;
        song39_trackId = (resp2.results[38]).trackId;
  }      if (resp2.results[39]) {
        song40_name = (resp2.results[39]).trackName;
        song40_artist = (resp2.results[39]).artistName;
        song40_album = (resp2.results[39]).collectionName;
        song40_image = (resp2.results[39]).artworkUrl100;
        song40_trackId = (resp2.results[39]).trackId;
  }      if (resp2.results[40]) {
        song41_name = (resp2.results[40]).trackName;
        song41_artist = (resp2.results[40]).artistName;
        song41_album = (resp2.results[40]).collectionName;
        song41_image = (resp2.results[40]).artworkUrl100;
        song41_trackId = (resp2.results[40]).trackId;
  }      if (resp2.results[41]) {
        song42_name = (resp2.results[41]).trackName;
        song42_artist = (resp2.results[41]).artistName;
        song42_album = (resp2.results[41]).collectionName;
        song42_image = (resp2.results[41]).artworkUrl100;
        song42_trackId = (resp2.results[41]).trackId;
  }      if (resp2.results[42]) {
        song43_name = (resp2.results[42]).trackName;
        song43_artist = (resp2.results[42]).artistName;
        song43_album = (resp2.results[42]).collectionName;
        song43_image = (resp2.results[42]).artworkUrl100;
        song43_trackId = (resp2.results[42]).trackId;
  }      if (resp2.results[43]) {
        song44_name = (resp2.results[43]).trackName;
        song44_artist = (resp2.results[43]).artistName;
        song44_album = (resp2.results[43]).collectionName;
        song44_image = (resp2.results[43]).artworkUrl100;
        song44_trackId = (resp2.results[43]).trackId;
  }      if (resp2.results[44]) {
        song45_name = (resp2.results[44]).trackName;
        song45_artist = (resp2.results[44]).artistName;
        song45_album = (resp2.results[44]).collectionName;
        song45_image = (resp2.results[44]).artworkUrl100;
        song45_trackId = (resp2.results[44]).trackId;
  }      if (resp2.results[45]) {
        song46_name = (resp2.results[45]).trackName;
        song46_artist = (resp2.results[45]).artistName;
        song46_album = (resp2.results[45]).collectionName;
        song46_image = (resp2.results[45]).artworkUrl100;
        song46_trackId = (resp2.results[45]).trackId;
  }      if (resp2.results[46]) {
        song47_name = (resp2.results[46]).trackName;
        song47_artist = (resp2.results[46]).artistName;
        song47_album = (resp2.results[46]).collectionName;
        song47_image = (resp2.results[46]).artworkUrl100;
        song47_trackId = (resp2.results[46]).trackId;
  }      if (resp2.results[47]) {
        song48_name = (resp2.results[47]).trackName;
        song48_artist = (resp2.results[47]).artistName;
        song48_album = (resp2.results[47]).collectionName;
        song48_image = (resp2.results[47]).artworkUrl100;
        song48_trackId = (resp2.results[47]).trackId;
  }      if (resp2.results[48]) {
        song49_name = (resp2.results[48]).trackName;
        song49_artist = (resp2.results[48]).artistName;
        song49_album = (resp2.results[48]).collectionName;
        song49_image = (resp2.results[48]).artworkUrl100;
        song49_trackId = (resp2.results[48]).trackId;
  }      if (resp2.results[49]) {
        song50_name = (resp2.results[49]).trackName;
        song50_artist = (resp2.results[49]).artistName;
        song50_album = (resp2.results[49]).collectionName;
        song50_image = (resp2.results[49]).artworkUrl100;
        song50_trackId = (resp2.results[49]).trackId;
      }



      var obj = { song1_name: song1_name, song1_artist: song1_artist, song1_album: song1_album, song1_image: song1_image, song2_name: song2_name, song2_artist: song2_artist, song2_album: song2_album, song2_image: song2_image, song3_name: song3_name, song3_artist: song3_artist, song3_album: song3_album, song3_image: song3_image, song4_name: song4_name, song4_artist: song4_artist, song4_album: song4_album, song4_image: song4_image,
    song5_name: song5_name, song5_artist: song5_artist, song5_album: song5_album, song5_image: song5_image, song6_name: song6_name, song6_artist: song6_artist, song6_album: song6_album, song6_image: song6_image, song7_name: song7_name, song7_artist: song7_artist, song7_album: song7_album, song7_image: song7_image, song8_name: song8_name, song8_artist: song8_artist, song8_album: song8_album, song8_image: song8_image,
    song9_name: song9_name, song9_artist: song9_artist, song9_album: song9_album, song9_image: song9_image, song10_name: song10_name, song10_artist: song10_artist, song10_album: song10_album, song10_image: song10_image,
    song11_name: song11_name, song11_artist: song11_artist, song11_album: song11_album, song11_image: song11_image,
    song12_name: song12_name, song12_artist: song12_artist, song12_album: song12_album, song12_image: song12_image,
    song13_name: song13_name, song13_artist: song13_artist, song13_album: song13_album, song13_image: song13_image,
    song14_name: song14_name, song14_artist: song14_artist, song14_album: song14_album, song14_image: song14_image,
    song15_name: song15_name, song15_artist: song15_artist, song15_album: song15_album, song15_image: song15_image,
    song16_name: song16_name, song16_artist: song16_artist, song16_album: song16_album, song16_image: song16_image,
    song17_name: song17_name, song17_artist: song17_artist, song17_album: song17_album, song17_image: song17_image,
    song18_name: song18_name, song18_artist: song18_artist, song18_album: song18_album, song18_image: song18_image,
    song19_name: song19_name, song19_artist: song19_artist, song19_album: song19_album, song19_image: song19_image,
    song20_name: song20_name, song20_artist: song20_artist, song20_album: song20_album, song20_image: song20_image,
    song21_name: song21_name, song21_artist: song21_artist, song21_album: song21_album, song21_image: song21_image,
    song22_name: song22_name, song22_artist: song22_artist, song22_album: song22_album, song22_image: song22_image,
    song23_name: song23_name, song23_artist: song23_artist, song23_album: song23_album, song23_image: song23_image,
    song24_name: song24_name, song24_artist: song24_artist, song24_album: song24_album, song24_image: song24_image,
    song25_name: song25_name, song25_artist: song25_artist, song25_album: song25_album, song25_image: song25_image,
    song26_name: song26_name, song26_artist: song26_artist, song26_album: song26_album, song26_image: song26_image,
    song27_name: song27_name, song27_artist: song27_artist, song27_album: song27_album, song27_image: song27_image,
    song28_name: song28_name, song28_artist: song28_artist, song28_album: song28_album, song28_image: song28_image,
    song29_name: song29_name, song29_artist: song29_artist, song29_album: song29_album, song29_image: song29_image,
    song30_name: song30_name, song30_artist: song30_artist, song30_album: song30_album, song30_image: song30_image,
    song31_name: song31_name, song31_artist: song31_artist, song31_album: song31_album, song31_image: song31_image,
    song32_name: song32_name, song32_artist: song32_artist, song32_album: song32_album, song32_image: song32_image,
    song33_name: song33_name, song33_artist: song33_artist, song33_album: song33_album, song33_image: song33_image,
    song34_name: song34_name, song34_artist: song34_artist, song34_album: song34_album, song34_image: song34_image,
    song35_name: song35_name, song35_artist: song35_artist, song35_album: song35_album, song35_image: song35_image,
    song36_name: song36_name, song36_artist: song36_artist, song36_album: song36_album, song36_image: song36_image,
    song37_name: song37_name, song37_artist: song37_artist, song37_album: song37_album, song37_image: song37_image,
    song38_name: song38_name, song38_artist: song38_artist, song38_album: song38_album, song38_image: song38_image,
    song39_name: song39_name, song39_artist: song39_artist, song39_album: song39_album, song39_image: song39_image,
    song40_name: song40_name, song40_artist: song40_artist, song40_album: song40_album, song40_image: song40_image,
    song41_name: song41_name, song41_artist: song41_artist, song41_album: song41_album, song41_image: song41_image,
    song42_name: song42_name, song42_artist: song42_artist, song42_album: song42_album, song42_image: song42_image,
    song43_name: song43_name, song43_artist: song43_artist, song43_album: song43_album, song43_image: song43_image,
    song44_name: song44_name, song44_artist: song44_artist, song44_album: song44_album, song44_image: song44_image,
    song45_name: song45_name, song45_artist: song45_artist, song45_album: song45_album, song45_image: song45_image,
    song46_name: song46_name, song46_artist: song46_artist, song46_album: song46_album, song46_image: song46_image,
    song47_name: song47_name, song47_artist: song47_artist, song47_album: song47_album, song47_image: song47_image,
    song48_name: song48_name, song48_artist: song48_artist, song48_album: song48_album, song48_image: song48_image,
    song49_name: song49_name, song49_artist: song49_artist, song49_album: song49_album, song49_image: song49_image,
    song50_name: song50_name, song50_artist: song50_artist, song50_album: song50_album, song50_image: song50_image,
    song1_trackId: song1_trackId,
    song2_trackId: song2_trackId,
    song3_trackId: song3_trackId,
    song4_trackId: song4_trackId,
    song5_trackId: song5_trackId,
    song6_trackId: song6_trackId,
    song7_trackId: song7_trackId,
    song8_trackId: song8_trackId,
    song9_trackId: song9_trackId,
    song10_trackId: song10_trackId,
    song11_trackId: song11_trackId,
    song12_trackId: song12_trackId,
    song13_trackId: song13_trackId,
    song14_trackId: song14_trackId,
    song15_trackId: song15_trackId,
    song16_trackId: song16_trackId,
    song17_trackId: song17_trackId,
    song18_trackId: song18_trackId,
    song19_trackId: song19_trackId,
    song20_trackId: song20_trackId,
    song21_trackId: song21_trackId,
    song22_trackId: song22_trackId,
    song23_trackId: song23_trackId,
    song24_trackId: song24_trackId,
    song25_trackId: song25_trackId,
    song26_trackId: song26_trackId,
    song27_trackId: song27_trackId,
    song28_trackId: song28_trackId,
    song29_trackId: song29_trackId,
    song30_trackId: song30_trackId,
    song31_trackId: song31_trackId,
    song32_trackId: song32_trackId,
    song33_trackId: song33_trackId,
    song34_trackId: song34_trackId,
    song35_trackId: song35_trackId,
    song36_trackId: song36_trackId,
    song37_trackId: song37_trackId,
    song38_trackId: song38_trackId,
    song39_trackId: song39_trackId,
    song40_trackId: song40_trackId,
    song41_trackId: song41_trackId,
    song42_trackId: song42_trackId,
    song43_trackId: song43_trackId,
    song44_trackId: song44_trackId,
    song45_trackId: song45_trackId,
    song46_trackId: song46_trackId,
    song47_trackId: song47_trackId,
    song48_trackId: song48_trackId,
    song49_trackId: song49_trackId,
    song50_trackId: song50_trackId

  };

      var myJSON = JSON.stringify(obj);
      res.send(myJSON);
    }
  }

  var reqString = "https://itunes.apple.com/search?term=" + keyword + "&limit=50&entity=song";
  xmlhttp9.open("GET",reqString);
  xmlhttp9.send();
})

app.get('/getVideoId', function (req, res) {
  var name = req.query.name;
  var artist = req.query.artist;

  var xmlhttp3 = new XMLHttpRequest();

  xmlhttp3.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      var resp2 = JSON.parse(this.responseText);

      if ((resp2.items[0])) {
        var obj = { videoId: (resp2.items[0]).id.videoId };
        var myJSON = JSON.stringify(obj);
        res.send(myJSON);
      }
      else {
        var obj = { videoId: "ERR" };
        var myJSON = JSON.stringify(obj);
        res.send(myJSON);
      }
    }
  }

  var reqString = "https://www.googleapis.com/youtube/v3/search?part=snippet&q=" + name + " " + artist +  " audio&type=video&key=yourapikey";
  xmlhttp3.open("GET",reqString);
  xmlhttp3.send();
})

app.listen(port);
console.log("Running at Port " + port);
