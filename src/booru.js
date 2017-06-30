/**
 * @fileoverview This file contains functions that search for images from
 * image boards such as Danbooru. Also included is a function to shorten URLs.
 * The results of the queries are sent back via {@code message.channel.send()}
 * @package request-promise
 */

let config = require('../config');
let request = require('request-promise');
let misc = require('./misc');
let prevImgId = null;

/**
 * Returns the URI-encoded version of the GET query
 *
 * @param {string[]} query - A string array containing the GET parameters
 * @return {string} A URI-encoded string containing the GET parameters
 */
function cleanGet(query) {
  let queryArray = [];
  for (let val of query.slice(1)) {
    queryArray.push(encodeURIComponent(val));
  }
  return String(queryArray.join('+'));
}

/**
 * Queries the Google URL Shortener API via POST with the given URL. This is
 * encapsulated in a promise. Upon success, a reply containing the new URL is
 * sent to the Discord Channel in which this was invoked. The message object is
 * to keep track of which channel that is.
 *
 * @param {message} message - The original message object prompting this call
 * @param {string} text - The decoded-URI of the text portion of the reply
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
 * Queries the Danbooru database via a GET call on the passed in parameters.
 * The call is encapsulated in a promise. Upon success, a message containing
 * the query terms and the image URL is send to the Discord Channel from which
 * this was called. A URL is returned instead of a file to prevent the
 * possibilty of process slow-down due to filesystem access. In addition, the
 * resulting image URL contains information about the author and the tags used
 * due to the GET structure.
 *
 * @param {message} message - A message object as defined in discord.js
 * @param {string[]} cmds - A string array containing the GET parameters
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
      /**
       * Because the response from Danbooru will be a json array, we need to
       * make sure we only select one of the returned image info
       */
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

      /**
       * This toggle makes it easy to re-activate URL shortening in case
       * Discord decides to change their policy on shortened URL's not
       * displaying an image preview
       */

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
 * Queries the SafeBooru database generally in the same  way as
 * {@code getDanbooru()}. @see getDanbooru
 *
 * @param {message} message - The original message object prompting this call
 * @param {string[]} cmds - A string array containing the GET parameters
 */
function getSafebooru(message, cmds) {
  // @TODO: Implement this function - Safebooru's API isn't very clear
}

module.exports = {getDanbooru, getSafebooru};
