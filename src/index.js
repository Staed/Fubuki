const DISCORD = require('discord.js');
const FUBUKI = new DISCORD.Client();

let config = require('../config');
let log = require('./logger.js');
let booru = require('./booru.js');
let remind = require('./remind.js');
let musicPlayer = require('./musicplayer.js');
let misc = require('./misc.js');
let quote = require('./quote.js');
let finance = require('./finance.js');

let curFile = 'index.js';

FUBUKI.on('ready', () => {
  log.info(curFile, 'on ready', 'File found');
  config.id = FUBUKI.user.id;
  log.verbose('ready', curFile, 'on ready', 'Ready as ' + config.id);
});

FUBUKI.on('message', (message) => {
  if (message.guild != undefined) {
    let cmds = message.content.toLowerCase().split(' ');

    features(message, cmds);
  }
});

/**
 * @param {*} message A message object as defined in discord.js
 * @param {*} commands The string containing a request to Fubuki
 */
async function features(message, commands) {
  let func = 'features';

  try {
    switch (commands[0]) {
      case '!ping':
        message.channel.send('pong')
          .then(
            log.verbose('ping', curFile, func, commands)
          )
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject pong');
          });
        break;
      case '!sleep':
        message.channel.send('Logging off. Bye!')
          .then( () => {
            log.verbose('sleep', curFile, func, 'Logging off');
          })
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject sleep');
          });
        message.delete()
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject delete sleep');
          });
        setTimeout( () => {
          FUBUKI.destroy();
          process.exit(0);
        }, 500);
        break;
      case '!booru':
        booru.getDanbooru(message, commands);
        message.delete()
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Rejected booru');
          });
        break;
      case '!b':
        booru.getDanbooru(message, commands);
        message.delete()
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject booru alias');
          });
        break;
      case '!bsafe':
        let newCmd = commands;
        newCmd.push('rating:safe');
        booru.getDanbooru(message, newCmd);
        message.delete()
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject booru option safe');
          });
        break;
      case '!remindme':
        remind.remindMe(message);
        break;
      case '!play':
        musicPlayer.play(message);
        message.delete()
          .then( (msg) => {
            log.verbose('delete', curFile, func,
                        'Deleted message from ' + msg.author);
          })
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject music');
          });
        break;
      case '!connect':
        musicPlayer.connect(message.guild);
        break;
      case '!disconnect':
        musicPlayer.disconnect(message.guild);
        break;
      case '!skip':
        musicPlayer.skip(message);
        break;
      case '!repeat':
        musicPlayer.repeat(message);
        break;
      case '!nowplaying':
        musicPlayer.nowPlaying(message.channel);
        break;
      case '!radio':
        musicPlayer.radio(message);
        if (/youtube.com/.test(message.content)) {
          message.delete()
            .then( (msg) => {
              log.verbose('delete', curFile, func,
                          'Deleted message from ' + msg.author);
            })
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject radio');
            });
        }
        break;
      case '!stopradio':
        musicPlayer.stopRadio(message.guild);
        break;
      case '!urban':
        misc.urbanDefine(message, commands);
        break;
      case '!avatar':
        misc.getAvatar(message, commands);
        break;
      case '!a':
        misc.getAvatar(message, commands);
        break;
      case '!coinflip':
        misc.coinFlip(message);
        break;
      case '!rate':
        misc.rate(message, commands);
        break;
      case '!quote':
        if (commands[1] !== 'fubuki' && commands[2] !== 'fubuki') {
          quote.quote(message, commands, message.content.split(' '));
        } else {
          message.channel.send('I can\'t quote from myself dummy!')
            .then( () => {
              log.verbose('misuse', curFile, func,
                          'Refused to quote self');
            })
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject quote fubuki');
            });
        }
        break;
      case '!stock':
        if (commands[1] == undefined || commands[2] == undefined) {
          let badText = 'You need to specify which market API ' +
              ' (bloomberg/google/yahoo) and company ticker name';
          message.channel.send(badText)
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject stock');
            });
        } else {
          finance.getStock(message, commands[1], commands[2].toUpperCase());
        }
        break;
      case '!delete':
        misc.deleteBooru(message);
        break;
      case '!choose':
        misc.choose(message);
        break;
      case '!roll':
        misc.roll(message);
        break;
      case '!season':
        misc.season(message);
        break;
      case '!aninfo':
        misc.aninfo(message);
        break;
      case '!help':
        message.channel.send('Help is on the way! Check your DMs.')
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject help');
          });

        message.author.send(config.help_text1)
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject help DM part 1');
          });
        message.author.send(config.help_text2)
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject help DM part 2');
          });
        break;
      default:
    }
  } catch (err) {
    log.warn(err, curFile, func, 'Command processing failed');
  }
};

FUBUKI.on('disconnected', () => {
  info.verbose('disconnect', curFile, 'on disconnected', 'Disconnected');
  process.exit(1);
});

FUBUKI.login(config.discord_token)
  .catch( (reason) => {
    log.error(reason, curFile, 'login', 'Failed to login');
  });
