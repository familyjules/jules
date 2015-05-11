'use strict';

var _ = require('lodash');
var fs = require('fs');
var sox = require('sox');
var http = require('http')
var accountSid = 'AC0d4f667900e2a6fea95046313f539958'; 
var authToken = '8dd9c7e404b9b17113030ae34db27443'; 
var client = require('twilio')(accountSid, authToken); 
// Get list of recordings

var watson = require('watson-developer-cloud');
var speechToText = watson.speech_to_text({
  username: "a67c15ec-2686-4025-8f8c-f43efa39883e",
  password: "nyiKXdPOivE0",
  version:"v1"
});
 
// exports.index = function (req, res) {
//   var twilio = require('twilio')
//   var resp = new twilio.TwimlResponse();
//   var msg = req.params.RecordingUrl
//   // var text = convert_to_text(req.params.RecordingUrl)

//   var params = {
//     audio: fs.createReadStream(req.params.RecordingUrl),
//     content_type: 'audio/l16; rate=44100'
//   };
//   speechToText.recognize(params, function(err, res) {
//     if (err)
//       console.log(err);
//     else
//       resp.say({voice:'woman'}, JSON.stringify(res));
//       res.writeHead(200, {
//           'Content-Type':'text/xml'
//     });

//   // resp.say({voice:'woman'},'what is up wit you and your questions');
  

//   // resp.gather({ timeout:1 }, function() {
//   //   this.say({voice:'woman'}, '')
//   // })
  
//   res.writeHead(200, {
//       'Content-Type':'text/xml'
//   });
//   res.end(resp.toString());
// })
// }



  // if(req.params.RecordingUrl) {  
  // audio = fs.createReadStream(req.params.RecordingUrl);
  // } else {
  // return res.status(500).json({ error: 'Malformed URL' });
  // }
  // speechToText.recognize({audio: audio, content_type: 'audio/l16; rate=44100'}, function(err, transcript) {
  //   if (err)
  //     return res.status(500).json({ error: err });
  //   else
  //     return res.json(transcript);

  //     resp.say({voice:'woman'}, text);
  //     resp.gather({ timeout:1 }, function() {
  //             // In the context of the callback, "this" refers to the parent TwiML
  //             // node. The parent node has functions on it for all allowed child
  //             // nodes. For <Gather>, these are <Say> and <Play>.
  //     this.say({voice:'woman'}, 'Does this answer your question')
     

  //     })
  //     res.writeHead(200, {
  //         'Content-Type':'text/xml'
  //     });
  //     // res.send(msg)
  //     res.end(resp.toString());


  // });
  




var transcode_to_16k = function (input, output, cb) {
  var job = sox.transcode(input, output, {
    sampleRate: 16000,
    format: 'wav',
    channelCount: 1
  })
  job.on('error', function (err) {
    console.log(err)
  })
  job.on('progress', function (amountDone, amountTotal) {
    console.log("progress", amountDone, amountTotal);
  })

  job.on('end', function () {
    console.log('Transcoding finished.')
    cb()
  })
  job.start()
}

var convert_to_text = function(audio, cb){
  var twilio = require('twilio')
  var resp = new twilio.TwimlResponse();
  var params = {
    audio: fs.createReadStream(audio),
    content_type: 'audio/l16; rate=44100'
  };
  speechToText.recognize(params, function(err, res) {
    if (err)
      console.log(err);
    else
      resp.say({voice:'woman'}, JSON.stringify(res, null, 2));
      res.writeHead(200, {
          'Content-Type':'text/xml'
      });

    var result = res.results[res.result_index],
      question = '';

    if (result) {
      question = result.alternatives[0].transcript;
    }

    cb(question);
      res.send(msg)
      res.end(resp.toString());
      console.log(JSON.stringify(res, null, 2));
  });
}

var save_to_file = function (url, path, cb) {
  http.get(url, function (res) {
    var output = fs.createWriteStream(path)
    res.pipe(output)

    res.on('end', function () {
      cb()
    })
    })
}


exports.index = function (req, res) {
  // tmp.file({postfix: '.wav'}, function _tempFileCreated (err, input) {
  //   if (err) throw err

  //   tmp.file({postfix: '.wav'}, function _tempFileCreated (err, output) {
  //     if (err) throw err

  //     })
  //   })
  var url = req.params.RecordingUrl
  var cb = function(){console.log('success')}
      save_to_file(url, input, function () {
        transcode_to_16k(input, output, function () {
          convert_to_text(output, cb)
        })
  })
}
 
