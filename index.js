const Discord = require('discord.js');
const Fubuki = new Discord.Client();

var config = require('./config');
var request = require('request-promise');

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
      var tagList = String(cmds.slice(1).join('+'));

      // Do NOT use qs: { ... }, it replaces '+' with '%20'
      var options = {
        method: 'GET',
        uri: config.danbooru_auth + 'posts.json?tags=' + tagList,
        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true
      }

      request(options)
        .then(function (body) {
          var arr_len = body.length;
          var selected_idx = Math.floor(Math.random() * (arr_len + 1));

          var tagsStr = 'tags: '.concat(tagList.split('+').join(', '));
          var imgUrl;
          if (body[selected_idx] != null) {
            imgUrl = config.danbooru_url.concat(body[selected_idx].file_url);
          } else {
            message.channel.sendMessage('Bad File Get');
            return console.error('Bad File Get');
          }
          message.channel.sendMessage(tagsStr.concat('\n', imgUrl));
      }).catch(function (err) {
        return console.error('Request Failed: ', err);
      });

    default:
  }
});

Fubuki.on('disconnected', function() {
  console.log('Disconnected');
  process.exit(1);
});

Fubuki.login(config.discord_token);
