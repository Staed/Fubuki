let jsonfile = require('jsonfile');

let misc = require('./misc');

/**
 *  @param {Collection.<Snowflake, GuildMember>} members - A Map of (id, member)
 *  @param {number} index - The index in cmds where this @mention is found
 *  @param {string[]} capitalCmds - Strings containing parameters
 *  @return {string[]}
 */
function matchMention(members, index, capitalCmds) {
  let user = capitalCmds[index];
  let displayName = '';
  let username = '';

  if (capitalCmds.length > index) {
    if (/<@.?\d+>/.test(user)) {
      let userId = user.replace(/\D/g, '');
      let member = members.get(userId);
      displayName = member.display_name;
      username = member.user.username;
    } else {
      displayName = capitalCmds.slice(index).join(' ');
      username = displayName;

      for (let [, obj] of members) {
        let displayMatch =
            obj.displayName.toLowerCase() == displayName.toLowerCase();
        let usernameMatch =
            obj.user.username.toLowerCase() == username.toLowerCase();

        if (displayMatch || usernameMatch) {
          username = obj.user.username;
          break;
        }
      }
    }
  }

  return [displayName, username];
}

/**
 *  @param {channel} channel - The channel where the message originated
 *  @param {string[]} quotes - String arrays containing [username, text]
 */
function selectRandomQuote(channel, quotes) {
  if (!Object.keys(quotes).length) {
    console.log('No quotes found');
    channel.send('No quotes found')
     .catch( (reason) => {
       console.log('Rejected Quote NoQuote Promise for ' + reason);
     });
    return;
  }

  let rand = Math.random() * quotes.length - 1;
  let count = 0;

  for (let quote of quotes) {
    if (count >= rand) {
      channel.send('\"' + quote.content + '\" - ' + quote.name)
       .catch( (reason) => {
         console.log('Rejected Quote Read Promise for ' + reason);
       });
      break;
    }
    count += 1;
  }
}

/**
 *  @param {channel} channel - The channel where the message originated
 *  @param {string} name - The username
 *  @param {message} message - The last message from that username
 */
function addQuote(channel, name, message) {
  if (message != null && message.guild != undefined) {
    let quoteList = [];

    jsonfile.readFile('\res\quotes.json', (err, data) => {
      if (err) {
        console.log('Could not read file');
        return;
      }
      quoteList = data;

      obj = {
        'guild': message.guild.id.toString(),
        'name': name,
        'content': message.content,
      };
      quoteList.push(obj);

      jsonfile.writeFileSync('\res\quotes.json', quoteList, {spaces: 2}, (err) => {
        console.log('Could not append quote to file');
        return;
      });
    });

    channel.send('Added quote from ' + name)
      .catch( (reason) => {
        console.log('Rejected Quote Added Promise for ' + reason);
      });
    console.log('Quote added: \"' + message.content + '\" from ' +
                name + ' in ' + message.guild.name);
  } else {
    channel.send('No quote from that user found in the last 100 messages')
      .catch( (reason) => {
        console.log('Rejected Quote NoFound Promise for ' + reason);
      });
    console.log('No Quote found');
  }
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} capitalCmds - Strings containing parameters
 */
function addUserQuote(message, capitalCmds) {
  let name = matchMention(message.guild.members, 2, capitalCmds);
  let lastMessage;
  message.channel.fetchMessages({limit: 100})
   .then( (messages) => {
     for (let [, value] of messages.entries()) {
       if ((value.author.username.toLowerCase() == name[1].toLowerCase() ||
            value.author.username.toLowerCase() == name[0].toLowerCase()) &&
            /!quote( add)?.*/i.test(value.content) == false) {
         lastMessage = value;
         break;
       }
     }

     addQuote(message.channel, name[1], lastMessage);
   })
   .catch( (reason) => {
     console.log('Rejected Quote Fetch Promise for ' + reason);
   });
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} capitalCmds - Strings containing parameters
 */
function searchQuote(message, capitalCmds) {
  jsonfile.readFile('\res\quotes.json', (err, quoteList) => {
    if (err) {
      console.log('Could not read file');
      return;
    }

    let quotes = [];

    let name = matchMention(message.guild.members, 1, capitalCmds);

    for (let entry of quoteList) {
      if (message.guild.id == entry.guild &&
          (capitalCmds.length < 2 ||
          name[1].toLowerCase() == entry.name.toLowerCase())) {
        quotes.push(entry);
      }
    }

    selectRandomQuote(message.channel, quotes);
  });
}

/**
 * @param {message} message - A message object as defined in discord.js
 * @param {PermissionResolvable} permission - The permission level required
 * @return {boolean}
 */
function checkPermission(message, permission) {
  let admins = [];
  for (let [, role] of message.guild.roles.entries()) {
    if (role.hasPermission(permission)) {
      admins = role.members;
      break;
    }
  }

  for (let [, member] of admins.entries()) {
    if (member.id == message.author.id) {
      return true;
    }
  }

  return false;
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} cmds - Strings containing parameters
 */
function listQuotes(message, cmds) {
  if (checkPermission(message, 'ADMINISTRATOR')) {
    jsonfile.readFile('\res\quotes.json', (err, quoteList) => {
      if (err) {
        console.log('Failed to read Quote file: ' + err);
        message.channel.send('Failed to find a quote')
         .catch( (reason) => {
           console.log('Rejected Quote ListRead Promise for ' + reason);
         });
        return;
      }

      let list = '';
      let i = 0;
      for (let entry of quoteList) {
        if (message.guild.id == entry.guild) {
          list += misc.padRight(i + '. ', 5) + misc.padRight(entry.name, 18) +
                  ' - \" ' + entry.content + ' \"\n';
        }
        i++;
      }
      message.channel.send(list)
        .catch( (reason) => {
          console.log('Rejected Quote ListPrint Promise for ' + reason);
        });
    });
  } else {
    message.channel.send('You don\'t have the permission to do this!')
      .catch( (reason) => {
        console.log('Rejected Quote ListFail Promise for ' + reason);
      });
  }
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} cmds - Strings containing parameters
 */
function deleteQuote(message, cmds) {
  if (checkPermission(message, 'ADMINISTRATOR')) {
    jsonfile.readFile('\res\quotes.json', (err, quoteList) => {
      if (err) {
        console.log('Failed to read Quote file: ' + err);
        message.channel.send('Failed to find a quote')
         .catch( (reason) => {
           console.log('Rejected Quote DeleteRead Promise for ' + reason);
         });
        return;
      }

      let i = 0;
      for (let entry of quoteList) {
        if (i == cmds[2]) {
          if (message.guild.id != entry.guild) {
            message.channel.send('You can\'t delete quotes ' +
                                 'from outside this server')
              .catch( (reason) => {
                console.log('Rejected Quote Delete NotSameGuild Promise for ' +
                            reason);
              });
            console.log('Blocked attempt to delete quote from another server');
            return;
          }

          quoteList.splice(i, 1);
          break;
        }
        i++;
      }

      jsonfile.writeFileSync('\res\quotes.json', quoteList, {spaces: 2}, (err) => {
        if (err) {
          console.log('Failed to write Quote file: ' + err);
          message.channel.send('Failed to write to file')
            .catch( (reason) => {
              console.log('Rejected Quote DeleteWrite Promise for ' + reason);
            });
          return;
        }
      });

      message.channel.send('Quote #' + cmds[2] + ' deleted')
        .catch( (reason) => {
          console.log('Rejected Quote DelSuccess Promise for ' + reason);
        });
    });
  } else {
    message.channel.send('You don\'t have the permission to do this!')
      .catch( (reason) => {
        console.log('Rejected Quote DelFail Promise for ' + reason);
      });
  }
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} cmds - Strings containing lowercased parameters
 *  @param {string[]} capitalCmds - Strings containing parameters
 */
function quote(message, cmds, capitalCmds) {
  switch (cmds[1]) {
    case 'add':
      addUserQuote(message, capitalCmds);
      break;
    case 'list':
      listQuotes(message, cmds);
      break;
    case 'del':
      deleteQuote(message, cmds);
      break;
    default: {
      searchQuote(message, capitalCmds);
    }
  }
}

module.exports = {quote};
