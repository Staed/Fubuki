let config = require('./config');
let fs = require('fs');

/**
 *  @param {Collection<Snowflake, GuildMember>} members  A Map of [user id : member object]
 *  @param {int} index The index in cmds where this @mention is found
 *  @param {string[]} capital_cmds Strings containing an action and potential extra parameters
 *  @return {string[2]} The display name and username of that user in that order
 */
function matchMention(members, index, capital_cmds) {
  let user = capital_cmds[index];
  let display_name = '';
  let username = '';

  if (capital_cmds.length > index) {
    if (/<@\d+>/.test(user)) {
      let user_id = user.substring(2, user.length - 1);
      let member = members.get(user_id);
      display_name = member.display_name;
      username = member.user.username;
    } else {
      display_name = capital_cmds.slice(index).join(' ');

      for (let [id, obj] of members) {
        if (obj.displayName.toLowerCase() == display_name.toLowerCase()) {
          username = obj.user.username;
          break;
        }
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
 *  @param {string[]} capital_cmds  Capitalized strings containing an action and potential extra parameters
 */
function addUserQuote(message, capital_cmds) {
  let name = matchMention(message.guild.members, 2, capital_cmds);
  let last_message;
  message.channel.fetchMessages({ limit: 100})
   .then( messages => {
     for (let [key, value] of messages.entries()) {
       if (value.author.username.toLowerCase() == name[1].toLowerCase() && /!quote( add)?.*/i.test(value.content) == false) {
         last_message = value;
         break;
       }
     }

     addQuote(message.channel, name[0], last_message);
   })
   .catch( reason => { console.log("Rejected Quote Fetch Promise for " + reason); });
}

/**
 *  @param {message} message  A message object as defined in discord.js
 *  @param {string[]} capital_cmds  Capitalized strings containing an action and potential extra parameters
 */
function searchQuote(message, capital_cmds) {
  fs.readFile("quotes.txt", function(err, text) {
    if (err) {
      console.log("Failed to read Quote file: " + err);
      message.channel.send("Failed to find a quote")
       .catch( reason => { console.log("Rejected Quote SearchRead Promise for " + reason); });
      return;
    }

    let entries = text.toString().replace(/[\r\n]+/ig, ":::").split(/:{3}/);
    let quotes = [];

    let name = matchMention(message.guild.members, 1, capital_cmds);

    for (let i = 0; i < entries.length - 1; i += 2) {
      if (capital_cmds.length < 2 || name[0].toLowerCase() == entries[i].toLowerCase()) {
        let entry = [entries[i], entries[i+1]];
        quotes.push(entry);
      }
    }

    selectRandomQuote(message.channel, quotes);
  });
}

/**
 * @param {message} message  A message object as defined in discord.js
 * @param {PermissionResolvable} permission  The permission level required
 * @return {boolean}  Whether or not the user has the permission
 */
function checkPermission(message, permission) {
  let admins = [];
  for (let [id, role] of message.guild.roles.entries()) {
    if (role.hasPermission(permission)) {
      admins = role.members;
      break;
    }
  }

  for (let [id, member] of admins.entries()) {
    if (member.id == message.author.id) {
      return true;
    }
  }

  return false;
}

/**
 *  @param {message} message  A message object as defined in discord.js
 *  @param {string[]} cmds  Capitalized strings containing an action and potential extra parameters
 */
function listQuotes(message, cmds) {
  if (checkPermission(message, 'ADMINISTRATOR')) {
    fs.readFile("quotes.txt", function(err, text) {
      if (err) {
        console.log("Failed to read Quote file: " + err);
        message.channel.send("Failed to find a quote")
         .catch( reason => { console.log("Rejected Quote ListRead Promise for " + reason); });
        return;
      }

      let entries = text.toString().replace(/[\r\n]+/ig, ":::").split(/:{3}/);
      let list = '';
      for (let i = 0; i < entries.length - 1; i += 2) {
          list += i/2 + ". " +  entries[i] + '\t - \"' + entries[i+1] + "\"\n";
      }
      message.channel.send(list)
        .catch( reason => { console.log("Rejected Quote ListPrint Promise for " + reason); });
    });
  } else {
    message.channel.send("You don't have the permission to do this!")
      .catch( reason => { console.log("Rejected Quote ListFail Promise for " + reason); });
  }
}

/**
 *  @param {message} message  A message object as defined in discord.js
 *  @param {string[]} cmds  Capitalized strings containing an action and potential extra parameters
 */
function deleteQuote(message, cmds) {
  if (checkPermission(message, 'ADMINISTRATOR')) {
    let new_entries = '';

    fs.readFile("quotes.txt", function(err, text) {
      if (err) {
        console.log("Failed to read Quote file: " + err);
        message.channel.send("Failed to find a quote")
         .catch( reason => { console.log("Rejected Quote DeleteRead Promise for " + reason); });
        return;
      }

      let entries = text.toString().replace(/[\r\n]+/ig, ":::").split(/:{3}/);
      let quotes = [];
      for (let i = 0; i < entries.length - 1; i += 2) {
        if(i == 2*cmds[2]) {
          continue;
        }
        let entry = [entries[i], entries[i+1]];
        quotes.push(entry);
      }

      for (let [name, text] of quotes) {
        new_entries += name + ":::" + text + "\n"
      }
      new_entries = new_entries.substring(0, new_entries.length);

      fs.writeFile("quotes.txt", new_entries, function(err) {
        if (err) {
          console.log("Failed to write Quote file: " + err);
          message.channel.send("Failed to write to file")
            .catch( reason => { console.log("Rejected Quote DeleteWrite Promise for " + reason); });
        }
      });
    });

    message.channel.send("Quote #" + cmds[2] + " deleted")
      .catch( reason => { console.log("Rejected Quote DelSuccess Promise for " + reason); });
  } else {
    message.channel.send("You don't have the permission to do this!")
      .catch( reason => { console.log("Rejected Quote DelFail Promise for " + reason); });
  }
}

/**
 *  @param {message} message  A message object as defined in discord.js
 *  @param {string[]} cmds  Strings containing an action and potential extra parameters
 *  @param {string[]} capital_cmds  Capitalized strings containing an action and potential extra parameters
 */
function quote(message, cmds, capital_cmds) {
  switch (cmds[1]) {
    case 'add':
      addUserQuote(message, capital_cmds);
      break;
    case 'list':
      listQuotes(message, cmds);
      break;
    case 'del':
      deleteQuote(message, cmds);
      break;
    default: {
      searchQuote(message, capital_cmds);
    }
  }
}

module.exports = {quote};
