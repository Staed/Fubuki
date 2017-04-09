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
      booru.getPost(message, cmds);
      break;
    case '!b':
      booru.getPost(message, cmds);
      break;
    case '!sb':
      var newCmd = cmds;
      newCmd.push('rating:safe');
      booru.getPost(message, newCmd);
      break;
    default:
  }
});

Fubuki.on('disconnected', function() {
  console.log('Disconnected');
  process.exit(1);
});

Fubuki.login(config.discord_token);
