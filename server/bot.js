var Twit = require('twit');
var watson = require('watson-developer-cloud');
var config = require('./config/environment');
var mongo = require('mongodb').MongoClient;
var request = require('request');
var DB;

mongo.connect(config.mongo.uri, function (err, db){
  DB = db;
});

var bot = new Twit(config.apiKeys.twitter);
bot.nick = 'julesgotanswers'

console.log('The Jules bot is operating in the shadows.');

var question_and_answer_healthcare = watson.question_and_answer({
  username: config.apiKeys.watson.question_and_answer.username,
  password: config.apiKeys.watson.question_and_answer.password,
  version: 'v1',
  dataset: 'healthcare' 
});

exports.main = function() {
  var me = bot.nick;

  var stream = bot.stream('user', {
    track: me
  });

  stream.on('tweet', function(tweet) {
    question_and_answer_healthcare.ask({text: tweet.text}, function (err, response) {
      var answer = response[0].question.evidencelist[0].text;

      if(response[0].question.evidencelist[0].value < config.confidenceLevel){
        answer = config.lowConfidenceMessage;
      }

      if(answer.length > 120){
        answer = answer.split('.')[0]
      }

      if (tweet.user.screen_name !== 'julesgotanswers' && tweet.text.indexOf('#rating') === -1){
        DB.collection('requests').insert({
          username: tweet.user.screen_name,
          question: tweet.text,
          answer: answer,
          channel: 'twitter',
          info: {
            questionId: response[0].question.id,
            questionText: response[0].question.questionText,
            answerId: response[0].question.answers[0].id,
            answerText: response[0].question.answers[0].text,
            confidence: response[0].question.answers[0].confidence, 
            feedback: 1
          }
        });

        bot.post('statuses/update', {
          status: '.@' + tweet.user.screen_name + " " + answer,
          in_reply_to_status_id: tweet.id_str
        });
      }

      if(tweet.user.screen_name !== 'julesgotanswers' && tweet.text.indexOf('#rating') > -1){
        var requestsColec = DB.collection('requests').find({"username" : tweet.user.screen_name});
        requestsColec.on('data', function(datum){
          var info = datum.info;
          var options = {
            url: 'https://gateway.watsonplatform.net/question-and-answer-beta/api/v1/feedback',
            method: 'PUT',
            json: true,
            body: info,
            auth: {
              user: '8a2c0b68-8e22-4ed4-931f-7f10c7e3b339',
              pass: 'fyMSE9bnwewL',
              sendImmediately: true
            }
          };
          request(options, function(err, response) {
            if (response.statusCode === 200 || response.statusCode == 201) {
              //FEEDBACK ACCEPTED
            }
          });
        });
      }
    });
  });
}
  
