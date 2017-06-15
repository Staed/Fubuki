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
          message.channel.sendMessage("There are no results for: " + term.Replace('+', ' '));
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
 * @param {string[]} cmds An array of commands created by splitting by spaces
 */
 function getAvatar(message, cmds) {
   console.log("Looking for: " + cmds[1])
   let memberName = cmds[1].toLowerCase();
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
     console.log("Could not find member " + cmds[1]);
     message.channel.sendMessage("I couldn't find that member!");
   }
 }

 module.exports = {urbanDefine, getAvatar};
