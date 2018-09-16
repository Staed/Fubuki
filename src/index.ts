import * as DISCORD from 'discord.js';
import * as pTimeout from 'p-timeout';
const FUBUKI = new DISCORD.Client();

import config from './config';
import LOGGER from './util/Logger';
import { Booru, BooruBuilder } from './services/Booru';
import * as REMINDER from './services/Reminder';
import MUSICPLAYER from './services/MusicPlayer';
import MISC from './util/Misc';
import QUOTE from './services/Quote';
import FINANCE from './services/Finance';

import URBAN from './services/UrbanDictionary';
import ANIME from './services/Anime';

const MAXTIMEOUT = config.MAXTIMEOUT;

const Logger = new LOGGER('index');
const Danbooru: Booru = new BooruBuilder(config.use_shortener)
  .setShortenerUrl(config.google_url_shortener_url)
  .setGoogleApiKey(config.google_api_key)
  .setDanbooruAuth(config.danbooru_auth)
  .setDanbooruUrl(config.danbooru_url)
  .setDanbooruPath(config.danbooru_get)
  .build();

const Reminder = new REMINDER.default();
REMINDER.startReminder(Reminder, FUBUKI);

const MusicPlayer = new MUSICPLAYER();
const Misc = new MISC();
const Quote = new QUOTE();
const Finance = new FINANCE();

const Urban = new URBAN();
const Anime = new ANIME();

FUBUKI.on('ready', () => {
  Logger.setMethod('on ready');

  config.id = FUBUKI.user.id;
  Logger.verbose('Ready', 'Ready as ' + config.id);
});

FUBUKI.on('message', (message) => {
  Logger.setMethod('on message');

  if (message !== undefined && message.content !== undefined && message.content.charAt(0) === '!') {
    const cmds = message.content.toLowerCase().split(' ');

    pTimeout(features(message, cmds), MAXTIMEOUT)
      .catch((err) => Logger.error(err, 'features()'));
  }
});

/**
 * @param {DISCORD.Message} message A message object as defined in discord.js
 * @param {string[]} commands The string containing a request to Fubuki
 * @return {Promise<void>}
 */
function features(message: DISCORD.Message, commands: string[]): Promise<void> {
  Logger.setMethod('features');
  
  try {
   switch (commands[0]) {
      case '!ping':
        message.channel.send('pong')
          .then(() => Logger.verbose('ping', commands.join(' ')))
          .catch((reason) => Logger.info(reason, 'Ping message'));
        break;

      case '!sleep':
        message.channel.send('Logging off. Bye!')
          .then(() => Logger.verbose('sleep', 'Logging off'))
          .catch((reason) => Logger.info(reason, 'Sleep message'));
        message.delete()
          .catch((reason) => Logger.info(reason, 'Delete sleep message'));
        setTimeout(() => {
          FUBUKI.destroy();
          process.exit(0);
        }, 500);
        break;

      case '!booru':
        Danbooru.getDanbooru(message, commands);
        message.delete()
          .catch((reason) => Logger.info(reason, 'Delete booru message'));
        break;

      case '!b':
        Danbooru.getDanbooru(message, commands);
        message.delete()
          .catch((reason) => Logger.info(reason, 'Delete booru alias message'));
        break;

      case '!bsafe':
        let newCmd = commands;
        newCmd.push('rating:safe');
        Danbooru.getDanbooru(message, newCmd);
        message.delete()
          .catch((reason) => Logger.info(reason, 'Delete booru-safe message'));
        break;

      case '!delete':
        Danbooru.deleteBooru(message);
        break;

      case '!remindme':
        Reminder.remindMe(message);
        break;

      case '!play':
        try{
          MusicPlayer.play(message);
        } catch (err) { Logger.error(err, 'MusicPlayer Play') }
        message.delete()
          .then((msg: DISCORD.Message) => Logger.verbose('delete', 'Deleted !play message from ' + msg.author.username))
          .catch((reason) => Logger.info(reason, 'Delete play message'));
        break;

      case '!connect':
        MusicPlayer.connect(message.guild);
        break;

      case '!disconnect':
        MusicPlayer.disconnect(message.guild);
        break;

      case '!skip':
        MusicPlayer.skip(message);
        break;

      case '!repeat':
        MusicPlayer.repeat(message);
        break;

      case '!nowplaying':
        MusicPlayer.nowPlaying(message.channel as DISCORD.TextChannel);
        break;

      case '!radio':
        MusicPlayer.radio(message);
        if (/youtube.com/.test(message.content)) {
          message.delete()
            .then( (msg) => {
              Logger.verbose('delete', 'Deleted !radio message from ' + msg.author);
            })
            .catch((reason) => Logger.info(reason, 'Delete radio message'));
        }
        break;

      case '!stopradio':
        MusicPlayer.stopRadio(message.guild);
        break;

      case '!urban':
        Urban.getDefinition(message, commands);
        break;

      case '!avatar':
        Misc.getAvatar(message, commands);
        break;

      case '!a':
        Misc.getAvatar(message, commands);
        break;

      case '!coinflip':
        Misc.coinFlip(message);
        break;

      case '!rate':
        Misc.rate(message, commands);
        break;

      case '!quote':
        if (commands[1] !== 'fubuki' && commands[2] !== 'fubuki') {
          Quote.quote(message, commands, message.content.split(' '));
        } else {
          message.channel.send('I\'m not going to quote myself!')
            .then(() => Logger.verbose('misuse', 'Refused to quote self'))
            .catch((reason) => Logger.info(reason, 'Self-Quote message'));
        }
        break;

      case '!stock':
        if (commands[1] == undefined || commands[2] == undefined) {
          let badText = 'You need to specify which market API ' +
              ' (bloomberg/google/yahoo) and company ticker name';
          message.channel.send(badText)
            .catch((reason) => Logger.info(reason, 'Stock message'));
        } else {
          Finance.getStock(message, commands[1], commands[2].toUpperCase());
        }
        break;

      case '!choose':
        Misc.choose(message);
        break;

      case '!roll':
        Misc.roll(message);
        break;

      case '!season':
        Anime.season(message);
        break;

      case '!aninfo':
        Anime.aninfo(message);
        break;

      case '!help':
        message.channel.send('Help is on the way! Check your DMs.')
          .catch((reason) => Logger.info(reason, 'Help message'));

        message.author.send(config.help_text1)
          .catch((reason) => Logger.info(reason, 'Help DM - 1 of 2'));
        message.author.send(config.help_text2)
          .catch((reason) => Logger.info(reason, 'Help DM - 2 of 2'));
        break;

      default:
    }

    return new Promise((resolve, reject) => resolve());
  } catch (err) {
    Logger.warn(err, 'Command processing failed');
    return new Promise((resolve, reject) => reject(err));
  }
};

FUBUKI.on('guildMemberAdd', async (member) => {
  Quote.addUser(member.displayName, member.id);
});

FUBUKI.on('disconnected', () => {
  Logger.setMethod('on disconnected');
  
  Logger.info('disconnect', 'Disconnected');
  process.exit(1);
});

pTimeout(FUBUKI.login(config.discord_token), MAXTIMEOUT)
  .catch((err) => console.log(err));
