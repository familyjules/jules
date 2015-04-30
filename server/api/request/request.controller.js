'use strict';

var _ = require('lodash');

// Get list of requests
exports.index = function(req, res) {

  var watson = require('watson-developer-cloud');

  var question_and_answer_healthcare = watson.question_and_answer({
    username: '8a2c0b68-8e22-4ed4-931f-7f10c7e3b339',
    password: 'fyMSE9bnwewL',
    version: 'v1',
    dataset: 'healthcare' /* The dataset can be specified when creating
                           * the service or when calling it */
  });


  question_and_answer_healthcare.ask({
    text: 'Why doesn\'t sex feel good?'}, function (err, response) {
      if (err)
        console.log('error:', err);
      else
        res.json({'confidence': response[0].question.evidencelist[0].value, 'answer': response[0].question.evidencelist[0].text})
  });
};