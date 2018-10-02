'use strict';

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGOLAB_URI);
mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

const Shorturl = mongoose.model('Shorturl', {
  long_url: {
    type: String,
    required: true,
    minlength: 1
  },
  short_url: {
    type: Number,
    required: true
  }
});

//API endpoints

app.post('/api/shorturl/new', (req, res) => {
  var url = req.body.url.replace(/(^\w+:|^)\/\//, '');
  dns.lookup(url, (err, addresses) => {
    if (err) {
      return res.json({ "error": "invalid URL" });
    }
    Shorturl.find({ long_url: req.body.url }, (err, element) => {
      if (err) {
        return console.log(err.message);
      }
      if (element.length == 0) {
        Shorturl.count({}, (err, count) => {
          var shorturl = new Shorturl({
            long_url: req.body.url,
            short_url: count + 1
          });
          shorturl.save().then(() => {
            console.log('url was successfully saved');
          })
          res.json({
            long_url: shorturl.long_url,
            short_url: shorturl.short_url
          });
        });
      } else {
        res.json({
          long_url: element[0].long_url,
          short_url: element[0].short_url
        });
      }
    });
  });
});

app.get("/api/shorturl/:short_url", function (req, res) {
  Shorturl.findOne({ short_url: req.params.short_url }, (err, element) => {
    if (err) {
      return console.log(err.message);
    }
    if (element) {
      console.log(element);
      res.writeHead(301,
        { Location: element.long_url }
      );
      res.end();
    }
  });
});


app.listen(port, () => {
  console.log('Node.js listening on port ' + port);
});