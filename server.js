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
db.on('error', console.error.bind(console, 'connection error'));
db.once('open', console.log('Mongoose connection succesfull!'));

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
  hash: String,
  short: Number
});
const ShortenedUrl = mongoose.model('ShortenedUrl', urlShortenedSchema);

const urlsShortened = [];

// Submit a new URL, validate and shorten
app.post('/api/shorturl/new', function(req, res) {
  let originalURL = req.body.url;
  if (/^https:\/\//.test(originalURL)) {
    originalURL = originalURL.replace(/^https:\/\//, '');
  } else if (/^http:\/\//.test(originalURL)) {
    originalURL = originalURL.replace(/^http:\/\//, '');
  }
  dns.lookup(originalURL, function(err, address, family) {
    if (err) {
      res.json({ error: 'invalid url' });
    } else if (address) {
      if (urlsShortened.includes(originalURL)) {
        res.json({original_url: "https://" + originalURL, short_url: urlsShortened.indexOf(originalURL) + 1});
        console.log(urlsShortened);
      } else {
        urlsShortened.push(originalURL);
        res.json({original_url: "https://" + originalURL, short_url: urlsShortened.indexOf(originalURL) + 1})
        console.log(urlsShortened);
      }
    }
  });
});

app.get('/api/shorturl/:number', function(req, res) {
  let indexOfURL = req.params.number - 1;
  let redirectTo = urlsShortened[indexOfURL];
  redirectTo = "https://" + redirectTo;
  console.log(redirectTo);
  res.status(301).redirect(redirectTo);
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
