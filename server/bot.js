 var Twit = require('twit')
  , config1 = require('./botconfig')
  , watson = require('watson-developer-cloud')
  , mongoConfig = require('./config/environment')
  , mongo = require('mongodb').MongoClient
  , DB;
;


mongo.connect(mongoConfig.mongo.uri, function (err, db){
  if(err){
    console.log(err)
  }
  else{
    DB = db;
    console.log('connected to mongo')
  }
})

var bot = new Twit(config1);
bot.nick = 'julesgotanswers'
var responses = ['I must admit, I really prefer questions that start with "what"','You can ask a better question than that!', "Who is Jules? I'll take potent potables for 500, Alex",'Please rephrase the nature of the medical emergency',"I'm sorry. My responses are limited. You must ask the right questions."]

console.log('Jules bot sends his regards.');

var question_and_answer_healthcare = watson.question_and_answer({
  username: '8a2c0b68-8e22-4ed4-931f-7f10c7e3b339',
  password: 'fyMSE9bnwewL',
  version: 'v1',
  dataset: 'healthcare' 
});

exports.main = function() {
  var me = bot.nick;
  var stream = bot.stream('user', {
    track: me
  }, function(err){
    if(err){
      console.log(err)
    }
  });
  stream.on('tweet', function(tweet) {
    console.log('stream event for a tweet')
    question_and_answer_healthcare.ask({
        text: tweet.text }, function (err, response) {
          if (err){
            console.log('error:', err);
          }
          else{
            var answer = response[0].question.evidencelist[0].text;
            if(response[0].question.evidencelist[0].value < .4){
              answer = responses[Math.floor(Math.random() * 4)]
            }
            if(answer.length > 120){
              answer = answer.split('.')[0]
            }
            if (tweet.user.screen_name !== 'julesgotanswers'){
              DB.collection('requests').insert({question : tweet.text, answer: answer, channel: 'twitter'})
              bot.post('statuses/update', {
                  status: '.@' + tweet.user.screen_name + " " + answer,
                  in_reply_to_status_id: tweet.id_str
                }, function(err) {
                  if(err){
                    console.log(err)
                  }
                  return console.log("tweet posted");
                });
            }
          }
        }
      );


  })
}
  
