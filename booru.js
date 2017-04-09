var config = require('./config');
var request = require('request-promise');

function cleanGet(cmds) {
  var tagArr = [];
  for (let val of cmds.slice(1)) {
    tagArr.push(encodeURIComponent(val));
  }
  return String(tagArr.join('+'));
}

function getOptions(hostURL, endURL, tags) {
  // Do NOT use qs: { ... }, it replaces '+' with '%20'
  var options = {
    method: 'GET',
    uri: hostURL + endURL + tags,
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true
  }
  console.log('Recieved request for: ' + endURL + tags);
  return options;
}

module.exports = {
  getDanbooru: function (message, cmds) {
    var tagList = cleanGet(cmds);
    var options = getOptions(config.danbooru_auth, config.danbooru_get, tagList);

    request(options)
      .then(function (body) {
        var arr_len = body.length;
        var selected_idx = Math.floor(Math.random() * (arr_len));

        var tagsStr = 'tags: '.concat(tagList.split('+').join(', '));
        var imgUrl;
        if (body[selected_idx] != null) {
          imgUrl = config.danbooru_url.concat(body[selected_idx].file_url);
        } else {
          message.channel.sendMessage('No picture found');
          return console.error('Bad File Get at Index ' + selected_idx + ' on data:\n' + JSON.stringify(body));
        }
        message.channel.sendMessage(decodeURIComponent(tagsStr).concat('\n', imgUrl));
    }).catch(function (err) {
      return console.error('Request Failed');
      message.channel.sendMessage('Request Failed. Try again.');
    });
  },

  getSafebooru: function(message, cmds) {
    var tagList = cleanGet(cmds);
    var options = getOptions(config.sbooru_url, config.sbooru_get, tagList);
    message.channel.sendMessage('fix');
  }
}
