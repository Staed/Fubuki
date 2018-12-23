/**
 * This file (misc.js) contains miscellaneous methods,
 * usually entirely self-contained. They are put here
 * since they do not require their own specific file for readability
 */

import * as request from 'request-promise';
import * as Discord from 'discord.js';

import config from '../config';
import LOGGER from './Logger';
import { isNullOrUndefined } from 'util';

export default class Misc {
  private Logger = new LOGGER('Misc');

  /**
   * @param {string} orig - The original string
   * @param {number} targetLength - The string's  minimum length once padded
   * @return {string} - The original string with the padding added
   */
  public static padRight(orig: string, targetLength: number): string {
    let text = orig;
    while (text.length < targetLength) {
      text += ' ';
    }
    return text;
  }

  /**
   * @param {string} orig - The original string
   * @param {number} targetLength - The string's  minimum length once padded
   * @return {string} - The original string with the padding added
   */
  public static padLeft(orig: string, targetLength: number): string {
    let text = orig;
    while (text.length < targetLength) {
      text = ' ' + text;
    }
    return text;
  }
  
  /**
   * @param {Discord.Collection<Discord.Snowflake, Discord.GuildMember>} members
   * @param {number} index - The index in cmds where this @mention is found
   * @param {string[]} capitalCmds - Strings containing parameters
   * @return {Discord.GuildMember} - The member corresponding to this @mention
   */
  public matchMention(members: Discord.Collection<Discord.Snowflake, Discord.GuildMember>, user: string): Discord.GuildMember {
    let displayName: string;
    let guildMember: Discord.GuildMember;

    if (/<@.?\d+>/.test(user)) {
      const userId = user.replace(/\D/g,'');
      const member = members.get(userId);
      displayName = member.displayName;
      guildMember = member;
    } else {
      displayName = user;

      for (let [, member] of members) {
        if (member.displayName.toLowerCase() === displayName.toLowerCase()) {
          guildMember = member;
          break;
        }
      }
    }

    return guildMember;
  }

  /**
   * @param {string} hostname
   * @param {string} path
   * @param {string} tags - The parameter and value
   * @return {request.Options} - The options used in sending a Request
   */
  public getOptions(hostname: string, path: string, tags: string): request.Options {
    this.Logger.setMethod(this.getOptions.name); 
    this.Logger.verbose('request', 'Received request for: ' + path + tags);
    
    // Do NOT use qs: { ... }, it replaces '+' with '%20'
    return {
      method: 'GET',
      uri: hostname + path + tags,
      json: true,
    } as request.Options;
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   * @param {string[]} cmds - String[] containing "!a" and a user id or username
   */
  public getAvatar(message: Discord.Message, cmds: string[]) {
    const func = 'getAvatar';

    if (cmds[1] === undefined) {
      this.Logger.verbose('undefined', 'Getting username');
      message.channel.send('You need to specify who\'s avatar I am looking for!')
        .catch((reason) => this.Logger.info(reason, 'Reject username message'));
    } else {
      const user = cmds.slice(1).join(' ');
      this.Logger.verbose('Initating user avatar search', 'Looking for: ' + user);

      const member: Discord.GuildMember = this.matchMention(message.guild.members, user);
      let avatarUrl = member.user.displayAvatarURL;
      this.Logger.verbose('Found user avatar', 'Found ' + member.user.username + '\'s avatar at ' + avatarUrl);

      if (avatarUrl) {
        avatarUrl = avatarUrl.replace('jpg', 'png');
        message.channel.send(avatarUrl)
          .catch((reason) => this.Logger.info(reason,'Reject avatar message'));
      } else {
        this.Logger.verbose('undefined', 'Could not find member ' + user);
        message.channel.send('I couldn\'t find that member!')
          .catch((reason) => this.Logger.info(reason, 'Reject avatar null'));
      }
    }
  }

  /**
  * @param {Discord.Message} message - A message object as defined in discord.js
  */
  public coinFlip(message: Discord.Message) {
    this.Logger.setMethod(this.coinFlip.name);

    let coin: string;
    const flip = Math.floor(Math.random() * 100 + 1);

    if (flip < 50) {
      coin = 'tails';
    } else if (flip > 50) {
      coin = 'heads';
    } else {
      message.channel.send('Uhm... the coin landed on its side, flipping again.')
        .catch( (reason) => this.Logger.info(reason, 'Reject side message'));
      message.channel.send('!coinflip')
        .catch( (reason) => this.Logger.info(reason, 'Reject flip again message'));
      return;
    }
    message.channel.send('You flipped **' + coin + '**')
      .catch( (reason) => this.Logger.info(reason, 'Rejected flip message'));
  }

  /**
    *  @param {Discord.Message} message - A message object as defined in discord.js
    *  @param {string[]} cmds - Strings that need to be joined and rated
    * Consider replacing the random function with another thing,
    * maybe tied to stocks or time
    */
  public rate(message: Discord.Message, cmds: string[]) {
    this.Logger.setMethod(this.rate.name);

    const str = message.content.split(' ').slice(1).join(' ');
    const rating = this.rateAlgorithm(str);

    if (str.toLowerCase() == 'staed') {
      message.channel.send('Staeds are great! I\'ll give Staed a 10/10!')
        .catch( (reason) => this.Logger.info(reason, 'Reject rate Staed message'));
      this.Logger.verbose('', 'Rated a Staed');
    } else if (str.toLowerCase() == 'sawai') {
      message.channel.send('Sawais are :put_litter_in_its_place: I\'ll give Sawai a 0/10')
        .catch( (reason) => this.Logger.info(reason, 'Reject rate Sawai message'));
      this.Logger.verbose('', 'Rated a Sawai');
    } else {
      this.Logger.verbose('', 'Rated ' + str + ' as ' + rating + '/10');
      message.channel.send('I\'d rate ' + str + ' ' + rating + '/10')
        .catch( (reason) => this.Logger.info(reason, 'Reject rate message'));
    }
  }

  /**
   * @param {string} text - A string containing the thing to be rated
   * @return {number} - A number between 1 and 10 inclusive
   */
  private rateAlgorithm(text: string): number {
    return Math.floor(Math.random() * 10 + 1);
  }

  /**
   * @param {Discord.Message} message - A message object as defined by discord.js
   */
  public choose(message: Discord.Message) {
    this.Logger.setMethod(this.choose.name);

    // Weighted Choosing (#1#)
    // Defaults to 1 per choice
    let result ='';
    let probability = [];
    let totalWeight = 0;

    const choices = message.content.split('!choose ')[1].split('|');
    for (let element of choices) {
      let value = /[^#]+(?!#\d+#)/i.exec(element)[0].trim();

      let frequency = 1;
      if (/#\d+#/i.test(element)) {
        frequency = parseInt(/#\d+#/i.exec(element)[0].replace(/#/g, ''));
      }

      probability.push([value, totalWeight + frequency]);
      totalWeight += frequency;
    }

    let index = Math.floor(Math.random() * totalWeight);
    for (let element of probability) {
      if (element[1] > index) {
        result = element[0];
        break;
      }
    }

    message.channel.send(result)
      .catch( (reason) => this.Logger.info(reason, 'Reject choose'));
  }

  /**
   * @param {Discord.Message} message - A message object as defined by discord.js
   */
  public roll(message: Discord.Message) {
    this.Logger.setMethod(this.roll.name);

    let rollInfo = message.content.replace('!roll ', '');

    let diceRegex = /(\d+D\d+(\s*\+\s)*)+\d*(\s*\+\s*\d*)*/i;
    if (!diceRegex.test(rollInfo) || /[^\d\s\+\-d]/i.test(rollInfo)) {
      message.channel.send(
        'That was the wrong format, please use this format: ' +
        '2D8 + 1D10 - 3D1 + 5 + -7 : where all the dice rolled are on the ' +
        'left side and all the constants on the right side. ' +
        'Case does not matter.'
      )
      .catch( (reason) => this.Logger.info(reason, 'Reject roll'));
    } else {
      let rollSum = 0;
      let constantSum = 0;

      const dice: string = /(\d+D\d+\s*[\+\-]*\s*)+/i.exec(rollInfo)[0];
      const diceArray: string[] = dice.replace('-', '+-').split('+');

      for (let element of diceArray) {
        if (element.trim().length < 1) {
          continue;
        }

        let num: string, sides: string;
        [num, sides] = element.replace(' ', '').split(/d/i);

        let sign = 1;
        if (/\-/.test(num)) {
          sign = -1;
        }
        num = num.replace('-', '');

        for (let i = 0; i < Number.parseInt(num); i++) {
          rollSum += sign * (Math.floor(Math.random() * (Number.parseInt(sides) - 1)) + 1);
        }
      }

      const constantRegex = /([\+\-]\s*\-?\s*\d+\s*)+(?!d)/i;
      const constantString = constantRegex.exec(rollInfo);
      let constant: string[];

      if (isNullOrUndefined(constantString) || constantString.length === 0) {
        constant = ['0'];
      } else {
        constant = constantString[0].split(/\+/);
      }

      for (let element of constant) {
        if (element.trim().length < 1) {
          continue;
        }
        let val = element.replace(' ', '');
        val = /[\+\-]?\s*\d/.exec(val)[0];

        constantSum += parseInt(val, 10);
      }
      let result = (rollSum + constantSum).toString();

      message.channel.send('You rolled a ' + result)
        .catch( (reason) => this.Logger.info(reason, 'Failed roll'));
    }
  }
}




