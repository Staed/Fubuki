import * as std from 'tstl';
import * as Discord from 'discord.js';

import LOGGER from '../util/Logger';
import { isNullOrUndefined } from 'util';

interface Note {
  timestamp: number
  text: string
  author: string
  guild: string
  channel: string
}

export default class Reminder {
  private Logger = new LOGGER('Reminder');
  private queue = new std.PriorityQueue<Note>((a,b) =>  std.less(b.timestamp, a.timestamp));

  private regex = new RegExp(/^!remindme [\S\s]+ in \d+ (hour(s?)|minute(s?))( and \d+ (hour(s?)|minute(s?)))?$/ig);
  private filter = new RegExp(/ in \d+ (hour(s?)|minute(s?))( and \d+ (hour(s?)|minute(s?)))?$/ig);
  private command = new RegExp(/!remindme /);
  private hours = new RegExp(/hour(s?)/i);
  private minutes = new RegExp(/minute(s?)/i);
  
  /**
   * @param {Discord.Message} message 
   */
  public remindMe(message: Discord.Message) {
    this.Logger.setMethod(this.remindMe.name);

    // The double regex test is a hack to solve an issue where it will occasionally 
    // return false and then true for all other tries
    if (!this.regex.test(message.content) && !this.regex.test(message.content)) {
      message.channel.send(
          'That was the wrong format, please send it as such:\n' +
          '!remindme [Your reminder text] in [Number] [hour(s) or minute(s)]' + 
          ' and [Number] [minute(s) or hour(s)]\nYou can omit \"and\" and' +
          ' everything after it if desired. Case does not matter.')
        .catch((err) => this.Logger.error(err, 'Wrong format message'));
      this.Logger.warn('Incorrect Reminder', 'Received ' + message.content)
    } else {
      const matchedStrings = message.content.match(/\d+[\s]+((hour(s)?)|(minute(s)?))/ig);
      this.Logger.verbose('Set reminder', 'Set to ' + message.author.username + ' in ' + matchedStrings.join(' '));

      let timer: number = 0;
      for (let elem of matchedStrings) {
        const timeArray = elem.split(' ');
        if (timeArray.length < 2) {
          this.Logger.verbose('Bad Match', 'Bad time match in timeArray');
          return;
        } else {
          if (this.hours.test(timeArray[1])) {
            timer += 3600 * Number.parseInt(timeArray[0]);
          } else if (this.minutes.test(timeArray[1])) {
            timer += 60 * Number.parseInt(timeArray[0]);
          }
        }
      }

      const text = message.content.replace(this.command, '').replace(this.filter, '');
      message.channel.send('Okay, I\'ll remind you of that in ' + timer/60 + ' minutes')
        .catch((err) => this.Logger.error(err, 'Reminder saved message'));

      const timestamp: number = new Date(new Date().getTime() + timer*1000).getTime().valueOf();
      const note: Note = {
        timestamp: timestamp,
        text: text,
        author: message.author.id,
        guild: message.guild.id,
        channel: message.channel.id
      } as Note;

      this.queue.push(note);
    }
  }

  /**
   * @param client The Discord client the Bot is using
   */
  public async queueChecker(client: Discord.Client) {
    let top: Note = this.queue.top();

    while (this.nullOrUndefinedCheckerForDateNote(top) && new Date().getTime().valueOf() > top.timestamp) {
      this.queue.pop();

      const guild = client.guilds.get(top.guild);
      const channel = guild.channels.get(top.channel) as Discord.TextChannel;
      const userId = guild.members.get(top.author).id;

      channel.send('Hey <@' + userId + '>, reminding you: ' + top.text)
        .then(() => this.Logger.verbose('Send Reminder', 'Sent a reminder to ' + guild.members.get(top.author).displayName))
        .catch((err) => this.Logger.error(err, 'Sending reminder mesage'));
      
      top = this.queue.top();
    }
  }

  private nullOrUndefinedCheckerForDateNote(top: Note): boolean {
    return !isNullOrUndefined(top) && !isNullOrUndefined(top.timestamp);
  }
}

export function startReminder(reminder: Reminder, client: Discord.Client): void {
  setInterval(() => reminder.queueChecker(client), 1000);
}