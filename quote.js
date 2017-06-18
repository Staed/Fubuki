let config = require('./config');
let fs = require('fs');

/**
 *  @param {Collection<Snowflake, GuildMember>} members  A Map of [user id : member object]
 *  @param {int} index The index in cmds where this @mention is found
 *  @param {string[]} cmds Strings containing an action and potential extra parameters
 *  @return {string[2]} The display name and username of that user in that order
 */
function matchMention(members, index, cmds) {
  let user = cmds[index];
  let display_name = '';
  let username = '';

  if (cmds.length > index) {
    if (/<@\d+>/.test(user)) {
      let user_id = user.substring(2, user.length - 1);
      let member = members.get(user_id);
      display_name = member.display_name.toLowerCase();
      username = member.user.username;
    } else {
      display_name = cmds.slice(index).join(' ');
      username = display_name;
    }
  }

  if (!display_name) {
    for (let [id, obj] of members) {
      let d_name = obj.displayName.toLowerCase();
      let u_name = obj.user.username.toLowerCase();

      if (d_name == user || u_name == user) {
        name = [d_name, u_name];
      }
    }
  }

  return [display_name, username];
}

/**
 *  @param {channel} channel The channel from which the original message came from
 *  @param {string[][2]} quotes An array of string[2]s which contain [username, text]
 */
function selectRandomQuote(channel, quotes) {
  if (quotes.size <= 0) {
    console.log("No quotes found");
    channel.send("No quotes found")
     .catch( reason => { console.log("Rejected Quote NoQuote Promise for " + reason); });
    return;
  }

  let rand = Math.random() * quotes.length - 1;
  let count = 0;

  for (let quote of quotes) {
    if (count >= rand) {
      channel.send("\"" + quote[1] + "\" - " + quote[0])
       .catch( reason => { console.log("Rejected Quote Read Promise for " + reason); });
      break;
    }
    count += 1;
  }
}

/**
 *  @param {channel} channel The channel from which the original message came from
 *  @param {string} name The username
 *  @param {message} message The last message from that username
 */
function addQuote(channel, name, message) {
  if (message != null) {
    fs.appendFile('quotes.txt', name + ':::' + message.content + '\n', function (err) {
      if (err) {
        console.log("Could not append quote to file");
        return;
      }
      channel.send("Added quote from " + name)
        .catch( reason => { console.log("Rejected Quote Added Promise for " + reason); });
      console.log('Quote added: ' + name + " ::: " + message.content);
    });
  } else {
    channel.send("No quote from that user found in the last 100 messages")
      .catch( reason => { console.log("Rejected Quote NoFound Promise for " + reason); });
    console.log('No Quote found');
  }
}

/**
 *  @param {message} message  A message object as defined in discord.js
 *  @param {string[]} cmds Strings containing an action and potential extra parameters
 */
function quote(message, cmds) {
  if (cmds[1] == 'add') {
    let user = cmds.slice(2).join(' ');
    let name = matchMention(message.guild.members, 2, cmds);

    let last_message;
    message.channel.fetchMessages({ limit: 100})
     .then( messages => {
       for (let [key, value] of messages.entries()) {
         if (value.author.username == name[1] && /!quote( add)?.*/i.test(value.content) == false) {
           last_message = value;
           break;
         }
       }

       addQuote(message.channel, name[0], last_message);
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

      let name = matchMention(message.guild.members, 1, cmds);

      for (let i = 0; i < entries.length - 1; i += 2) {
        if (cmds.length < 2 || name[0] == entries[i].toLowerCase()) {
          let entry = [entries[i], entries[i+1]];
          quotes.push(entry);
        }
      }

      selectRandomQuote(message.channel, quotes);
    });
  }
}

module.exports = {quote};
