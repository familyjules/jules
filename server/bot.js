var Twit = require('twit');
var watson = require('watson-developer-cloud');
var config = require('./config/environment');
var mongo = require('mongodb').MongoClient;
var ObjectID = require('mongodb').ObjectID;
var request = require('request');
var log = require('loglevel');
var DB;

mongo.connect(config.mongo.uri, function (err, db){
  DB = db;
});

var bot = new Twit(config.apiKeys.twitter);

var question_and_answer_healthcare = watson.question_and_answer({
  username: config.apiKeys.watson.question_and_answer.username,
  password: config.apiKeys.watson.question_and_answer.password,
  version: 'v1',
  dataset: 'healthcare' 
});

exports.main = function() {
  console.log('The Jules bot is operating in the shadows.');

  var stream = bot.stream('user', {
    track: 'julesgotanswers'
  });

  stream.on('tweet', function(tweet) {

    tweet.text = tweet.text.substring(16).trim(); //remove @julesgotanswers

    if(tweet.user.screen_name === 'julesgotanswers') return;

    if(tweet.text.indexOf("#rating") === -1){

      question_and_answer_healthcare.ask({text: tweet.text}, function (err, response){
        var question = response[0].question;
        var answer = question.evidencelist[0];

        if(response[0].question.evidencelist[0].value < config.confidenceLevel){
          answer.text = config.lowConfidenceMessage;
        } else if(answer.text.length > 120){
          answer.text = answer.text.split('.')[0];

          if(answer.text.length > 120){
            answer.text = answer.text.substring(0, 117) + '...';
          }

        }

        DB.collection('requests').insert({
          channel: 'twitter', 
          handle: tweet.user.screen_name,
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

        bot.post('statuses/update', {
          status: '@' + tweet.user.screen_name + " " + answer.text,
          in_reply_to_status_id: tweet.id_str
        }, function(error, tweet, response){
          log.info(error ? "Error sending tweet" : "Tweet sent successfully");
        });
      });

    } else {
      log.info('Twitter feedback received');

      DB.collection('requests').find({"handle": tweet.user.screen_name}).limit(1).sort({$natural: -1}).on('data', function(tweetInfo){

        if(!tweetInfo) return;

        log.info('Tweet info is good');

        var watsonFeedback = {
          questionId: tweetInfo.questionId,
          questionText: tweetInfo.questionText,
          answerId: tweetInfo.answerId,
          answerText: tweetInfo.answerText,
          confidence: tweetInfo.confidence,
          feedback: (Number(tweet.text.replace(/\D/g, '')) === 2 ? '-1' : '1')
        };

        log.info(JSON.stringify(watsonFeedback));

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

        log.info(JSON.stringify(options));

        request(options, function(err, response) {
          log.info(JSON.stringify(error));
          log.info(JSON.stringify(response));

          if(response.statusCode === 200 || response.statusCode == 201) {
            log.info('Feedback submitted successfully');
            
            DB.collection('requests').update({"_id": ObjectID(tweetInfo._id)}, {$set: {feedback: Number(watsonFeedback.feedback)}});
          }
        });

      });

    }

  });
}
  
