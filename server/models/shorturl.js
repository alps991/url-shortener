const mongoose = require('mongoose');

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

module.exports = { Shorturl };