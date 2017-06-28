let config = require('../config');
let request = require('request-promise');
let misc = require('./misc');
let prevImgId = null;

/**
 * @param {string[]} cmds
 * @return {string}
 */
function cleanGet(cmds) {
  let tagArr = [];
  for (let val of cmds.slice(1)) {
    tagArr.push(encodeURIComponent(val));
  }
  return String(tagArr.join('+'));
}

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {string} text - The text portion of the reply
 * @param {string} imgUrl - The complete URL to the desired image link
 */
function sendGoogleShortenerRequest(message, text, imgUrl) {
  let options = {
    method: 'POST',
    uri: config.google_url_shortener_url + '?key=' + config.google_api_key,
    body: {
      'longUrl': imgUrl,
    },
    headers: {
      'Content-Type': 'application/json',
    },
    json: true,
  };

  request(options)
    .then( (body) => {
      if (body.id != null) {
        console.log('Shortened url to ' + body.id);
        message.channel.send(text + body.id)
          .catch( (reason) => {
            console.log('Rejected Google Short URL for ' + reason);
          });
      } else {
        message.channel.send(text + imgUrl)
          .catch( (reason) => {
            console.log('Rejected Google Full URL Promise for ' + reason);
          });
      }
    })
    .catch( (err) => {
      console.log('Unable to shorten url, returning long form');
      message.channel.send(text + imgUrl)
        .catch( (reason) => {
          console.log('Rejected Google Initial Promise for ' + reason);
      });
    });
}

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getDanbooru(message, cmds) {
  let tagList = cleanGet(cmds);
  if (prevImgId != null) {
      tagList += '+-id:' + prevImgId;
  }
  let options =
      misc.getOptions(config.danbooru_auth, config.danbooru_get, tagList);

  request(options)
    .then( (body) => {
      let selectedIdx = Math.floor(Math.random() * (body.length));
      let tagStr = '**Tags:** ' + cleanGet(cmds).split('+').join(', ');
      let imgUrl;

      if (body != null && body[selectedIdx] != null) {
        imgUrl = config.danbooru_url + body[selectedIdx].file_url;
        prevImgId = body[selectedIdx].id;
      } else {
        message.channel.send('No picture found')
          .catch( (reason) => {
            console.log('Rejected Booru Null Promise for ' + reason);
          });
        return console.error('Bad File Get at Index ' +
         selectedIdx + ' on data:\n' + JSON.stringify(body));
      }

      if (config.use_shortener === true) {
        let text = decodeURIComponent(tagStr) + '\n';
        sendGoogleShortenerRequest(message, text, imgUrl);
      } else {
        message.channel.send(decodeURIComponent(tagStr) + '\n' + imgUrl)
          .catch( (reason) => {
            console.log('Rejected Booru URL Promise for ' + reason);
          });
      }
  })
  .catch( (err) => {
    return console.error('Request Failed: ' + err);
    message.channel.send('Request Failed. Try again.')
      .catch( (reason) => {
        console.log('Rejected Booru Reject Promise for ' + reason);
      });
  });
}

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getSafebooru(message, cmds) {
  /*
  let tagList = cleanGet(cmds);
  let options = misc.getOptions(config.sbooru_url, config.sbooru_get, tagList);
  message.channel.send('fixme')
    .catch( (reason) => {
      console.log('Rejected SafeBooru Msg Promise for ' + reason);
    });
  */
}

module.exports = {getDanbooru, getSafebooru};
