var config = require('../../config/environment');
var mongo = require('mongodb').MongoClient;
var request = require('request');
var twilio = require('../twilio/index.js');
var watson = require('watson-developer-cloud');
var log = require('loglevel');
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
  var callData = req.body;

  var twilioClient = twilio(config.apiKeys.twilio.sid, config.apiKeys.twilio.auth);

  if(question.length === 1 && (question - 0) == question){

    DB.collection('requests').find({phoneNumber: callData.From}).limit(1).sort({$natural: -1}).on('data', function(textInfo){
      
      if(!textInfo) return;

      //Watson expects -1 for poor and 1 for positive
      var watsonFeedback =  {
        questionId: textInfo.questionId,
        questionText: textInfo.questionText,
        answerId: textInfo.answerId,
        answerText: textInfo.answerText,
        confidence: textInfo.confidence,
        feedback: (Number(question) === 2 ? '-1' : '1')
      };

      var options = {
        url: 'https://gateway.watsonplatform.net/question-and-answer-beta/api/v1/feedback',
        method: 'PUT',
        json: true,
        body: watsonFeedback,
        auth: {
          user: config.apiKeys.watson.question_and_answer.username,
          pass: config.apiKeys.watson.question_and_answer.password,
          sendImmediately: true
        }
      };

      request(options, function(err, response) {
        //if(response.statusCode === 200 || response.statusCode === 201) {
          DB.collection('requests').update({"_id": ObjectID(textInfo._id)}, {$set:{feedback: Number(watsonFeedback.feedback)}}, function(){
            twilioClient.messages.create({
              to: callData.From,
              from: config.apiKeys.twilio.fromNumber,
              body: 'Thanks for the feedback!'
            }, function(err, message){
              res.status(200);
              res.end();
            });
          });
        //}
      });

    });
      
  } else {

    question_and_answer_healthcare.ask({text: question}, function (err, response) {

      var question = response[0].question;
      var answer = question.evidencelist[0];

      DB.collection('requests').insert({
        channel: 'sms', 
        phoneNumber: callData.From, 
        city: callData.FromCity, 
        state: callData.FromState, 
        zipCode: callData.FromZip, 
        questionId: question.id,
        questionText: question.questionText.toLowerCase(),
        answerId: answer.id,
        answerText: answer.text,
        confidence: Number(answer.value),
        confidenceMinimum: config.confidenceLevel,
        passedConfidenceTest: (answer.value >= config.confidenceLevel ? 1 : 0),
        error: (err ? 1 : 0),
        sentAtUnix: Math.floor(Date.now() / 1000),
        feedback: 0
      });

      if(answer.value >= config.confidenceLevel){

        twilioClient.messages.create({
          to: callData.From,
          from: config.apiKeys.twilio.fromNumber,
          body: answer.text
        }, function(err, message){
          twilioClient.messages.create({
            to: callData.From,
            from: config.apiKeys.twilio.fromNumber,
            body: 'How would you rate this answer? Reply with "1" for satisfactory or "2" for lacking.'
          }, function(err, message){
            res.status(200);
            res.end();
          });
        });

      } else {

        twilioClient.messages.create({
          to: callData.From,
          from: config.apiKeys.twilio.fromNumber,
          body: config.lowConfidenceMessage
        }, function(err, message){
          res.status(200);
          res.end();
        })

      }

    });
  }
};
