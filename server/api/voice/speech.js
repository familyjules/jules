var watson = require('watson-developer-cloud');
var http = require('http');
var fs = require('fs');
var sox = require('sox');
var tmp = require('tmp');
var config = require('../../config/environment');

var speech_to_text = watson.speech_to_text({
  username: config.apiKeys.watson.speech_to_text.username,
  password: config.apiKeys.watson.speech_to_text.password,
  version: 'v1'
})

var transcode_to_16k = function (input, output, cb) {
  var job = sox.transcode(input, output, {
    sampleRate: 16000,
    format: 'wav',
    channelCount: 1
  })

  job.on('end', function () {
    cb()
  })

  job.start()

}

var convert_speech_to_text = function (audio, cb) {
  var params = {
    audio: fs.createReadStream(audio),
    content_type: 'audio/l16; rate=16000'
  }

  speech_to_text.recognize(params, function (err, res) {
    if (err) {
      return
    }

    var result = res.results[res.result_index],
      question = ''

    if (result) {
      question = result.alternatives[0].transcript
    }

    cb(question)
  })
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

exports.text = function (url, cb) {
  tmp.file({postfix: '.wav'}, function _tempFileCreated (err, input, fd) {
    if (err) throw err

    tmp.file({postfix: '.wav'}, function _tempFileCreated (err, output, fd) {
      if (err) throw err

      save_to_file(url, input, function () {
        transcode_to_16k(input, output, function () {
          convert_speech_to_text(output, cb)
        })
      })
    })
  })
}