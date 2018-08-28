import * as pTimeout from 'p-timeout';
import * as elastic from 'elasticsearch';
import * as esb from 'elastic-builder';
import * as Discord from 'discord.js';

import LOGGER from '../util/Logger';
import config from '../config';
import { padRight } from './misc';

interface Entry {
  content: string
  guild: string
  timestamp: Date
  user: string
}

export default class Quote {
  private Logger: LOGGER;
  private client: elastic.Client;

  constructor() {
    this.Logger = new LOGGER('Quote');
    this.client = new elastic.Client({ hosts: ['http://localhost:9200' ]});

    pTimeout(this.openIndex(), config.MAXTIMEOUT);
  }

  /**
   * Creates the Elastic DB if it doesn't already exist
   */
  private async openIndex(): Promise<void> {
    const exists = await this.client.indices.exists({index: 'messages'});
    if (!exists) {
      this.client.indices.create({index: 'messages'})
        .then(() => {
          this.client.indices.putMapping({
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
    return;
  }

  /**
   * @param members {Discord.Collection<Discord.Snowflake, Discord.GuildMember>}
   * @param index {number} index - The index in cmds where this @mention is found
   * @param capitalCmds {string[]} capitalCmds - Strings containing parameters
   * @return {string} - The id of the member corresponding to this @mention
   */
  private matchMention(members: Discord.Collection<Discord.Snowflake, Discord.GuildMember>, index: number, capitalCmds: string[]) {
    const user = capitalCmds[index];
    let displayName, id: string;

    if (capitalCmds.length > index) {
      if (/<@.?\d+>/.test(user)) {
        const userId = user.replace(/\D/g,'');
        const member = members.get(userId);
        displayName = member.displayName;
        id = member.id;
      } else {
        displayName = capitalCmds.slice(index).join(' ');

        for (let [, member] of members) {
          if (member.displayName.toLowerCase() === displayName.toLowerCase()) {
            id = member.user.id;
            break;
          }
        }
      }
    }

    return id;
  }

  /**
   * @param message {Discord.Message}
   * @param permission {Discord.PermissionResolvable}
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
    const id = this.matchMention(message.guild.members, 2, capitalCmds);

    let lastMessage;

    message.channel.fetchMessages({limit: 100})
      .then((messages) => {
        for (let msg of messages.values()) {
          if ((msg.author.id === id) && /!.*/i.test(msg.content) === false) {
            lastMessage = msg;
            break;
          }
        }

        const entry: Entry = {
          content: lastMessage.content,
          guild: lastMessage.guild.id,
          timestamp: lastMessage.createdTimestamp,
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

    const userId = this.matchMention(message.guild.members, 1, capitalCmds);

    this.client.search({
      index: 'messages',
      body: esb.requestBodySearch()
              .query(esb.matchQuery('guild', message.guild.id))
              .query(esb.matchQuery('user', userId))
              .query(esb.functionScoreQuery().function(esb.randomScoreFunction())).toJSON()
    })
    .then((res) => {
      const entry: Entry = res.hits.hits[0]._source as Entry;
      const quote: string = entry.content + '\n\t\t.' + message.guild.members.get(entry.user).nickname;

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
        let list: string;
        for (let i = 0; i < results.hits.hits.length; i++) {
          const entry: Entry = results.hits.hits[i]._source as Entry;
          list += padRight(i + '. ', 5);
          list += padRight(message.guild.members.get(entry.user).displayName, 18);
          list += ' - \"' + entry.content + ' \"\n';
        }
      
        message.channel.send(list)
          .catch((err) => this.Logger.error(err, 'Quote list message'));
      });
    }
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   * @param {string[]} cmds - Strings containing lowercased parameters
   * @param {string[]} capitalCmds - Strings containing parameters
   */
  public quote(message: Discord.Message, cmds: string[], capitalCmds: string[]) {
    switch (cmds[1]) {
      case 'add':
        this.addUserQuote(message, capitalCmds);
        break;
      case 'list':
        this.listQuotes(message);
        break;
      default:
        this.searchQuote(message, capitalCmds);
    }
  }

  public addUser(memberName: string, memberId: Discord.Snowflake) {
    this.client.create({
      body: {
        displayName: memberName,
        userId: memberId,
      },
      index: 'users',
      type: 'users',
    });
  }
}