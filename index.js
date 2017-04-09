const Discord = require('discord.js');
const Fubuki = new Discord.Client();

var config = require('./config');
var booru = require('./booru.js')

Fubuki.on('ready', () => {
  console.log('I am ready!');
});

Fubuki.on('message', message => {
  var cmds = message.content.toLowerCase().split(' ');

  switch (cmds[0]) {
    case '!ping':
      console.log(cmds);
      message.channel.sendMessage('pong');
      break;
    case '!sleep':
      message.channel.sendMessage('Bye!');
      console.log('Bye!');
      Fubuki.destroy();
      process.exit(0);
    case '!booru':
      booru.getDanbooru(message, cmds);
      break;
    case '!b':
      booru.getDanbooru(message, cmds);
      break;
    case '!bsafe':
      var newCmd = cmds;
      newCmd.push('rating:safe');
      booru.getDanbooru(message, newCmd);
      break;
    case '!help':
      var helpText = 'The following commands are avalible to this bot:\n!ping Reply with "pong" if the bot is still functional.\n!booru [tags] or !b [tags] Returns a link to random Danbooru post with the given tags. If you have more than one tag, seperate them with a space.\n!bsafe [tags] Functions the same as !booru and !b, but appends "rating:safe" to your request automatically.\n!help The bot will DM you this help text.';
      message.channel.sendMessage('Help is on the way! Check your DMs.')
      message.author.sendMessage(helpText);
    default:
  }
});

Fubuki.on('disconnected', function() {
  console.log('Disconnected');
  process.exit(1);
});

Fubuki.login(config.discord_token);
