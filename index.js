const DISCORD = require('discord.js');
const FUBUKI = new DISCORD.Client();

let config = require('./config');
let booru = require('./booru.js');
let remind = require('./remind.js');
let musicplayer = require('./musicplayer.js');
let misc = require('./misc.js');
let quote = require('./quote.js');

FUBUKI.on('ready', () => {
  console.log('Ready');
});

FUBUKI.on('message', message => {
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
      let newCmd = cmds;
      newCmd.push('rating:safe');
      booru.getDanbooru(message, newCmd);
      message.delete()
        .catch( reason => { console.log("Rejected Booru Delete Promise for " + reason); });
      break;
    case '!remindme':
      remind.remindMe(message);
      break;
    case '!play':
      musicplayer.play(message);
      message.delete()
        .then(msg => { console.log('Deleted message from ' + msg.author); })
        .catch( reason => { console.log("Rejected Music Delete Promise for " + reason); });
      break;
    case '!connect':
      musicplayer.connect(message.guild);
      break;
    case '!disconnect':
      musicplayer.disconnect(message.guild);
      break;
    case '!skip':
      musicplayer.skip(message);
      break;
    case '!repeat':
      musicplayer.repeat(message);
      break;
    case '!nowplaying':
      musicplayer.nowPlaying(message.channel);
      break;
    case '!radio':
      musicplayer.radio(message);
      message.delete()
        .then(msg => { console.log('Deleted message from ' + msg.author); })
        .catch( reason => { console.log("Rejected Radio Delete Promise for " + reason); });
      break;
    case '!stopradio':
      musicplayer.stopRadio();
      break;
    case '!urban':
      misc.urbanDefine(message, cmds);
      break;
    case '!a':
      misc.getAvatar(message, cmds[1]);
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
    case '!help':
      let helpText = 'The following commands are avalible to this bot:\n\n' +
        '!ping Reply with "pong" if the bot is still functional.\n\n' +
        '!booru [tags] or !b [tags] Returns a link to a random Danbooru post' +
          ' with the given tags. If you have more than one tag, seperate' +
          ' them with a space.\n\n' +
        '!bsafe [tags] Functions the same as !booru and !b, but appends' +
        ' "rating:safe" to your request automatically.\n\n' +
        '!help The bot will DM you this help text.\n\n' +
        '!remindme [Message] in [number] [hour(s)/minute(s)] and [number] ' +
          '[hour(s)/minute(s)] The bot will @ you after the specified time. ' +
          'You can omit the "and" and everything after if desired. ' +
          'Case does not matter.\n\n' +
        '!connect The bot joins the music channel.\n\n' +
        '!play [youtube link] The bot plays the selected link in ' +
          'the music channel. If it was already playing something ' +
          'your link is added to the queue.\n\n' +
        '!disconnect The bot leaves the music channel ' +
          'and clears the queue of links to playback.\n\n' +
        '!skip Skips the current song in the queue.\n\n' +
        '!repeat Repeats the current song being played. This will be ' +
          'the last song played if no songs are currently playing.\n\n' +
        '!urban [term] Replies with the definition and example from Urban ' +
          'Dictionary if it exists\n\n' +
        '!a [username] Returns a link to the user\'s avatar\n\n' +
        '!rate [text] Gives a rating from 1 to 10';
      message.channel.send('Help is on the way! Check your DMs.')
        .catch( reason => { console.log("Rejected Help Public Promise for " + reason); });
      message.author.send(helpText)
        .catch( reason => { console.log("Rejected Help DM Promise for " + reason); });
      break;
    default:
  }
});

FUBUKI.on('disconnected', function() {
  console.log('Disconnected');
  process.exit(1);
});

FUBUKI.login(config.discord_token);
