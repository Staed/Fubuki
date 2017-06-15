/**
 * This file (misc.js) contains miscellaneous methods, usually entirely self-contained
 * They are put here since they do not require their own specific file for readability
 */

let config = require('./config');
let request = require('request-promise');

/**
 *  @param {message} message  A message object as defined in discord.js
 *  @param {string[]} cmds
 */
 function urbanDefine(message, cmds) {
   let term = cmds.slice(1).join('+');

   let options = {
     uri: config.urban_url + term,
     json: true
   };

   request(options)
      .then(function (body) {
        if (body.result_type == "no_results") {
          console.log('No results for ' + term);
          message.channel.sendMessage("There are no results for: " + term.replace('+', ' '));
        } else {
          let firstDef = body.list[0];
          message.channel.sendMessage('**' + cmds.slice(1).join(' ') + ':**\n' + firstDef.definition + '\n' + firstDef.example);
        }
      }).catch(function (err) {
        console.log('Error accessing Urban Dictionary\'s API:\n' + err);
        message.channel.sendMessage("Error accessing Urban Dictionary");
      });
 }

/**
 * @param {message} message A message object as defined in discord.js
 * @param {string} user A string representation of the user either as an id or username
 */
 function getAvatar(message, user) {
   console.log("Looking for: " + user)
   let memberName = user.toLowerCase();
   let avatarURL = '';

   if (memberName.charAt(1) == '@') {
     let obj = message.guild.members.get(memberName.substring(2, memberName.length - 1));
     if (typeof obj !== 'undefined') {
      avatarURL = obj.user.displayAvatarURL;
      console.log("Found " + obj.displayName + "'s avatar at " + avatarURL);
     }
   } else {
     for (var [id, memberObj] of message.guild.members) {
       let displayName = memberObj.displayName.toLowerCase();
       let username = memberObj.user.username.toLowerCase();

       if (displayName == memberName || username == memberName) {
        avatarURL = memberObj.user.displayAvatarURL;
        console.log("Found " + memberObj.displayName + "'s avatar at " + avatarURL);
        break;
       }
     }
   }

   if (avatarURL) {
     avatarURL = avatarURL.replace('jpg', 'png');
     message.channel.sendMessage(avatarURL);
   } else {
     console.log("Could not find member " + user);
     message.channel.sendMessage("I couldn't find that member!");
   }
 }

 /**
  *  @param {message} message  A message object as defined in discord.js
  *  @param {string[]} cmds Strings that need to be joined and rated
  * Consider replacing the random function with another thing, maybe tied to stocks or time
  */
 function rate(message, cmds) {
   let str = message.content.split(' ').slice(1).join(' ');
   let rating = rateAlgorithm(str);

   if (str.toLowerCase() == 'staed') {
     message.channel.sendMessage("Staeds are great! I'll give Staed a 10/10!");
     console.log('Rated a Staed');
   } else if (str.toLowerCase() == 'sawai') {
     message.channel.sendMessage("Sawais are :put_litter_in_its_place: I'll give Sawai a 0/10");
     console.log('Rated a Sawai');
   } else {
     console.log('Rated ' + str + ' as ' + rating + '/10');
     message.channel.sendMessage("I'd rate " + str + ' ' + rating + '/10');
   }
 }

/**
 * @param {string} text A string containing the thing to be rated
 * @return {int} A number between 1 and 10 inclusive
 */
 function rateAlgorithm(text) {
   return Math.floor(Math.random() * 10 + 1);
 }

 module.exports = {urbanDefine, getAvatar, rate};
