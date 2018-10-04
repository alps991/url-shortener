'use strict';

require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dns = require('dns');
const { URL } = require('url');
const hbs = require('hbs');

const app = express();

// Basic Configuration 
const port = process.env.PORT || 3000;

app.set('view engine', 'hbs');
hbs.registerPartials(__dirname + "/views/partials/");

mongoose.connect(process.env.MONGOLAB_URI);
mongoose.Promise = global.Promise;

app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', (req, res) => {
  res.sendFile(process.cwd() + '/views/index.html');
});

const addhttp = (url) => {
  if (!/^(?:f|ht)tps?\:\/\//.test(url)) {
    url = "http://" + url;
  }
  return url;
}

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

app.post('/newURL', (req, res) => {
  var long_url = addhttp(req.body.url);
  var url_host = new URL(long_url).hostname;
  var short_url;

  dns.lookup(url_host, (err, addresses) => {
    if (err) {
      return res.render("errorPage.hbs", { invalid_url: req.body.url });
    }

    Shorturl.find({ long_url }, (err, element) => {
      if (err) {
        return console.log('error connecting to database');
      }

      if (element.length == 0) {
        Shorturl.count({}, (err, count) => {
          if (err) {
            return console.log('error counting');
          }
          var shorturl = new Shorturl({
            long_url,
            short_url: count + 1
          });
          shorturl.save().then(() => {
            console.log('url was successfully saved');
            res.render('successPage.hbs', {
              long_url,
              short_url: shorturl.short_url
            });
          });
        });
      } else {
        long_url = element[0].long_url;
        short_url = element[0].short_url;

        res.render('successPage.hbs', {
          long_url,
          short_url
        });
      }

    });
  });
});

app.get("/:short_url", function (req, res) {
  Shorturl.findOne({ short_url: req.params.short_url }, (err, element) => {
    if (err) {
      return console.log(err.message);
    }
    if (element) {
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