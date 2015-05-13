var express = require('express');
var twilio = require('twilio');
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

      twilioClient.calls(call_ssid).update({
        url: 'http://jules.mybluemix.net/api/voice/answer'
      });
    });
  });
};

// Twilio callback handling. Set up routes for different parts of the phone call.
router.post('/', function (req, res) {
  fs.writeFileSync('message.txt', JSON.stringify(req.body));

  log.info(req.body.CallSid + '-> voice/')
  log.debug(req.body)

  var twiml = new twilioClient.TwimlResponse()
  twiml.say('Welcome to Jules, how can I help you? Press any key after you have finished speaking!')
    .record({timeout: 60, action: '/api/voice/recording'})

  res.send(twiml)
});

router.post('/holding', twilio.webhook(config.apiKeys.twilio.auth), function (req, res) {
  log.info(req.body.CallSid + '-> voice/holding')
  log.debug(req.body)

  var twiml = new twilioClient.TwimlResponse()
  twiml.pause({length: 5})
    .say("I'm still thinking")
    .redirect('/api/voice/holding')

  res.send(twiml)
});

router.post('/recording', twilio.webhook(config.apiKeys.twilio.auth), function (req, res) {
  log.info(req.body.CallSid + '-> voice/recording')
  log.debug(req.body)

  var twiml = new twilioClient.TwimlResponse()

  enqueue_question(req.body)

  twiml.say('One moment please, I\'m thinking').redirect('/voice/holding')
  res.send(twiml)
});

router.post('/answer', twilio.webhook(config.apiKeys.twilio.auth), function (req, res) {
  log.info(req.body.CallSid + '-> voice/answer')
  log.debug(req.body)

  var twiml = new twilioClient.TwimlResponse()

  twiml.say(answers[req.body.CallSid])
    .say('Do you have another question?')
    .record({timeout: 60, action: '/api/voice/recording'})

  res.send(twiml)
});

module.exports = router