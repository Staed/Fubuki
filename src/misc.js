/**
 * This file (misc.js) contains miscellaneous methods,
 * usually entirely self-contained. They are put here
 * since they do not require their own specific file for readability
 */

let config = require('../config');
let request = require('request-promise');

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
      avatarUrl = obj.user.displayavatar_url;
      console.log('Found ' + obj.display_name + '\'s avatar at ' + avatarUrl);
     }
   } else {
     for (let [, memberObj] of message.guild.members) {
       let displayName = memberObj.display_name.toLowerCase();
       let username = memberObj.user.username.toLowerCase();

       if (displayName == memberName || username == memberName) {
        avatarUrl = memberObj.user.displayavatar_url;
        console.log('Found ' + memberObj.display_name +
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
   urbanDefine, getAvatar, coinFlip, rate, getOptions, deleteBooru, padRight,
 };