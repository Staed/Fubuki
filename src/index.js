const DISCORD = require('discord.js');
const FUBUKI = new DISCORD.Client();

let config = require('../config');
let booru = require('./booru.js');
let remind = require('./remind.js');
let musicPlayer = require('./musicplayer.js');
let misc = require('./misc.js');
let quote = require('./quote.js');
let finance = require('./finance.js');

FUBUKI.on('ready', () => {
  config.id = FUBUKI.user.id;
  console.log('Ready as ' + config.id);
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
  try{
	  switch (commands[0]) {
      case '!ping':
        message.channel.send('pong')
          .then(console.log(commands))
          .catch( (reason) => {
            console.log('Rejected Pong Promise for ' + reason);
          });
        break;
      case '!sleep':
        message.channel.send('Logging off. Bye!')
          .then(console.log('Logging off.'))
          .catch( (reason) => {
            console.log('Rejected Sleep Promise for ' + reason);
          });
        message.delete()
          .catch( (reason) => {
            console.log('Rejected Sleep Delete Promise for ' + reason);
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
            console.log('Rejected Booru Delete Promise for ' + reason);
          });
        break;
      case '!b':
        booru.getDanbooru(message, commands);
        message.delete()
          .catch( (reason) => {
            console.log('Rejected Booru Delete Promise for ' + reason);
          });
        break;
      case '!bsafe':
        let newCmd = commands;
        newCmd.push('rating:safe');
        booru.getDanbooru(message, newCmd);
        message.delete()
          .catch( (reason) => {
            console.log('Rejected Booru Delete Promise for ' + reason);
          });
        break;
      case '!remindme':
        remind.remindMe(message);
        break;
      case '!play':
        musicPlayer.play(message);
        message.delete()
          .then( (msg) => {
            console.log('Deleted message from ' + msg.author);
          })
          .catch( (reason) => {
            console.log('Rejected Music Delete Promise for ' + reason);
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
              console.log('Deleted message from ' + msg.author);
            })
            .catch( (reason) => {
              console.log('Rejected Radio Delete Promise for ' + reason);
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
              console.log('Refused to quote self');
            })
            .catch( (reason) => {
              console.log('Rejected Quote Fubuki Promise for ' + reason);
            });
        }
        break;
      case '!stock':
        if (commands[1] == undefined || commands[2] == undefined) {
          let badText = 'You need to specify which market API ' +
              ' (bloomberg/google/yahoo) and company ticker name';
          message.channel.send(badText)
            .catch( (reason) => {
              console.log('Rejected Stock BadParams Promise for ' + reason);
            });
        } else {
          finance.getStock(message, commands[1], commands[2].toUpperCase());
        }
        break;
      case '!delete':
        misc.deleteBooru(message);
        break;
      case '!help':
        message.channel.send('Help is on the way! Check your DMs.')
          .catch( (reason) => {
            console.log('Rejected Help Public Promise for ' + reason);
          });
        message.author.send(config.help_text)
          .catch( (reason) => {
            console.log('Rejected Help DM Promise for ' + reason);
          });
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
      default:
    }
  }
  catch (err) {
    console.log('Command Processing Failed because ', err);
  }
};

FUBUKI.on('disconnected', () => {
  console.log('Disconnected');
  process.exit(1);
});

FUBUKI.login(config.discord_token)
  .catch( (reason) => {
    console.log('Failed to login because ' + reason);
  });
