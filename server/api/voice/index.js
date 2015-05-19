var express = require('express');
var twilio = require('../twilio/index.js');
var speech = require('../voice/speech.js');
var config = require('../../config/environment');
var watson = require('watson-developer-cloud');
var log = require('loglevel');
var fs = require('fs');
var mongo = require('mongodb').MongoClient;
var DB;

var router = express.Router();

var twilioClient = twilio(config.apiKeys.twilio.sid, config.apiKeys.twilio.auth);

var question_and_answer_healthcare = watson.question_and_answer({
  username: config.apiKeys.watson.question_and_answer.username,
  password: config.apiKeys.watson.question_and_answer.password,
  version: 'v1',
  dataset: 'healthcare'
});

mongo.connect(config.mongo.uri, function (err, db){
  DB = db;
});

// Used to store a map from call_ssid -> answers
var answers = {}

// Callback soup stitching together API services used to
// convert between an audio recording -> text -> watson answer.
var enqueue_question = function (callData) {
  speech.text(callData.RecordingUrl, function (translation) {
    question_and_answer_healthcare.ask({text: translation}, function (err, response) {
      var question = response[0].question;
      var answer = question.evidencelist[0];

      answers[callData.CallSid] = answer.text;

      DB.collection('requests').insert({
        channel: 'phone', 
        callSid: callData.CallSid,
        phoneNumber: callData.From, 
        city: callData.FromCity, 
        state: callData.FromState, 
        zipCode: callData.FromZip, 
        questionId: question.id,
        questionText: question.questionText,
        answerId: answer.id,
        answerText: answer.text,
        confidence: answer.value,
        confidenceMinimum: config.confidenceLevel,
        passedConfidenceTest: (answer.value >= config.confidenceLevel ? 1 : 0),
        error: (err ? 1 : 0),
        sentAtUnix: Math.floor(Date.now() / 1000),
        feedback: 0
      });


      twilioClient.calls(callData.CallSid).update({
        url: (answer.value >= config.confidenceLevel ? 'http://jules.mybluemix.net/api/voice/answer' : 'http://jules.mybluemix.net/api/voice/boo')
      });

    });
  });
};

// Twilio callback handling. Set up routes for different parts of the phone call.
router.post('/', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()
  twiml.say('Welcome to Jules, how can I help you? Press any key after you have finished speaking!', { voice: 'alice' })
    .record({timeout: 60, action: '/api/voice/recording'})

  res.send(twiml)
});

router.post('/recording', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()

  enqueue_question(req.body)

  twiml.say('One moment please, I\'m thinking', { voice: 'alice' }).redirect('/api/voice/holding')
  res.send(twiml)
});

router.post('/holding', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()
  twiml.pause({length: 5})
    .say("I'm still thinking", { voice: 'alice' })
    .redirect('/api/voice/holding')

  res.send(twiml)
});

router.post('/answer', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()

  twiml.say(answers[req.body.CallSid], { voice: 'alice' }).gather({
    action:'/api/voice/feedback',
    finishOnKey:'#'
  }, function() {
    this.pause({length: 1}).say('Please stay on the line to provide feedback, otherwise you may hang up.', { voice: 'alice' }).pause({length: 1}).say('Press 1 then pound if the answer was satisfactory', { voice: 'alice' }).say('Press 2 then pound if the answer could\'ve been better', { voice: 'alice' });
  });

  res.send(twiml)
});

router.post('/feedback', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()

  DB.collection('requests').update({callSid: req.body.CallSid}, {$set:{feedback:Number(req.body.Digits)}}, function(){
    twiml.say('Thanks for the feedback! Goodbye!', { voice: 'alice' }).hangup();
    res.send(twiml)
  });
});

router.post('/boo', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse();
  twiml.say('Sorry, I was unable to find a good answer to your question! Please try again. Goodbye.', { voice: 'alice' }).hangup();
  res.send(twiml);
});

router.post('/fallback', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse();
  twiml.say('Sorry, an error has occurred!', { voice: 'alice' }).hangup();
  res.send(twiml);
});

module.exports = router