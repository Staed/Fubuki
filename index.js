const DISCORD = require('discord.js');
const FUBUKI = new DISCORD.Client();

let config = require('./config');
let booru = require('./booru.js');
let remind = require('./remind.js');
let music_player = require('./musicplayer.js');
let misc = require('./misc.js');
let quote = require('./quote.js');
let finance = require('./finance.js');

FUBUKI.on('ready', () => {
  config.id = FUBUKI.user.id;
  console.log('Ready as ' + config.id);
});

FUBUKI.on('message', message => {
  if (message.guild != undefined) {
    let cmds = message.content.toLowerCase().split(' ');

    switch (cmds[0]) {
      case '!ping':
        message.channel.send('pong')
          .then(console.log(cmds))
          .catch( reason => { console.log("Rejected Pong Promise for " + reason); });
        break;
      case '!sleep':
        message.channel.send('Logging off. Bye!')
          .then(console.log('Logging off.'))
          .catch( reason => { console.log("Rejected Sleep Promise for " + reason); });
        message.delete()
          .catch( reason => { console.log("Rejected Sleepe Delete Promise for " + reason); });
        setTimeout(function(){
          FUBUKI.destroy();
          process.exit(0);
        }, 500);
        break;
      case '!booru':
        booru.getDanbooru(message, cmds);
        message.delete()
          .catch( reason => { console.log("Rejected Booru Delete Promise for " + reason); });
        break;
      case '!b':
        booru.getDanbooru(message, cmds);
        message.delete()
          .catch( reason => { console.log("Rejected Booru Delete Promise for " + reason); });
        break;
      case '!bsafe':
        let new_cmd = cmds;
        new_cmd.push('rating:safe');
        booru.getDanbooru(message, new_cmd);
        message.delete()
          .catch( reason => { console.log("Rejected Booru Delete Promise for " + reason); });
        break;
      case '!remindme':
        remind.remindMe(message);
        break;
      case '!play':
        music_player.play(message);
        message.delete()
          .then(msg => { console.log('Deleted message from ' + msg.author); })
          .catch( reason => { console.log("Rejected Music Delete Promise for " + reason); });
        break;
      case '!connect':
        music_player.connect(message.guild);
        break;
      case '!disconnect':
        music_player.disconnect(message.guild);
        break;
      case '!skip':
        music_player.skip(message);
        break;
      case '!repeat':
        music_player.repeat(message);
        break;
      case '!nowplaying':
        music_player.nowPlaying(message.channel);
        break;
      case '!radio':
        music_player.radio(message);
        message.delete()
          .then(msg => { console.log('Deleted message from ' + msg.author); })
          .catch( reason => { console.log("Rejected Radio Delete Promise for " + reason); });
        break;
      case '!stopradio':
        music_player.stopRadio();
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
        if (cmds[1] !== 'fubuki' && cmds[2] !== "fubuki") {
          quote.quote(message, cmds, message.content.split(' '));
        } else {
          message.channel.send("I can't quote from myself dummy!")
            .then(function () {
              console.log("Refused to quote self");
            })
            .catch( reason => { console.log("Rejected Quote Fubuki Promise for " + reason); });
        }
        break;
      case '!stock':
        finance.getStock(message, cmds[1]);
        break;
      case '!delete':
        misc.deleteBooru(message);
        break;
      case '!help':
        message.channel.send('Help is on the way! Check your DMs.')
          .catch( reason => { console.log("Rejected Help Public Promise for " + reason); });
        message.author.send(config.help_text)
          .catch( reason => { console.log("Rejected Help DM Promise for " + reason); });
        break;
      default:
    }
  }
});

FUBUKI.on('disconnected', function() {
  console.log('Disconnected');
  process.exit(1);
});

FUBUKI.login(config.discord_token);
