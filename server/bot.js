var Twit = require('twit');
var watson = require('watson-developer-cloud');
var config = require('./config/environment');
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var request = require('request');
var DB;

mongo.connect(config.mongo.uri, function (err, db){
  DB = db;
});

var bot = new Twit(config.apiKeys.twitter);
bot.nick = 'julesgotanswers'

var question_and_answer_healthcare = watson.question_and_answer({
  username: config.apiKeys.watson.question_and_answer.username,
  password: config.apiKeys.watson.question_and_answer.password,
  version: 'v1',
  dataset: 'healthcare' 
});

exports.main = function() {
  console.log('The Jules bot is operating in the shadows.');

  var stream = bot.stream('user', {
    track: bot.nick
  });

  stream.on('tweet', function(tweet) {
    question_and_answer_healthcare.ask({text: tweet.text}, function (err, response) {
      var question = response[0].question;
      var answer = question.evidencelist[0];

      if(response[0].question.evidencelist[0].value < config.confidenceLevel){
        answer = config.lowConfidenceMessage;
      }

      if(answer.length > 120){
        answer = answer.split('.')[0]
      }

      if (tweet.user.screen_name !== 'julesgotanswers' && tweet.text.indexOf('#rating') === -1){

        DB.collection('requests').insert({
          channel: 'twitter', 
          handle: tweet.user.screen_name,
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

        bot.post('statuses/update', {
          status: '@' + tweet.user.screen_name + " " + answer,
          in_reply_to_status_id: tweet.id_str
        });
      }

      if(tweet.user.screen_name !== 'julesgotanswers' && tweet.text.indexOf('#rating') > -1){
        DB.collection('requests').find({"handle": tweet.user.screen_name}).limit(1).sort({$natural: -1}).on('data', function(tweetInfo){

          if(!tweetInfo) return;

          var watsonFeedback = {
            questionId: tweetInfo.questionId,
            questionText: tweetInfo.questionText,
            answerId: tweetInfo.answerId,
            answerText: tweetInfo.answerText,
            confidence: tweetInfo.confidence,
            feedback: (Number(tweet.text.replace(/\D/g, '')) === 2 ? '-1' : '1')
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
            if(response.statusCode === 200 || response.statusCode == 201) {
              DB.collection('requests').update({"_id": ObjectID(tweetInfo._id)}, {$set: {feedback: Number(watsonFeedback.feedback)}});
            }
          });

        });

      }
    });
  });
}
  
