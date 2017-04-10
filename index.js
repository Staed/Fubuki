const DISCORD = require('discord.js');
const FUBUKI = new DISCORD.Client();

let config = require('./config');
let booru = require('./booru.js');
let remind = require('./remind.js');
let musicplayer = require('./musicplayer.js');

FUBUKI.on('ready', () => {
  console.log('Ready');
});

FUBUKI.on('message', message => {
  let cmds = message.content.toLowerCase().split(' ');

  switch (cmds[0]) {
    case '!ping':
      message.channel.sendMessage('pong')
        .then(console.log(cmds));
      break;
    case '!sleep':
      message.channel.sendMessage('Logging off. Bye!')
        .then(console.log('Logging off.'));
      setTimeout(function(){
        FUBUKI.destroy();
        process.exit(0);
      }, 500);
      break;
    case '!booru':
      booru.getDanbooru(message, cmds);
      break;
    case '!b':
      booru.getDanbooru(message, cmds);
      break;
    case '!bsafe':
      let newCmd = cmds;
      newCmd.push('rating:safe');
      booru.getDanbooru(message, newCmd);
      break;
    case '!remindme':
      remind.remindMe(message);
      break;
    case '!play':
      musicplayer.play(message);
      message.delete()
        .then(msg => console.log('Deleted message from ' + msg.author))
        .catch(console.log("Failed to delete message: " + message.content));
      break;
    case '!connect':
      musicplayer.connect(message.guild);
      break;
    case '!disconnect':
      musicplayer.disconnect(message.guild);
      break;
    case '!remindme':
      remind.remindMe(message);
      break;
    case '!play':
      musicplayer.play(message);
      break;
    case '!connect':
      musicplayer.connect(message.guild);
      break;
    case '!disconnect':
      musicplayer.disconnect(message.guild);
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
          'Case does not matter.';
      message.channel.sendMessage('Help is on the way! Check your DMs.')
      message.author.sendMessage(helpText);
      break;
    default:
  }
});

FUBUKI.on('disconnected', function() {
  console.log('Disconnected');
  process.exit(1);
});

FUBUKI.login(config.discord_token);
