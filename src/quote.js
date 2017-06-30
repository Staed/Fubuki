/**
 * This file handles storing and retrieving quotes. The quotes are stored as a
 * json on the file system to perserve information across different sessions.
 * Quotes are simply objects containing a quote, an author, and a guild ID.
 * This allows the quotes to be searched via the Discord server they were said
 * on as well as by author and/or content.
 * @package jsonfile
 */
let jsonfile = require('jsonfile');

let misc = require('./misc');

/**
 * Given a set of member objects, this function attempts to retrieve the
 * correct usernames. Because the set of member objects uses a member ID as the
 * key and this is will not be known by users, some processing must be done
 * to the parameters to retrieve the correc information
 *
 * @param {Collection.<Snowflake, GuildMember>} members - A Map of (id, member)
 * @param {number} index - The index in cmds where this @mention is found
 * @param {string[]} capitalCmds - Strings containing parameters
 * @return {string[]}
 */
function matchMention(members, index, capitalCmds) {
  let user = capitalCmds[index];
  let displayName = '';
  let username = '';

  if (capitalCmds.length > index) {
    if (/<@.?\d+>/.test(user)) {
      // The parameter matched an @mention as described by Discord
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

  /**
   * The display name for any specific user can vary between Discord servers,
   * so we want to return both the nickname and the true name.
   */
  return [displayName, username];
}

/**
 * Selects a random element from the set passed in and replies on the channel
 *
 * @param {channel} channel - The channel from which the message originated
 * @param {string[]} quotes - String arrays containing [username, text]
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
 * Adds a quote object which contains the content, author name, and guild ID to
 * an existing file on the filesystem
 *
 * @param {channel} channel - The channel where the message originated
 * @param {string} name - The username
 * @param {message} message - The last message from that username
 */
function addQuote(channel, name, message) {
  if (message != null && message.guild != undefined) {
    let quoteList = [];

    jsonfile.readFile('src\\res\\quotes.json', (err, data) => {
      if (err) {
        console.log('Could not read file');
        return;
      }
      /**
       * TODO: Look into simply deleting the last characters of the file and
       * appending the new quote object. The current system of recreating the
       * entire json array is inefficient - O(n)
       */
      quoteList = data;

      obj = {
        'guild': message.guild.id.toString(),
        'name': name,
        'content': message.content,
      };
      quoteList.push(obj);

      jsonfile.writeFileSync('src\\res\\quotes.json', quoteList,
                             {spaces: 2}, (err) => {
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
 * Upon getting the name of a user in the guild, searches for a proper message
 * from that user in the last hundred messages of the channel. A proper message
 * is any that isn't some form of a !quote command, which is what called this
 * function in the first place.
 *
 * @param {message} message - The original message object prompting this call
 * @param {string[]} capitalCmds - Strings forming the name of the quotee
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
 * Reads the quote json from the filesystem and populates the temporary array
 * of quotes. The populating of the array is filtered by the parameters passed
 * in. In this case, whether or not the name of a user whose quote is getting
 * recieved  was given.
 *
 *  @param {message} message - The original message object prompting this call
 *  @param {string[]} capitalCmds - Array of strings containing the parameters
 */
function searchQuote(message, capitalCmds) {
  jsonfile.readFile('src\\res\\quotes.json', (err, quoteList) => {
    if (err) {
      console.log('Could not read file: ' + err);
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
 * Upon receiving an author and permission level, checks if that author is in
 * the list of people with at least that permission level in that guild.
 *
 * @param {message} message - The original message object prompting this call
 * @param {PermissionResolvable} permission - The permission level required
 * @return {boolean} Whether of not the author has the proper permission
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
 * Checks whether the requester has the ADMIN permission level to list out
 * all the quotes from the file that belong to this guild. If they do, the
 * quotes are printed out along with their index numbers.
 *
 * @param {message} message - The original message object prompting this call
 * @param {string[]} cmds - Strings containing parameters
 */
function listQuotes(message, cmds) {
  if (checkPermission(message, 'ADMINISTRATOR')) {
    jsonfile.readFile('src\\res\\quotes.json', (err, quoteList) => {
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
 * Checks if the requester has the ADMIN permission in this guild and if they
 * do, deletes the quote at the specified index of the json file. The requester
 * is only allowed to delete quotes from this guild.
 *
 * @param {message} message - The original message object prompting this call
 * @param {string[]} cmds - Strings containing parameters
 */
function deleteQuote(message, cmds) {
  if (checkPermission(message, 'ADMINISTRATOR')) {
    jsonfile.readFile('src\\res\\quotes.json', (err, quoteList) => {
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

      jsonfile.writeFileSync('src\\res\\quotes.json', quoteList,
                             {spaces: 2}, (err) => {
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
 * Upon recieving a call to this function, it attempts to direct to the
 * corresponding methods.
 *
 * @param {message} message - The original message object prompting this call
 * @param {string[]} cmds - Strings containing lowercased parameters
 * @param {string[]} capitalCmds - Strings containing parameters
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
