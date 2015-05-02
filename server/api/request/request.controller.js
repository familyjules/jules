'use strict';

var _ = require('lodash');


// Get list of requests
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

  request('https://answers.yahoo.com/dir/index?sid=396545018', function(err, yahooResponse, body){
    if(!err && yahooResponse.statusCode == 200){
      var questions = [];
      var $ = cheerio.load(body);
      var scrapedData = $('a.title', '.Bfc');
      var totalQuestions = Object.keys(scrapedData).length;
      scrapedData.each(function(){
        var question = this.children[0].data;
        question_and_answer_healthcare.ask({text: question}, function (err, response) {

          //if(response[0].question.evidencelist[0].value > 0.50){
            questions.push({"question": question, "answer": response[0].question.evidencelist[0].text});
          //}

          console.log(questions.length, totalQuestions);

          if(questions.length === totalQuestions) {
            return res.json(questions);
          }
        });
      });
    }
  });

};