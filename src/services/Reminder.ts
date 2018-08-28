import * as FlatQueue from 'flatqueue';
import * as Discord from 'discord.js';

import LOGGER from '../util/Logger';

interface Note {
  timestamp: Date
  text: string
  author: string
  guild: string
  channel: string
}

export default class Reminder {
  private Logger = new LOGGER('Reminder');
  private queue = new FlatQueue<number, Note>();

  private regex = new RegExp('.+?in[\\s]+(\\d+[\\s]+(hours(s)?|minute(s)?))? (and[\\s]+(\\d+[\\s](hour(s)?|minute(s)?)))?', 'ig');
  private hours = new RegExp('h(ou)?r(s?)', 'i');
  private minutes = new RegExp('min(ute)?(s?)', 'i');
  private seconds = new RegExp('s(ec(ond)?)?(s?)');
  
  /**
   * @param {Discord.Message} message 
   */
  public remindMe(message: Discord.Message) {
    this.Logger.setMethod(this.remindMe.name);

    if (!this.regex.test(message.content)) {
      message.channel.send(
          'That was the wrong format, please send it as such:\n' +
          '!remindme [Your reminder text] in [Number] [hour(s) or minute(s)]' + 
          ' and [Number] [minute(s) or hour(s)]\nYou can omit \"and\" and' +
          ' everything after it if desired. Case does not matter.')
        .catch((err) => this.Logger.error(err, 'Wrong format message'));
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
          } else if (this.seconds.test(timeArray[1])) {
            timer += Number.parseInt(timeArray[0]);
          }
        }
      }

      const text = message.content.replace(this.regex, '').split(' ').slice(1).join(' ');
      message.channel.send('Okay, I\'ll remind you of that in ' + timer/60 + ' minutes')
        .catch((err) => this.Logger.error(err, 'Reminder saved message'));

      const timestamp: Date = new Date(new Date().getTime() + timer*1000);
      const note: Note = {
        timestamp: timestamp,
        text: text,
        author: message.author.id,
        guild: message.guild.id,
        channel: message.channel.id
      } as Note;

      this.queue.push(timestamp, note);
    }
  }

  /**
   * @param client The Discord client the Bot is using
   */
  public async queueChecker(client: Discord.Client) {
    let top: Note = this.queue.peek();
    while (new Date().getTime().valueOf() > top.timestamp.valueOf()) {
      this.queue.pop();

      const guild = client.guilds.get(top.guild);
      const channel = guild.channels.get(top.channel) as Discord.TextChannel;
      const userId = guild.members.get(top.author).id;

      channel.send('Hey <@' + userId + '>, reminding you: ' + top.text)
        .then(() => this.Logger.verbose('Send Reminder', 'Sent a reminder to ' + guild.members.get(top.author).displayName))
        .catch((err) => this.Logger.error(err, 'Sending reminder mesage'));
      
      top = this.queue.peek();
    }
  }
}