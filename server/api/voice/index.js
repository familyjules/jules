var express = require('express');
var twilio = require('../twilio/index.js');
var speech = require('../voice/speech.js');
var config = require('../../config/environment');
var watson = require('watson-developer-cloud');
var log = require('loglevel');
var fs = require('fs');

var router = express.Router();

var twilioClient = twilio(config.apiKeys.twilio.sid, config.apiKeys.twilio.auth);

var question_and_answer_healthcare = watson.question_and_answer({
  username: config.apiKeys.watson.question_and_answer.username,
  password: config.apiKeys.watson.question_and_answer.password,
  version: 'v1',
  dataset: 'healthcare'
});

// Used to store a map from call_ssid -> answers
var answers = {}

// Callback soup stitching together API services used to
// convert between an audio recording -> text -> watson answer.
var enqueue_question = function (recording) {
  var audio_location = recording.RecordingUrl;
  var call_ssid = recording.CallSid;

  speech.text(audio_location, function (question) {
    log.info(call_ssid + ' QUESTION: ' + question);

    question_and_answer_healthcare.ask({text: question}, function (err, response) {
      answers[call_ssid] = response[0].question.evidencelist[0].text

      log.info(call_ssid + ' ANSWER: ' + answers[call_ssid]);

      fs.writeFileSync('./enqueue_question_log.txt', JSON.stringify([answers[call_ssid], question]));

      twilioClient.calls(call_ssid).update({
        url: 'http://jules.mybluemix.net/api/voice/answer'
      });
    });
  });
};

// Twilio callback handling. Set up routes for different parts of the phone call.
router.post('/', twilio.webhook(), function (req, res) {
  fs.writeFileSync('./log.txt', JSON.stringify([config.apiKeys.twilio.sid, process.env.TWILIO_AUTH_TOKEN, req.body]));

  var twiml = new twilio.TwimlResponse()
  twiml.say('Welcome to Jules, how can I help you? Press any key after you have finished speaking!')
    .record({timeout: 60, action: '/api/voice/recording'})

  res.send(twiml)
});

router.post('/holding', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()
  twiml.pause({length: 5})
    .say("I'm still thinking")
    .redirect('/api/voice/holding')

  res.send(twiml)
});

router.post('/recording', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()

  enqueue_question(req.body)

  twiml.say('One moment please, I\'m thinking').redirect('/api/voice/holding')
  res.send(twiml)
});

router.post('/answer', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse()

  twiml.say(answers[req.body.CallSid]).say('Do you have another question?').record({timeout: 60, action: '/api/voice/recording'})

  res.send(twiml)
});

router.post('/fallback', twilio.webhook(), function (req, res) {
  var twiml = new twilio.TwimlResponse();
  twiml.say('Sorry, you suck.');
  res.send(twiml);
});

module.exports = router