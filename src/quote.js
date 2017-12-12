let jsonfile = require('jsonfile');

let log = require('./logger.js');
let misc = require('./misc.js');

let curFile = 'quote.js';

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
  let func = 'selectRandomQuote';

  if (!Object.keys(quotes).length) {
    log.verbose('empty', curFile, func, 'No quotes found');
    channel.send('No quotes found')
     .catch( (reason) => {
       log.info(reason, curFile, func, 'Reject no quote');
     });
    return;
  }

  let rand = Math.random() * quotes.length - 1;
  let count = 0;

  for (let quote of quotes) {
    if (count >= rand) {
      channel.send('\"' + quote.content + '\" - ' + quote.name)
       .catch( (reason) => {
         log.info(reason, curFile, func, 'reject quote read');
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
  let func = 'addQuote';

  if (message != null && message.guild != undefined) {
    let quoteList = [];

    jsonfile.readFile('src\\res\\quotes.json', (err, data) => {
      if (err) {
        log.warn(err, curFile, func, 'Could not read file');
        return;
      }
      quoteList = data;

      obj = {
        'guild': message.guild.id.toString(),
        'name': name,
        'content': message.content,
      };
      quoteList.push(obj);

      jsonfile.writeFileSync('src\\res\\quotes.json', quoteList,
                             {spaces: 2}, (err) => {
        log.warn(err, curFile, func, 'Could not append quote to file');
        return;
      });
    });

    channel.send('Added quote from ' + name)
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject quote added');
      });
    log.verbose('add', curFile, func, 'Quote added: \"' + message.content +
                '\" from ' + name + ' in ' + message.guild.name);
  } else {
    channel.send('No quote from that user found in the last 100 messages')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject quote not found');
      });
    log.verbose('not found', curFile, func, 'No Quote found');
  }
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} capitalCmds - Strings containing parameters
 */
function addUserQuote(message, capitalCmds) {
  let func = 'addUserQuote';

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
     log.info(reason, curFile, func, 'Reject quote fetch');
   });
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} capitalCmds - Strings containing parameters
 */
function searchQuote(message, capitalCmds) {
  let func = 'searchQuote';

  jsonfile.readFile('src\\res\\quotes.json', (err, quoteList) => {
    if (err) {
      log.warn(err, curFile, func, 'Could not read file');
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
  let func = 'listQuotes';

  if (checkPermission(message, 'ADMINISTRATOR')) {
    jsonfile.readFile('src\\res\\quotes.json', (err, quoteList) => {
      if (err) {
        log.warn(err, curFile, func, 'Failed to read Quote file');
        message.channel.send('Failed to find a quote')
         .catch( (reason) => {
           log.info(reason, curFile, func, 'Reject find quote fail');
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
          log.info(reason, curFile, func, 'Reject send list');
        });
    });
  } else {
    message.channel.send('You don\'t have the permission to do this!')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject permission denied');
      });
  }
}

/**
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} cmds - Strings containing parameters
 */
function deleteQuote(message, cmds) {
  let func = 'deleteQuote';

  if (checkPermission(message, 'ADMINISTRATOR')) {
    jsonfile.readFile('src\\res\\quotes.json', (err, quoteList) => {
      if (err) {
        log.warn(err, curFile, func, 'Failed to read Quote file');
        message.channel.send('Failed to find a quote')
         .catch( (reason) => {
           log.info(reason, curFile, func, 'Reject find quote fail');
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
                log.info(reason, curFile, func,
                         'Reject different guild');
              });
            log.verbose('invalid', curFile, func,
                        'Blocked attempt to delete quote from another server');
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
          log.warn(err, curFile, func, 'Failed to write Quote file');
          message.channel.send('Failed to write to file')
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject write fail');
            });
          return;
        }
      });

      message.channel.send('Quote #' + cmds[2] + ' deleted')
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Reject delete success');
        });
    });
  } else {
    message.channel.send('You don\'t have the permission to do this!')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject permission denied');
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
