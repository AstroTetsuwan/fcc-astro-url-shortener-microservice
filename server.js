var mongo = require("mongodb").MongoClient;
var path = require("path");
var express = require('express');
var app = express();



var dbUrl = "mongodb://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@ds237120.mlab.com:37120/fcc-short-url";
var client, db;

var regexURL = /((http:\/\/)|(https:\/\/))([a-z]*\.)?([a-z0-9]*)(\.[a-z]*)/g;

mongo.connect(dbUrl, function(err, connection){
  if(err){console.error(err);}
  client = connection;
  db = client.db("fcc-short-url");
});


// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));     
});

app.get("/new/*", function (req, res){
  var address = req.url.replace("/new/", "");
  if(address.match(regexURL) !== null){
    addUrl(address, res);
  }
  else{
    res.json({error: "This is not a valid URL."});
  }
});

app.get("*",function(req, res){
    console.log(req.url);
    var shortUrl = req.url.replace("/", "");
    var collection = db.collection("shortened-url");
    collection.find({"short_url": shortUrl})
      .toArray(function(err, result){
      if(result.length > 0){
        res.redirect(result[0].original_url); 
      }
      else{
        res.json({error: "This URL is not in the database."});
      }
    });  
});


//recursive function
//get random number for the shortened url until it find one not used already
//when it find a free short url, write it to db and res.json the original and short url.
function addUrl(url, res){
  var collection = db.collection("shortened-url");
  var randomUrl = getRandomShortUrl();
    collection.find({"short_url": randomUrl}).toArray(function(err, result){
      if(result.length > 0){
        addUrl(url);
      }
      else{
        collection.insertMany([{"original_url": url, "short_url": randomUrl}], function(err, result){
          if(err){console.error(err);}
          else{res.json({"original_url": url, "short_url": randomUrl});}
        });
      }
    });
}

function getRandomShortUrl(){
  var shortURL = (Math.floor(Math.random() * 10000) + 1);
  return shortURL.toString();
}
process.on("beforeExit", function(){
  db.close();
});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
