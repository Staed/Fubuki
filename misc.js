/**
 * This file (misc.js) contains miscellaneous methods, usually entirely self-contained
 * They are put here since they do not require their own specific file for readability
 */

let config = require('./config');
let request = require('request-promise');
let fs = require('fs');

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
          message.channel.send("There are no results for: " + term.replace('+', ' '))
            .catch( reason => { console.log("Rejected Urban Null Promise for " + reason); });
        } else {
          let firstDef = body.list[0];
          message.channel.send('**' + cmds.slice(1).join(' ') + ':**\n' + firstDef.definition + '\n' + firstDef.example)
            .catch( reason => { console.log("Rejected Urban Definition Promise for " + reason); });
        }
      }).catch(function (err) {
        console.log('Error accessing Urban Dictionary\'s API:\n' + err);
        message.channel.send("Error accessing Urban Dictionary")
          .catch( reason => { console.log("Rejected Urban Reject Promise for " + reason); });
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
     message.channel.send(avatarURL)
      .catch( reason => { console.log("Rejected Avatar Result for " + reason); });
   } else {
     console.log("Could not find member " + user);
     message.channel.send("I couldn't find that member!")
      .catch( reason => { console.log("Rejected Avatar Null Promise for " + reason); });
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
     message.channel.send("Staeds are great! I'll give Staed a 10/10!")
      .catch( reason => { console.log("Rejected Rate Staed Promise for " + reason); });
     console.log('Rated a Staed');
   } else if (str.toLowerCase() == 'sawai') {
     message.channel.send("Sawais are :put_litter_in_its_place: I'll give Sawai a 0/10")
      .catch( reason => { console.log("Rejected Rate Sawai Promise for " + reason); });
     console.log('Rated a Sawai');
   } else {
     console.log('Rated ' + str + ' as ' + rating + '/10');
     message.channel.send("I'd rate " + str + ' ' + rating + '/10')
      .catch( reason => { console.log("Rejected Rate Response Promise for " + reason); });
   }
 }

 /**
  *  @param {message} message  A message object as defined in discord.js
  *  @param {string[]} cmds Strings containing an action and potential extra parameters
  */
 function quote(message, cmds) {
   if (cmds[1] == 'add') {
     let user = cmds[2];
     let member;

     if (user.charAt(1) == '@') {
       let obj = message.guild.members.get(user.substring(2, user.length - 1));
       if (typeof obj !== 'undefined') {
         member = obj;
       }
     } else {
       for (var [id, member_obj] of message.guild.members) {
         let display_name = member_obj.displayName.toLowerCase();
         let username = member_obj.user.username.toLowerCase();
         if (display_name == user || username == user) {
           member = member_obj;
         }
       }
     }

     let lastMessage;
     message.channel.fetchMessages({ limit: 100})
      .then( messages => {
        for (let [key, value] of messages.entries()) {
          if (value.author.username == member.user.username && /!quote( add)?.*/i.test(value.content) == false) {
            lastMessage = value;
            break;
          }
        }

        if (lastMessage != null) {
          fs.appendFile('quotes.txt', member.displayName + ':::' + lastMessage.content + '\n', function (err) {
            if (err) {
              console.log("Could not append quote to file");
              return;
            }
            message.channel.send("Added quote from " + member.displayName)
              .catch( reason => { console.log("Rejected Quote Added Promise for " + reason); });
            console.log('Quote added: ' + member.displayName + " ::: " + lastMessage.content);
          });
        } else {
          message.channel.send("No quote from that user found in the last 100 messages")
            .catch( reason => { console.log("Rejected Quote NoFound Promise for " + reason); });
          console.log('No Quote found');
        }
      })
      .catch( reason => { console.log("Rejected Quote Fetch Promise for " + reason); });
   } else {
     fs.readFile("quotes.txt", function(err, text) {
       if (err) {
         console.log("Failed to read Quote file: " + err);
         message.channel.send("Failed to find a quote")
          .catch( reason => { console.log("Rejected Quote Read Promise for " + reason); });
         return;
       }

       let entries = text.toString().replace(/[\r\n]+/ig, ":::").split(/:{3}/);
       let quotes = [];

       let name = '';
       if (cmds.length > 1) {
         if (/<@\d+>/.test(cmds[1])) {
           name = message.guild.members.get(cmds[1].substring(2, cmds[1].length - 1)).displayName.toLowerCase();
         } else {
           name = cmds[1];
         }
       }

       for (let i = 0; i < entries.length - 1; i += 2) {
         if (cmds.length < 2 || name == entries[i].toLowerCase()) {
           let entry = [entries[i], entries[i+1]];
           quotes.push(entry);
         }
       }

       if (quotes.size <= 0) {
         message.channel.send("No quotes found")
          .catch( reason => { console.log("Rejected Quote NoQuote Promise for " + reason); });
         console.log("No quotes found");
         return;
       }

       let rand = Math.random() * quotes.length - 1;
       let count = 0;

       for (let quote of quotes) {
         if (count >= rand) {
           message.channel.send("\"" + quote[1] + "\" - " + quote[0] )
            .catch( reason => { console.log("Rejected Quote Read Promise for " + reason); });
           break;
         }
         count += 1;
       }
     });
   }
 }

/**
 * @param {string} text A string containing the thing to be rated
 * @return {int} A number between 1 and 10 inclusive
 */
 function rateAlgorithm(text) {
   return Math.floor(Math.random() * 10 + 1);
 }

 module.exports = {urbanDefine, getAvatar, rate, quote};
