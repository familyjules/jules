'use strict';

var mongoConfig = require('../../config/environment')
var mongo = require('mongodb').MongoClient
var DB;
var request = require('request');
var _ = require('lodash');
var accountSid = 'AC0d4f667900e2a6fea95046313f539958'; 
var authToken = '8dd9c7e404b9b17113030ae34db27443'; 
var client = require('twilio')(accountSid, authToken); 
var watson = require('watson-developer-cloud');

var question_and_answer_healthcare = watson.question_and_answer({
  username: '8a2c0b68-8e22-4ed4-931f-7f10c7e3b339',
  password: 'fyMSE9bnwewL',
  version: 'v1',
  dataset: 'healthcare'
});

mongo.connect(mongoConfig.mongo.uri, function (err, db){
  DB = db;
});

exports.index = function(req, res){
  var question = req.body.Body
  var city = req.body.FromCity
  var state = req.body.FromState
  var zipcode = req.body.FromZip
  var thisPhone = req.body.From

  var info = DB.collection('requests').find({phoneNumber: '+15105990762'},{_id:0, channel:0, phoneNumber:0, city:0, state:0, zipcode:0}).limit(1).sort({$natural:-1});
  
  info.on('data', function(datum){
    if(question.length === 1 && (question - 0) == question){

        datum.feedback = question - 1

        var options = {
          url: 'https://gateway.watsonplatform.net/question-and-answer-beta/api/v1/feedback',
          method: 'PUT',
          json: true,
          body: datum,
          auth: {
            user: "8a2c0b68-8e22-4ed4-931f-7f10c7e3b339",
            pass: "fyMSE9bnwewL",
            sendImmediately: true
          }
        };

        request(options, function(err, response) {

          if (response.statusCode === 200 || response.statusCode === 201) {
            client.messages.create({
            to: "+15105990762",
            from: "+14153196727",
            body: response.statusCode + ' thanks for the feedback!'
            }, function(err, message){
              res.status(200);
              res.end();
            })
          } else {
            client.messages.create({
              to: "+15105990762",
              from: "+14153196727",
              body: response.statusCode + ' thanks for the feedback!'
            }, function(err, message){
              res.status(200);
              res.end();
            })
          }
          res.end();

        });
        
    } else { 

      question_and_answer_healthcare.ask({text: question}, function (err, response) {
        var answer = response[0].question.evidencelist[0].text
        if(response[0].question.evidencelist[0].value > .3){

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

          client.messages.create({
            to: thisPhone,
            from: "+14153196727",
            body: answer
          }, function(err, message){
            client.messages.create({
              to: "",
              from: "",
              body: 'How would you rate this answer? 0 = bad, 1 = neutral, 2 = good.'
            }, function(err, message){
              res.status(200);
              res.end();
            })
          })
        } else if(response[0].question.evidencelist[0].value < .3){
          client.messages.create({
            to: thisPhone,
            from: "+14153196727",
            body: 'I was unable to answer your question. Please rephrase it so I can try again!'
          }, function(err, message){
            res.status(200);
            res.end();
          })
        }
      });
    }
  });
};
