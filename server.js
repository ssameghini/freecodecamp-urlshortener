require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();

// For easier access to POST requests
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));

// For validating URL domains requested
const dns = require('dns');

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// My URL-shortener API
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
        res.json({original_url: originalURL, short_url: urlsShortened.indexOf(originalURL) + 1});
        console.log(urlsShortened);
      } else {
        urlsShortened.push(originalURL);
        res.json({original_url: originalURL, short_url: urlsShortened.indexOf(originalURL) + 1})
        console.log(urlsShortened);
      }
    }
  });
});
// QUEDA PENDIENTE DESTRUCTURAR O ACCEDER AL 'original_url' DE LA COLECCIÓN, PARA NO DUPLICAR Y PARA REDIRIGIR

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
