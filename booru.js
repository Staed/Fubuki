let config = require('./config');
let request = require('request-promise');

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
    headers: {
      'User-Agent': 'Request-Promise'
    },
    json: true,
  }
  console.log('Recieved request for: ' + path + tags);
  return options;
}

/**
 * @param {message} message A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getDanbooru(message, cmds) {
  let tagList = cleanGet(cmds);
  let options = getOptions(config.danbooru_auth, config.danbooru_get, tagList);

  request(options)
    .then(function (body) {
      let arr_len = body.length;
      let selected_idx = Math.floor(Math.random() * (arr_len));

      let tagsStr = 'tags: ' + tagList.split('+').join(', ');
      let imgUrl;
      if (body[selected_idx] != null) {
        imgUrl = config.danbooru_url + body[selected_idx].file_url;
      } else {
        message.channel.sendMessage('No picture found');
        return console.error('Bad File Get at Index ' +
         selected_idx + ' on data:\n' + JSON.stringify(body));
      }
      message.channel.sendMessage(decodeURIComponent(tagsStr) + '\n' + imgUrl);
  }).catch(function (err) {
    return console.error('Request Failed');
    message.channel.sendMessage('Request Failed. Try again.');
  });
}

/**
 * @param {message} message A message object as defined in discord.js
 * @param {string[]} cmds
 */
function getSafebooru(message, cmds) {
  let tagList = cleanGet(cmds);
  let options = getOptions(config.sbooru_url, config.sbooru_get, tagList);
  message.channel.sendMessage('fixme');
}

module.exports = {getDanbooru, getSafebooru};
