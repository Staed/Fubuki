/**
 * This file (misc.js) contains miscellaneous methods,
 * usually entirely self-contained. They are put here
 * since they do not require their own specific file for readability
 */

let config = require('../config.js');
let log = require('./logger.js');
let request = require('request-promise');

let curFile = 'misc.js';

let aniListToken;
/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} cmds
 */
 function urbanDefine(message, cmds) {
   let func = 'urbanDefine';

   let term = cmds.slice(1).join('+');

   let options = {
     uri: config.urban_url + term,
     json: true,
   };

   request(options)
      .then( (body) => {
        if (body.result_type == 'no_results') {
          message.channel.send('There are no results for: ' +
                               term.replace('+', ' '))
            .catch( (reason) => {
              log.info(reason, curFile, func, 'No result message');
            });
        } else {
          let firstDef = body.list[0];
          message.channel.send('**' + cmds.slice(1).join(' ') + ':**\n' +
                               firstDef.definition + '\n' + firstDef.example)
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Definition message');
            });
        }
      }).catch( (err) => {
        log.warn(err, curFile, func, 'Access API Error');
        message.channel.send('Error accessing Urban Dictionary')
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject message');
          });
      });
 }

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {string[]} cmds - String[] containing "!a" and a user id or username
 */
 function getAvatar(message, cmds) {
   let func = 'getAvatar';

   if (cmds[1] == undefined) {
     log.verbose('undefined', curFile, func, 'Getting username');
     message.channel.send('You need to specify who\'s avatar I am looking for!')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject username message');
      });
     return;
   }

   let user = cmds.slice(1).join(' ');

   log.verbose('', curFile, func, 'Looking for: ' + user);
   let memberName = user.toLowerCase();
   let avatarUrl = '';

   if (/<@.?\d+>/.test(memberName)) {
     let obj = message.guild.members.get(memberName.replace(/\D/g, ''));
     if (typeof obj !== 'undefined') {
      avatarUrl = obj.user.displayAvatarURL;
      log.verbose('', curFile, func, 'Found ' + obj.displayName +
                  '\'s avatar at ' + avatarUrl);
     }
   } else {
     for (let [, memberObj] of message.guild.members) {
       let displayName = memberObj.displayName.toLowerCase();
       let username = memberObj.user.username.toLowerCase();

       if (displayName == memberName || username == memberName) {
        avatarUrl = memberObj.user.displayAvatarURL;
        log.verbose('', curFile, func, 'Found ' + memberObj.displayName +
                    '\'s avatar at ' + avatarUrl);
        break;
       }
     }
   }

   if (avatarUrl) {
     avatarUrl = avatarUrl.replace('jpg', 'png');
     message.channel.send(avatarUrl)
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject avatar message');
      });
   } else {
     log.verbose('undefined', curFile, func, 'Could not find member ' + user);
     message.channel.send('I couldn\'t find that member!')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject avatar null');
      });
   }
 }

/**
* @param {message} message - A message object as defined in discord.js
*/
 function coinFlip(message) {
   let func = 'coinFlip';

   let coin;
   let flip = Math.floor(Math.random() * 100 + 1);

   if (flip < 50) {
     coin = 'tails';
   } else if (flip > 50) {
     coin = 'heads';
   } else {
     message.channel.send('Uhm... the coin landed on its side, flipping again.')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject side message');
      });
    message.channel.send('!coinflip')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject flip again message');
      });
    return;
   }
   message.channel.send('You flipped **' + coin + '**')
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Rejected flip message');
    });
 }

 /**
  *  @param {message} message - A message object as defined in discord.js
  *  @param {string[]} cmds - Strings that need to be joined and rated
  * Consider replacing the random function with another thing,
  * maybe tied to stocks or time
  */
 function rate(message, cmds) {
   let func = 'rate';

   let str = message.content.split(' ').slice(1).join(' ');
   let rating = rateAlgorithm(str);

   if (str.toLowerCase() == 'staed') {
     message.channel.send('Staeds are great! I\'ll give Staed a 10/10!')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject rate Staed message');
      });
     log.verbose('', curFile, func, 'Rated a Staed');
   } else if (str.toLowerCase() == 'sawai') {
     message.channel.send('Sawais are :put_litter_in_its_place: ' +
                          'I\'ll give Sawai a 0/10')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject rate Sawai message');
      });
     log.verbose('', curFile, func, 'Rated a Sawai');
   } else {
     log.verbose('', curFile, func, 'Rated ' + str + ' as ' + rating + '/10');
     message.channel.send('I\'d rate ' + str + ' ' + rating + '/10')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject rate message');
      });
   }
 }

/**
 * @param {string} text - A string containing the thing to be rated
 * @return {int} - A number between 1 and 10 inclusive
 */
 function rateAlgorithm(text) {
   return Math.floor(Math.random() * 10 + 1);
 }

 /**
  * @param {string} hostname
  * @param {string} path
  * @param {string} tags - The parameter and value
  * @return {options} - The options used in sending a Request
  */
 function getOptions(hostname, path, tags) {
   let func = 'getOptions';

   // Do NOT use qs: { ... }, it replaces '+' with '%20'
   let options = {
     method: 'GET',
     uri: hostname + path + tags,
     json: true,
   };
   log.verbose('request', curFile, func,
               'Recieved request for: ' + path + tags);
   return options;
 }

 /**
  * @param {message} message - A message object as defined in discord.js
  */
function deleteBooru(message) {
  let func = 'deleteBooru';

  message.channel.fetchMessages({limit: 100})
    .then( (msgs) => {
      for (let [, value] of msgs.entries()) {
        if (value.author.id == config.id &&
            /\*\*Tags:\*\* .*\nhttps:.*/.test(value.content) == true) {
          value.delete()
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject delete');
            });
          log.verbose('', curFile, func, 'Deleted ' +
                      value.content.replace('\n', '\t'));
          return;
        }
      }

      message.channel.send('No booru post to delete in the last 100 messages!')
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Reject delete exhaust');
        });
    })
    .catch( (err) => {
      message.channel.send('Failed to fetch past messages')
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Reject delete not found');
        });
      log.warn('err', curFile, func, 'No messages found');
    });
}

/**
 * @param {message} message - A message object as defined by discord.js
 */
function choose(message) {
  let func = 'choose';

  // Weighted Choosing (#1#)
  // Defaults to 1 per choice
  let result ='';
  let probability = [];
  let totalWeight = 0;

  let choices = message.content.split('!choose ')[1].split('|');

  for (let element of choices) {
    let value = /[^#]+(?!#\d+#)/i.exec(element)[0].trim();

    let frequency = 1;
    if (/#\d+#/i.test(element)) {
      frequency = parseInt(/#\d+#/i.exec(element)[0].replace(/#/g, ''));
    }

    probability.push([value, totalWeight + frequency]);
    totalWeight += frequency;
  }

  let index = Math.floor(Math.random() * totalWeight);
  for (let element of probability) {
    if (element[1] > index) {
      result = element[0];
      break;
    }
  }

  message.channel.send(result)
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Reject choose');
    });
}

/**
 * @param {message} message - A message object as defined by discord.js
 */
function roll(message) {
  let func = 'roll';

  let rollInfo = message.content.replace('!roll ', '');

  let diceRegex = /(\d+D\d+(\s*\+\s)*)+\d*(\s*\+\s*\d*)*/i;
  if (!diceRegex.test(rollInfo) || /[^\d\s\+\-d]/i.test(rollInfo)) {
    message.channel.send(
      'That was the wrong format, please use this format: ' +
      '2D8 + 1D10 - 3D1 + 5 + -7 : where all the dice rolled are on the ' +
      'left side and all the constants on the right side. ' +
      'Case does not matter.'
    )
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Reject roll');
    });
    return;
  }

  let rollSum = 0;
  let constantSum = 0;

  let dice = /(\d+D\d+\s*[\+\-]*\s*)+/i.exec(rollInfo)[0];
  dice = dice.replace('-', '+-').split('+');

  for (let element of dice) {
    if (element.trim().length < 1) {
      continue;
    }

    [num, sides] = element.replace(' ', '').split(/d/i);

    let sign = 1;
    if (/\-/.test(num)) {
      sign = -1;
    }
    num = num.replace('-', '');

    for (let i = 0; i < num; i++) {
      rollSum += sign * (Math.floor(Math.random() * (sides - 1)) + 1);
    }
  }

  let constantRegex = /([\+\-]\s*\-?\s*\d+\s*)+(?!d)/i;
  let constantString = constantRegex.exec(rollInfo);

  if (constantString == null || constantString == '') {
    constant = ['0'];
  } else {
    constant = constantString[0].split(/\+/);
  }

  for (let element of constant) {
    if (element.trim().length < 1) {
      continue;
    }
    let val = element.replace(' ', '');
    val = /[\+\-]?\s*\d/.exec(val)[0];

    constantSum += parseInt(val, 10);
  }
  let result = (rollSum + constantSum).toString();

  message.channel.send('You rolled a ' + result)
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Failed roll');
    });
}

/**
 * Asks AniList for a token and then runs either aniListAiring() or
 * aniListSpecific()
 * @param {string} queryType Which function to run upon completion
 * @param {message} message A message object as defined in discord.js
 * @param {string} title The title of the specific show wanted, or null.
 */
function aniListQuery(queryType, message, title) {
  let func = 'aniListQuery';

  if (aniListToken != null && aniListToken.expires > (Date.now()/1000 - 60)) {
    if ('airing' == queryType.toLowerCase()) {
      aniListAiring(message);
    } else if ('specific' == queryType.toLowerCase()) {
      aniListSpecific(message, title);
    } else {
      log.verbose('invalid', curFile, func,
                  'Invalid queryType in aniListQuery with token');
      return;
    }
  }

  let authUri = config.anilist_path + 'auth/access_token?' +
                config.anilist_grant + '&' + config.anilist_id +
                '&' + config.anilist_secret;

  let authOptions = {
    method: 'POST',
    uri: authUri,
    json: true,
  };

  request(authOptions)
    .then( (body) => {
      aniListToken = {'access_token': body.access_token,
                      'expires': body.expires};

      if ('airing' == queryType.toLowerCase()) {
        aniListAiring(message);
      } else if ('specific' == queryType.toLowerCase()) {
        aniListSpecific(message, title);
      } else {
        log.verbose('invalid', curFile, func,
                    'Invalid queryType in aniListQuery without token');
      }
    })
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Reject message');
    });
}

/**
 * @param {message} message A message object as defined in discord.js
 */
function aniListAiring(message) {
  let func = 'aniListAiring';

  let tdy = new Date();
  let mth = tdy.getMonth();
  let season = 'Winter';
  if (mth > 3 && mth <= 6) {
    season = 'Spring';
  } else if (mth > 6 && mth <= 9) {
    season = 'Summer';
  } else if (mth > 9) {
    season = 'Fall';
  }

  let airingOptions = {
    method: 'GET',
    uri: config.anilist_path + 'browse/anime?sort=popularity-desc&year='
         + tdy.getFullYear() + '&type=Tv&season=' + season +
         '&access_token=' + aniListToken.access_token + '&full_page=true',
    json: true,
  };

  request(airingOptions)
    .then( (body) => {
      let resultString = [];
      let resultArray = body;

      let ct = 1;
      for (let element of resultArray) {
        if (!element.genres.includes('Hentai') &&
            resultString.toString().length < 2000) {
          resultString.push('**' + ct + '.** ' + element.title_english);
          ct += 1;
        }
      }
      if (resultString.toString().length > 2000) {
        resultString.pop();
        message.channel.send('Search results truncated due to length...')
          .catch( (reason) => {
            log.verbose('', curFile, func, 'Truncated season search results');
          });
      }

      message.channel.send(resultString)
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Reject message');
        });
    })
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Reject request message');
    });
}

/**
 * @param {message} message A message object as defined in discord.js
 */
function season(message) {
  aniListQuery('Airing', message, null);
}

/**
 * @param {message} message A message object as defined in discord.js
 * @param {string} title A string containing the title of the show
 */
function aniListSpecific(message, title) {
  let func = 'aniListSpecific';

  let queryUri = config.anilist_path + 'anime/search/' + title +
                 '?access_token=' + aniListToken.access_token;

  let queryOptions = {
    method: 'GET',
    uri: queryUri,
    json: true,
  };

  request(queryOptions)
    .then( (body) => {
      if (body == null || body == '') {
        message.channel.send('I couldn\'t find that anime.')
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject message');
          });
        return;
      }

      let text = '';
      let showInfo = body[0];

      text += '**' + showInfo.title_english + '**';
      text += '\n**Status:** ' + showInfo.airing_status;
      text += '\n**Description:** ' + showInfo.description.replace('<br>', ' ');

      let startTime = String(showInfo.start_date_fuzzy);
      let date = parseInt(startTime.substring(6, ));
      let month = parseInt(startTime.substring(4, 6));
      let year = parseInt(startTime.substring(0, 4));
      let timeString = new Date(year, month, date);
      let timeOptions = {month: 'long', day: 'numeric', year: 'numeric'};
      text += '\n**Starting around:** ';
      text += timeString.toLocaleDateString('en-US', timeOptions);
      text += '\n*' + showInfo.image_url_lge + '*';

      message.channel.send(text)
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Reject send message');
        });
    })
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Reject request message');
    });
}

/**
 * @param {message} message A message object as defined in discord.js
 */
function aninfo(message) {
  let title = message.content.replace('!aninfo ', '');
  aniListQuery('Specific', message, title);
}

/**
 * @param {string} orig - The original string
 * @param {int} targetLength - The string's  minimum length once padded
 * @return {string} - The original string with the padding added
 */
 function padRight(orig, targetLength) {
   let text = orig;
   while (text.length < targetLength) {
     text += ' ';
   }

   return text;
 }

 module.exports = {
   urbanDefine, getAvatar, coinFlip, rate, getOptions, deleteBooru,
   choose, roll, season, aninfo, padRight,
 };
