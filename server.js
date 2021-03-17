require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// For easier access to POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// For validating URL domains requested
const dns = require('dns');

// Mongoose access and verification
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', function() {
  console.error('Database not connected!');
});
db.once('open', function(){
  console.log('Connection succeeded!');
  return;
});

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});


// My URL-shortener API
const urlShortenedSchema = new mongoose.Schema({
  url: String,
  address: String,
  short: Number
});
const ShortenedUrl = mongoose.model('ShortenedUrl', urlShortenedSchema);

// Submit a new URL, validate, shorten and upload
// All 'console.log' tests where commented to get out of scene
app.post('/api/shorturl/new', function(req, res) {
  let originalURL = req.body.url;
  if (/^https:\/\//.test(originalURL)) {
    originalURL = originalURL.replace(/^https:\/\//, '');
  } else if (/^http:\/\//.test(originalURL)) {
    originalURL = originalURL.replace(/^http:\/\//, '');
  }
  dns.lookup(originalURL, async function(err, address) {
    if (err) {
      res.json({ error: 'invalid url' });
    } else if (address) {
      // console.log(address);
      let doc;
      try {
        doc = await ShortenedUrl.findOne({address: address});
        if (doc === null) {
          let newDocumentIndex = await ShortenedUrl.estimatedDocumentCount((err, count) => count + 1);
          // console.log(newDocumentIndex);
          doc = new ShortenedUrl({
            url: originalURL,
            address: address,
            short: newDocumentIndex
          });
          doc = await doc.save();
          // console.log(doc);
          res.json({original_url: "https://" + originalURL, short_url: doc.short });
        } else if (doc) {
          res.json({original_url: "https://" + originalURL, short_url: doc.short });
          // console.log(doc);
        }
      }
      catch(e) {
        console.error(e);
      }
    }
  });
});

app.get('/api/shorturl/:number', async function(req, res) {
  let indexOfURL = req.params.number;
  let doc;
  try {
    doc = await ShortenedUrl.findOne({ short: indexOfURL });
    let redirectTo = "https://" + doc.url;
    // console.log(redirectTo);
    res.status(301).redirect(redirectTo);
  }
  catch(err) {
    // console.error(err);
    res.json({error: 'invalid URL'});
  }
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
