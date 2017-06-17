let config = require('./config');
let request = require('request-promise');
let prev_img_id = null;

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
 * @param {string} hostname
 * @param {string} path
 * @param {string} tags The parameter and value
 * @return {options} The options used in sending a Request
 */
function getOptions(hostname, path, tags) {
  /** Do NOT use qs: { ... }, it replaces '+' with '%20' */
  let options = {
    method: 'GET',
    uri: hostname + path + tags,
    json: true,
  }
  console.log('Recieved request for: ' + path + tags);
  return options;
}

/**
 * @param {message} message A message object as defined in discord.js
 * @param {string} text The text portion of the reply
 * @param {string} imgUrl The complete URL to the desired image link
 * @return {string} A shortened version of the URL via Google
 */
function sendGoogleShortenerRequest(message, text, imgUrl) {
  let options = {
    method: 'POST',
    uri: config.google_url_shortener_url + "?key=" + config.google_api_key,
    body: {
      'longUrl': imgUrl
    },
    headers: {
      'Content-Type': 'application/json'
    },
    json: true
  };

  request(options)
    .then(function (body) {
      if (body.id != null) {
        console.log('Shortened url to ' + body.id);
        message.channel.send(text + body.id)
          .catch( reason => { console.log("Rejected Google Short URL for " + reason); });
      } else {
        message.channel.send(text + imgUrl)
          .catch( reason => { console.log("Rejected Google Full URL Promise for " + reason); });
      }
    })
    .catch(function (err) {
      console.log('Unable to shorten url, returning long form');
      message.channel.send(text + imgUrl)
        .catch( reason => { console.log("Rejected Google Initial Promise for " + reason); });
    });
}

/**
 * @param {message} message A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getDanbooru(message, cmds) {
  let tagList = cleanGet(cmds);
  if (prev_img_id != null) {
      tagList += "+-id:" + prev_img_id;
  }
  let options = getOptions(config.danbooru_auth, config.danbooru_get, tagList);

  request(options)
    .then(function (body) {
      let selected_idx = Math.floor(Math.random() * (body.length));
      let tagStr = '**Tags:** ' + cleanGet(cmds).split('+').join(', ');
      let imgUrl;

      if (body != null && body[selected_idx] != null) {
        imgUrl = config.danbooru_url + body[selected_idx].file_url;
        prev_img_id = body[selected_idx].id;
      } else {
        message.channel.send('No picture found')
          .catch( reason => { console.log("Rejected Booru Null Promise for " + reason); });
        return console.error('Bad File Get at Index ' +
         selected_idx + ' on data:\n' + JSON.stringify(body));
      }

      if (config.use_shortener === true) {
        sendGoogleShortenerRequest(message, decodeURIComponent(tagStr) + '\n', imgUrl);
      } else {
        message.channel.send(decodeURIComponent(tagStr) + '\n' + imgUrl)
          .catch( reason => { console.log("Rejected Booru URL Promise for " + reason); });
      }
  })
  .catch(function (err) {
    return console.error('Request Failed: ' + err);
    message.channel.send('Request Failed. Try again.')
      .catch( reason => { console.log("Rejected Booru Reject Promise for " + reason); });
  });
}

/**
 * @param {message} message A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getSafebooru(message, cmds) {
  let tagList = cleanGet(cmds);
  let options = getOptions(config.sbooru_url, config.sbooru_get, tagList);
  message.channel.send('fixme')
    .catch( reason => { console.log("Rejected SafeBooru Msg Promise for " + reason); });
}

module.exports = {getDanbooru, getSafebooru};
