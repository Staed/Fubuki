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

    switch (cmds[0]) {
      case '!ping':
        message.channel.send('pong')
          .then(console.log(cmds))
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
            console.log('Rejected Sleepe Delete Promise for ' + reason);
          });
        setTimeout( () => {
          FUBUKI.destroy();
          process.exit(0);
        }, 500);
        break;
      case '!booru':
        booru.getDanbooru(message, cmds);
        message.delete()
          .catch( (reason) => {
            console.log('Rejected Booru Delete Promise for ' + reason);
          });
        break;
      case '!b':
        booru.getDanbooru(message, cmds);
        message.delete()
          .catch( (reason) => {
            console.log('Rejected Booru Delete Promise for ' + reason);
          });
        break;
      case '!bsafe':
        let newCmd = cmds;
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
        message.delete()
          .then( (msg) => {
            console.log('Deleted message from ' + msg.author);
          })
          .catch( (reason) => {
            console.log('Rejected Radio Delete Promise for ' + reason);
          });
        break;
      case '!stopradio':
        musicPlayer.stopRadio();
        break;
      case '!urban':
        misc.urbanDefine(message, cmds);
        break;
      case '!a':
        misc.getAvatar(message, cmds);
        break;
      case '!coinflip':
        misc.coinFlip(message);
        break;
      case '!rate':
        misc.rate(message, cmds);
        break;
      case '!quote':
        if (cmds[1] !== 'fubuki' && cmds[2] !== 'fubuki') {
          quote.quote(message, cmds, message.content.split(' '));
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
        if (cmds[1] == undefined || cmds[2] == undefined) {
          let badText = 'You need to specify which market API ' +
              ' (bloomberg/google/yahoo) and company ticker name';
          message.channel.send(badText)
            .catch( (reason) => {
              console.log('Rejected Stock BadParams Promise for ' + reason);
            });
        } else {
          finance.getStock(message, cmds[1], cmds[2].toUpperCase());
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
      default:
    }
  }
});

FUBUKI.on('disconnected', () => {
  console.log('Disconnected');
  process.exit(1);
});

FUBUKI.login(config.discord_token);
