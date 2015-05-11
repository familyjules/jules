'use strict';

var express = require('express');
var controller = require('./d3.usa.controller');

var router = express.Router();

router.get('/', controller.index);

module.exports = router;