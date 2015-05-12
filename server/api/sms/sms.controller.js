'use strict';

var config = require('../../config/environment');
var mongo = require('mongodb').MongoClient;
var request = require('request');
var twilio = require('twilio'); 
var watson = require('watson-developer-cloud');
var DB;

var question_and_answer_healthcare = watson.question_and_answer({
  username: config.apiKeys.watson.question_and_answer.username,
  password: config.apiKeys.watson.question_and_answer.password,
  version: 'v1',
  dataset: 'healthcare'
});

mongo.connect(config.mongo.uri, function (err, db){
  DB = db;
});

exports.index = function(req, res){
  var question = req.body.Body
  var city = req.body.FromCity
  var state = req.body.FromState
  var zipcode = req.body.FromZip
  var thisPhone = req.body.From

  var twilioClient = twilio(config.apiKeys.twilio.sid, config.apiKeys.twilio.auth)

  var info = DB.collection('requests').find({
    phoneNumber: thisPhone
  },
  {
    _id:0, 
    channel:0,
    phoneNumber:0,
    city:0,
    state:0,
    zipcode:0
  }).limit(1).sort({
    $natural: -1
  });
  
  info.on('data', function(datum){
    if(question.length === 1 && (question - 0) == question){

        datum.feedback = question - 1

        var options = {
          url: 'https://gateway.watsonplatform.net/question-and-answer-beta/api/v1/feedback',
          method: 'PUT',
          json: true,
          body: datum,
          auth: {
            user: config.apiKeys.watson.question_and_answer.username,
            pass: config.apiKeys.watson.question_and_answer.password,
            sendImmediately: true
          }
        };

        request(options, function(err, response) {
          if(response.statusCode === 200 || response.statusCode === 201) {
            twilioClient.messages.create({
            to: thisPhone,
            from: config.apiKeys.twilio.fromNumber,
            body: response.statusCode + ' thanks for the feedback!'
            }, function(err, message){
              res.status(200);
              res.end();
            })
          }
        });
        
    } else { 

      question_and_answer_healthcare.ask({text: question}, function (err, response) {
        var answer = response[0].question.evidencelist[0].text
        if(response[0].question.evidencelist[0].value > config.confidenceLevel){

          DB.collection('requests').insert({
            channel: 'sms', 
            phoneNumber: thisPhone, 
            city: city, 
            state: state, 
            zipcode: zipcode, 
            questionId: response[0].question.id,
            questionText: response[0].question.questionText,
            answerId: response[0].question.answers[0].id,
            answerText: response[0].question.answers[0].text,
            confidence: response[0].question.answers[0].confidence,
          })

          twilioClient.messages.create({
            to: thisPhone,
            from: config.apiKeys.twilio.fromNumber,
            body: answer
          }, function(err, message){
            twilioClient.messages.create({
              to: thisPhone,
              from: config.apiKeys.twilio.fromNumber,
              body: 'How would you rate this answer? 0 = bad, 1 = neutral, 2 = good.'
            }, function(err, message){
              res.status(200);
              res.end();
            })
          })
        } else if(response[0].question.evidencelist[0].value < config.confidenceLevel){
          twilioClient.messages.create({
            to: thisPhone,
            from: config.apiKeys.twilio.fromNumber,
            body: config.lowConfidenceMessage
          }, function(err, message){
            res.status(200);
            res.end();
          })
        }
      });
    }
  });
};