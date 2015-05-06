'use strict';

var _ = require('lodash');

// Get list of requestzocdocs
exports.index = function(req, res) {
  
  var watson = require('watson-developer-cloud');

  var question_and_answer_healthcare = watson.question_and_answer({
    username: '8a2c0b68-8e22-4ed4-931f-7f10c7e3b339',
    password: 'fyMSE9bnwewL',
    version: 'v1',
    dataset: 'healthcare'
  });

  var request = require('request');
  var cheerio = require('cheerio');
  var q = require('q');

  request('https://www.zocdoc.com/answers', function(err, zocdocResponse, body){
    if(!err && zocdocResponse.statusCode == 200){
      var questions = [];
      var $ = cheerio.load(body);
      var scrapedData = $('a.answer-name', '.AnswersLayout-left');
      var totalQuestions = scrapedData.length;

      console.log('total questions found: ' + totalQuestions);

      scrapedData.each(function(i, e){
        var question = this.attribs.title;
        question_and_answer_healthcare.ask({text: question}, function (err, response) {
          
          if(response[0].question.evidencelist[0].value > 0.75){
            questions.push({"question": question, "answer": response[0].question.evidencelist[0].text, 'confidence': Math.floor(response[0].question.evidencelist[0].value * 100) + '%'});
          } else {
            totalQuestions--;
          }

          if(questions.length === totalQuestions) return res.json(questions);

        });

      });
    }
  });
};