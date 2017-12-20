let config = require('../config.js');
let log = require('./logger.js');
let request = require('request-promise');
let misc = require('./misc.js');
let prevImgId = null;

let curFile = 'booru.js';

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
  let func = 'sendGoogleShortenerRequest';

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
        log.verbose('shorten', curFile, func, 'Shortened url to ' + body.id);
        message.channel.send(text + body.id)
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject Google short URL');
          });
      } else {
        message.channel.send(text + imgUrl)
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject Google full URL');
          });
      }
    })
    .catch( (err) => {
      log.warn(err, curFile, func,
               'Unable to shorten url, returning long form');
      message.channel.send(text + imgUrl)
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Reject Google initial');
      });
    });
}

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getDanbooru(message, cmds) {
  let func = 'getDanbooru';

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
            log.info(reason, curFile, func, 'Reject no picture');
          });
        log.warn('NullPointer', curFile, func,
                 'Received a null pointer instead of array at index ' +
                selectedIdx + ' on ' + JSON.stringify(body));
        return;
      }

      if (config.use_shortener === true) {
        let text = decodeURIComponent(tagStr) + '\n';
        sendGoogleShortenerRequest(message, text, imgUrl);
      } else {
        message.channel.send(decodeURIComponent(tagStr) + '\n' + imgUrl)
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject booru URL');
          });
      }
  })
  .catch( (err) => {
    return console.error('Request Failed: ' + err);
    message.channel.send('Request Failed. Try again.')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject request fail');
      });
  });
}

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getSafebooru(message, cmds) {
  /*
  let func = 'getSafebooru';

  let tagList = cleanGet(cmds);
  let options = misc.getOptions(config.sbooru_url, config.sbooru_get, tagList);
  message.channel.send('fixme')
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Reject SafeBooru message');
    });
  */
}

module.exports = {getDanbooru, getSafebooru};
