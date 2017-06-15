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

 module.exports = {urbanDefine};
