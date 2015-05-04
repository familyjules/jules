'use strict';

var _ = require('lodash');
var fs = require('fs');
var sox = require('sox');
// Get list of recordings
var watson = require('watson-developer-cloud');
var speechToText = watson.speech_to_text({
  username: "a67c15ec-2686-4025-8f8c-f43efa39883e",
  password: "nyiKXdPOivE0",
  version:'v1'
});
    // Create a new saved message object from the Twilio data
var msg = new Message({
  sid: req.param('CallSid'),
  type:'call',
  recordingUrl: req.param('RecordingUrl'),
  recordingDuration: Number(req.param('RecordingDuration')),
  fromCity:req.param('FromCity'),
  fromState:req.param('FromState'),
  fromCountry:request.param('FromCountry')
});

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

var convert_to_text = function(){
  var audio = msg.recordingUrl
  var params = {
    audio: fs.createReadStream(audio),
    content_type: 'audio/l16; rate=44100'
  };
  speechToText.recognize(params, function(err, res) {
    if (err)
      console.log(err);
    else
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

// exports.index = function (url, cb) {
//   tmp.file({postfix: '.wav'}, function _tempFileCreated (err, input, fd) {
//     if (err) throw err

//     tmp.file({postfix: '.wav'}, function _tempFileCreated (err, output, fd) {
//       if (err) throw err

//       save_to_file(url, input, function () {
//         transcode_to_16k(input, output, function () {
//           convert_speech_to_text(output, cb)
//         })
//       })
//     })
//   })
// }
 
