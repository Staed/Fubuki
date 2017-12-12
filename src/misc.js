/**
 * This file (misc.js) contains miscellaneous methods,
 * usually entirely self-contained. They are put here
 * since they do not require their own specific file for readability
 */

let config = require('../config');
let request = require('request-promise');

let aniListToken;
/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} cmds
 */
 function urbanDefine(message, cmds) {
   let term = cmds.slice(1).join('+');

   let options = {
     uri: config.urban_url + term,
     json: true,
   };

   request(options)
      .then( (body) => {
        if (body.result_type == 'no_results') {
          console.log('No results for ' + term);
          message.channel.send('There are no results for: ' +
                               term.replace('+', ' '))
            .catch( (reason) => {
              console.log('Rejected Urban Null Promise for ' + reason);
            });
        } else {
          let firstDef = body.list[0];
          message.channel.send('**' + cmds.slice(1).join(' ') + ':**\n' +
                               firstDef.definition + '\n' + firstDef.example)
            .catch( (reason) => {
              console.log('Rejected Urban Definition Promise for ' + reason);
            });
        }
      }).catch( (err) => {
        console.log('Error accessing Urban Dictionary\'s API:\n' + err);
        message.channel.send('Error accessing Urban Dictionary')
          .catch( (reason) => {
            console.log('Rejected Urban Reject Promise for ' + reason);
          });
      });
 }

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {string[]} cmds - String[] containing "!a" and a user id or username
 */
 function getAvatar(message, cmds) {
   if (cmds[1] == undefined) {
     console.log('No username for avatar specified');
     message.channel.send('You need to specify who\'s avatar I am looking for!')
      .catch( (reason) => {
        console.log('Rejected Avatar Reject Promise for ' + reason);
      });
     return;
   }

   let user = cmds.slice(1).join(' ');

   console.log('Looking for: ' + user);
   let memberName = user.toLowerCase();
   let avatarUrl = '';

   if (/<@.?\d+>/.test(memberName)) {
     let obj = message.guild.members.get(memberName.replace(/\D/g, ''));
     if (typeof obj !== 'undefined') {
      avatarUrl = obj.user.displayAvatarURL;
      console.log('Found ' + obj.displayName + '\'s avatar at ' + avatarUrl);
     }
   } else {
     for (let [, memberObj] of message.guild.members) {
       let displayName = memberObj.displayName.toLowerCase();
       let username = memberObj.user.username.toLowerCase();

       if (displayName == memberName || username == memberName) {
        avatarUrl = memberObj.user.displayAvatarURL;
        console.log('Found ' + memberObj.displayName +
                    '\'s avatar at ' + avatarUrl);
        break;
       }
     }
   }

   if (avatarUrl) {
     avatarUrl = avatarUrl.replace('jpg', 'png');
     message.channel.send(avatarUrl)
      .catch( (reason) => {
        console.log('Rejected Avatar Result for ' + reason);
      });
   } else {
     console.log('Could not find member ' + user);
     message.channel.send('I couldn\'t find that member!')
      .catch( (reason) => {
        console.log('Rejected Avatar Null Promise for ' + reason);
      });
   }
 }

/**
* @param {message} message - A message object as defined in discord.js
*/
 function coinFlip(message) {
   let coin;
   let flip = Math.floor(Math.random() * 100 + 1);

   if (flip < 50) {
     coin = 'tails';
   } else if (flip > 50) {
     coin = 'heads';
   } else {
     message.channel.send('Uhm... the coin landed on its side, flipping again.')
      .catch( (reason) => {
        console.log('Rejected Coin Flip Promise for ' + reason);
      });
    message.channel.send('!coinflip')
      .catch( (reason) => {
        console.log('Rejected Coin Flip Promise for ' + reason);
      });
    return;
   }
   message.channel.send('You flipped **' + coin + '**')
    .catch( (reason) => {
      console.log('Rejected Coin Flip Promise for ' + reason);
    });
 }

 /**
  *  @param {message} message - A message object as defined in discord.js
  *  @param {string[]} cmds - Strings that need to be joined and rated
  * Consider replacing the random function with another thing,
  * maybe tied to stocks or time
  */
 function rate(message, cmds) {
   let str = message.content.split(' ').slice(1).join(' ');
   let rating = rateAlgorithm(str);

   if (str.toLowerCase() == 'staed') {
     message.channel.send('Staeds are great! I\'ll give Staed a 10/10!')
      .catch( (reason) => {
        console.log('Rejected Rate Staed Promise for ' + reason);
      });
     console.log('Rated a Staed');
   } else if (str.toLowerCase() == 'sawai') {
     message.channel.send('Sawais are :put_litter_in_its_place: ' +
                          'I\'ll give Sawai a 0/10')
      .catch( (reason) => {
        console.log('Rejected Rate Sawai Promise for ' + reason);
      });
     console.log('Rated a Sawai');
   } else {
     console.log('Rated ' + str + ' as ' + rating + '/10');
     message.channel.send('I\'d rate ' + str + ' ' + rating + '/10')
      .catch( (reason) => {
        console.log('Rejected Rate Response Promise for ' + reason);
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
   // Do NOT use qs: { ... }, it replaces '+' with '%20'
   let options = {
     method: 'GET',
     uri: hostname + path + tags,
     json: true,
   };
   console.log('Recieved request for: ' + path + tags);
   return options;
 }

 /**
  * @param {message} message - A message object as defined in discord.js
  */
function deleteBooru(message) {
  message.channel.fetchMessages({limit: 100})
    .then( (msgs) => {
      for (let [, value] of msgs.entries()) {
        if (value.author.id == config.id &&
            /\*\*Tags:\*\* .*\nhttps:.*/.test(value.content) == true) {
          value.delete()
            .catch( (reason) => {
              console.log('Rejected Delete Message Promise for ' + reason);
            });
          console.log('Deleted ' + value.content.replace('\n', '\t'));
          return;
        }
      }

      message.channel.send('No booru post to delete in the last 100 messages!')
        .catch( (reason) => {
          console.log('Rejected Delete Exhaust Promise for ' + reason);
        });
    })
    .catch( (err) => {
      message.channel.send('Failed to fetch past messages')
        .catch( (reason) => {
          console.log('Rejected Delete NotFound Promise for ' + reason);
        });
      console.log('No messages found: ' + err);
    });
}

/**
 * @param {message} message - A message object as defined by discord.js
 */
function choose(message) {
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
      console.log('Rejected Misc Choose Promise for ' + reason);
    });
}

/**
 * @param {message} message - A message object as defined by discord.js
 */
function roll(message) {
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
      console.log('Rejected Misc Roll Promise for ' + reason);
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
      console.log('Failed Misc Roll Result Promise for ' + reason);
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
  if (aniListToken != null && aniListToken.expires > (Date.now()/1000 - 60)) {
    if ('airing' == queryType.toLowerCase()) {
      aniListAiring(message);
    } else if ('specific' == queryType.toLowerCase()) {
      aniListSpecific(message, title);
    } else {
      Console.log('Invalid queryType in aniListQuery (misc.js)');
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
        Console.log('Invalid queryType in aniListQuery (misc.js)');
      }
    })
    .catch( (reason) => {
      console.log('Rejected Misc AniListQuery Promise for ' + reason);
    });
}

/**
 * @param {message} message A message object as defined in discord.js
 */
function aniListAiring(message) {
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
            console.log('Truncated Currently Airing Message');
          });
      }

      message.channel.send(resultString)
        .catch( (reason) => {
          console.log('Rejected Misc A.L.A. Send Promise for ' + reason);
        });
    })
    .catch( (reason) => {
      console.log('Rejected Misc AniListAiring Promise for ' + reason);
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
            console.log('Rejected Misc A.L.S. Fail Promise for ' + reason);
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
          console.log('Rejected Misc A.L.S. Send Promise for ' + reason);
        });
    })
    .catch( (reason) => {
      console.log('Rejected Misc AniListSpecific Promise for ' + reason);
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
