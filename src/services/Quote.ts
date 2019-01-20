import * as pTimeout from 'p-timeout';
import * as elastic from 'elasticsearch';
import * as esb from 'elastic-builder';
import * as Discord from 'discord.js';

import LOGGER from '../util/Logger';
import config from '../config';
import MISC from '../util/Misc';

import { isNullOrUndefined } from 'util';
import { Pair } from 'tstl';
import Misc from '../util/Misc';

interface Entry {
  content: string
  guild: string
  timestamp: Date
  user: string
}

export default class Quote {
  private Logger: LOGGER;
  private client: elastic.Client;
  private Misc: MISC;

  constructor() {
    this.Logger = new LOGGER('Quote');
    this.client = new elastic.Client({ hosts: ['http://localhost:9200' ]});
    this.Misc = new MISC();

    pTimeout(this.openIndex(), config.MAXTIMEOUT);
  }

  /**
   * Creates the Elastic DB if it doesn't already exist
   * @return {Promise<void>}
   */
  private async openIndex(): Promise<void> {
    const existsMessages = await this.client.indices.exists({index: 'messages'});
    if (!existsMessages) {
      this.client.indices.create({index: 'messages'})
        .then(() => {
          this.client.indices.putMapping({
            body: {
              properties: {
                content: {
                  type: 'text',
                },
                guild: {
                  type: 'integer'
                },
                timestamp: {
                  index: 'true',
                  type: 'date'
                },
                user: {
                  type: 'integer',
                }
              },
            },
            index: 'messages',
            timeout: '10s',
            type: 'message',
        });
      });
    }

    const existsUsers = await this.client.indices.exists({index: 'users'});
    if (!existsUsers) {
      this.client.indices.create({index: 'users'})
        .then(() => {
          this.client.indices.putMapping({
            body: {
              properties: {
                displayName: {
                  type: 'text',
                },
                userId: {
                  index: 'true',
                  type: 'integer',
                },
              },
            },
            index: 'users',
            timeout: '10s',
            type: 'user',
        });
      });
    }

    return;
  }

  

  /**
   * @param {Discord.Message} message
   * @param {Discord.PermissionResolvable} permission
   * @return {boolean}
   */
  private checkPermission(message: Discord.Message, permission: Discord.PermissionResolvable): boolean {
    let admins: IterableIterator<string>;
    for (let [, role] of message.guild.roles) {
      if (role.hasPermission(permission)) {
        admins = role.members.keys();
        break;
      }
    }

    for (let id of admins) {
      if (id === message.author.id) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   * @param {string[]} capitalCmds - Strings containing parameters
   */
  private addUserQuote(message: Discord.Message, capitalCmds: string[]) {
    this.Logger.setMethod(this.addUserQuote.name);
    const id = (this.Misc.matchMention(message.guild.members, capitalCmds.slice(2).join(' ')) as Discord.GuildMember).id;

    let lastMessage: Discord.Message;

    message.channel.fetchMessages({limit: 100})
      .then((entries) => {
        for (let msg of entries.values()) {
          if ((msg.author.id === id) && /!.*/i.test(msg.content) === false 
          && (isNullOrUndefined(lastMessage) || lastMessage.createdTimestamp.valueOf() < msg.createdTimestamp.valueOf())) {
            lastMessage = msg;
          }
        }

        const entry: Entry = {
          content: lastMessage.content,
          guild: lastMessage.guild.id,
          timestamp: lastMessage.createdAt,
          user: id,
        };

        this.client.index({
          body: JSON.stringify(entry),
          index: 'messages',
          type: 'message'
        });

        message.channel.send('Saved: ' + lastMessage.content)
          .catch((err) => this.Logger.error(err, 'Quote saved message'));
      })
      .catch((err) => this.Logger.error(err, 'Quote fetching'));
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   * @param {string[]} capitalCmds - Strings containing parameters
   */
  private searchQuote(message: Discord.Message, capitalCmds: string[]) {
    this.Logger.setMethod(this.searchQuote.name);

    const user = this.Misc.matchMention(message.guild.members, capitalCmds.slice(1).join(' '));
    this.Logger.verbose('Quote search result', 'Found matching member: ' + user.displayName + '@' + user.id);

    this.client.search({
      index: 'messages',
      body: esb.requestBodySearch()
              .query(esb.boolQuery()
                        .must(esb.termQuery('guild', message.guild.id))
                        .must(esb.termQuery('user', user.id))).toJSON()
    })
    .then((res) => {
      const index = Math.floor(Math.random() * res.hits.hits.length);

      const entry: Entry = res.hits.hits[index]._source as Entry;
      const member: Discord.GuildMember = message.guild.members.get(entry.user);
      const name: string = isNullOrUndefined(member.nickname) ? member.user.username : member.nickname;

      const quote: string = entry.content + '\n\tt. ' + name;

      message.channel.send(quote)
        .catch((err) => this.Logger.error(err, 'Search quote message'));
    });
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   * @param {string[]} capitalCmds - Strings containing parameters
   */
  private listQuotes(message: Discord.Message) {
    this.Logger.setMethod(this.listQuotes.name);

    if (this.checkPermission(message, 'ADMINISTRATOR')) {
      this.client.search({
        index: 'messages',
        body: esb.requestBodySearch()
                .query(esb.matchQuery('guild', message.guild.id)).toJSON()
      })
      .then((results) => {
        let list: string = '';
        for (let i = 0; i < results.hits.hits.length; i++) {
          const entry: Entry = results.hits.hits[i]._source as Entry;
          list += MISC.padRight(i + '. ', 5);
          list += MISC.padRight(message.guild.members.get(entry.user).displayName, 18);
          list += ' - \"' + entry.content + ' \"\n';
        }
      
        message.channel.send(list)
          .catch((err) => this.Logger.error(err, 'Quote list message'));
      });
    }
  }

  private randomQuote(message: Discord.Message) {
    this.Logger.setMethod(this.randomQuote.name);

    this.Logger.warn('Random Quote', 'You shouldn\'t be here');
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   * @param {string[]} cmds - Strings containing lowercased parameters
   * @param {string[]} capitalCmds - Strings containing parameters
   */
  public quote(message: Discord.Message, cmds: string[], capitalCmds: string[]) {
    if (cmds.length > 1) {
      switch (cmds[1]) {
        case 'add':
          this.addUserQuote(message, capitalCmds);
          break;
        case 'list':
          this.listQuotes(message);
          break;
        case 'ranking':
          this.memberQuoteTotal(message);
          break;
        case 'me':
          capitalCmds[1] = '<@' + message.author.id + '>';
          this.searchQuote(message, capitalCmds);
          break;
        default:
          this.searchQuote(message, capitalCmds);
      }
    } else {
      this.randomQuote(message);
    }
  }

  public addUser(memberName: string, memberId: Discord.Snowflake) {
    this.client.create({
      body: {
        displayName: memberName,
        userId: memberId,
      },
      index: 'users',
      type: 'user',
    });
  }

  public memberQuoteTotal(message: Discord.Message) {
    this.Logger.setMethod(this.memberQuoteTotal.name);

    let promises: Array<Promise<void>> = new Array();
    let quoteCounts: Discord.Collection<string, Pair<string, number>> = new Discord.Collection();

    message.guild.members.map((member, memberId) => {
      promises.push(
        this.client.count({
          index: 'messages',
          body: esb.requestBodySearch().query(esb.matchQuery('user', memberId)).toJSON()
        }).then((result) => {
          let name = isNullOrUndefined(member.nickname) ? member.user.username : member.nickname;
          this.Logger.info('Quote total', `Found ${result.count} results for ${name}`);
          quoteCounts.set(memberId, new Pair(name, result.count));
        })
      );
    });

    Promise.all(promises).then(() => {
      let result = '```';
      let i = 1;
      quoteCounts
        .filter((pair) => pair.second > 0)
        .sort((a,b) => a.second > b.second ? -1 : 1)
        .forEach(pair => {
          result += `${i}. ${Misc.padLeft(`(${pair.second.toString()})`, 5)} ${pair.first}\n`;
          i++;
        });
      result += '```';

      message.channel.send(result)
      .catch((err) => this.Logger.error(err, 'Quote count message'));
    });
  }
}