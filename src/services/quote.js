const pTimeout = require('p-timeout');
const elastic = require('elasticsearch');

const log = require('./logger.mjs.js');

const curFile = 'quote';
const client = new elastic.Client({
  hosts: ['http://localhost:9200'],
});

pTimeout(openIndex(), 10000);

/**
 *  @param {Collection.<Snowflake, GuildMember>} members - A Map of (id, member)
 *  @param {number} index - The index in cmds where this @mention is found
 *  @param {string[]} capitalCmds - Strings containing parameters
 *  @return {string[]}
 */
function matchMention(members, index, capitalCmds) {
  let user = capitalCmds[index];
  let displayName = '';
  let id = '';

  if (capitalCmds.length > index) {
    if (/<@.?\d+>/.test(user)) {
      let userId = user.replace(/\D/g, '');
      let member = members.get(userId);
      displayName = member.displayName;
      id = member.id;
    } else {
      displayName = capitalCmds.slice(index).join(' ');

      for (let [, obj] of members) {
        if (obj.displayName.toLowerCase() == displayName.toLowerCase()) {
          username = obj.user.id;
          break;
        }
      }
    }
  }

  return id;
}

/**
 *  @param {channel} channel - The channel where the message originated
 *  @param {string[]} quotes - String arrays containing [username, text]
 */
function selectRandomQuote(channel, quotes) {
  const func = 'selectRandomQuote';

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
 *  @param {message} message - A message object as defined in discord.js
 *  @param {string[]} capitalCmds - Strings containing parameters
 */
function addUserQuote(message, capitalCmds) {
  const func = 'addUserQuote';

  const id = matchMention(message.guild.members, 2, capitalCmds);
  const name = members.get(id).displayName;

  message.channel.fetchMessages({limit: 100})
   .then( (messages) => {
     for (let [, value] of messages.entries()) {
       if ((value.author.id === name) &&
            /!.*/i.test(value.content) == false) {
         lastMessage = value;
         break;
       }
     }

     const entry = {
       content: value.content,
       guild: value.guild.id,
       timestamp: value.createdTimestamp,
       user: id,
     };

     elastic.index({
       body: JSON.stringify(entry),
       index: 'messages',
       type: 'message',
     });

     message.channel.send('Saved: ' + value.content);
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
  const func = 'searchQuote';

  const userId = matchMention(message.guild.members, 1, capitalCmds);

  client.search({
    index: 'messages',
    body: {
      query: {
        match: {
          guild: message.guild.id,
          user: userId,
        },
        function_score: {
          functions: [
            {
              random_score: {
                seed: Date.now(),
              },
            },
          ],
        },
      },
    },
  })
  .then((res) => {
    res.hits.hits[0];
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
          list += padRight(i + '. ', 5) + padRight(entry.name, 18) +
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

/**
 * Creates the Elastic DB if it doesn't already exist
 */
async function openIndex() {
  const exists = await client.indices.exists({index: 'messages'});
  if (!exists) {
    client.indices.create({index: 'messages'})
      .then(() => {
        client.indices.putMapping({
          body: {
              properties: {
                  displayName: {
                       type: 'string',
                  },
                  userId: {
                      index: 'true',
                      type: 'integer',
                  },
              },
          },
          index: 'users',
          timeout: '10s',
          type: 'users',
        });
      });
  }
}

/**
 * @param {GuildMember} member The user to add
 */
function addUser(member) {
  elastic.create({
    body: {
      displayName: member.displayName,
      userId: member.id,
    },
    index: 'users',
    type: 'users',
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

module.exports = {quote, addUser};
