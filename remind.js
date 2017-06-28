function remindMe(message) {
  if (!/^(!remindme)[\s\S]+?(in)[\s]+(\d+[\s]+(hour(s)?|minute(s)?))?([\s](and)[\s]+)?(\d+[\s](hour(s)?|minute(s)?))?[\s]*$/ig.test(message.content)) {
    message.channel.sendMessage('That was the wrong format, please send ' +
        'it as such:\n' +
      '!remind me [Your reminder text] in [Number] [hour(s) or minute(s)]' +
      ' and [Number] [minute(s) or hour(s)]\n' +
      'You can omit "and" and everything after it if desired.' +
      'Case does not matter.')
  }
  let matched_strings = message.content.match(/\d+[\s]+((hour(s)?)|(minute(s)?))/ig);
  console.log('Reminder to ' + message.author.username
    + ' in ' + matched_strings.join(' '));

  let remind_timer = 0;
  for (let elem of matched_strings) {
    let time_arr = elem.split(' ');
    if (time_arr.length < 2) {
      console.log('Bad Time match in time_arr from !remindme');
      return;
    }

    if (time_arr[1] === 'hour' || time_arr[1] === 'hours') {
      remind_timer += 3600 * time_arr[0];
    } else if (time_arr[1] === 'minute' || time_arr[1] === 'minutes') {
      remind_timer += 60 * time_arr[0];
    }
  }
  let remind_text = message.content.replace(/([\s]+in[\s]+\d+[\s]+(hour(s)?|minute(s)?))([\s](and)[\s]+)?(\d+[\s](hour(s)?|minute(s)?))?[\s]*$/ig, '');
  remind_text = remind_text.split(' ').slice(1).join(' ');

  message.channel.sendMessage('Okay, I\'ll remind you of that in '
    + remind_timer/60 + " minutes");
  setTimeout(function(){
    message.reply("reminding you: " + remind_text)
      .then(msg => console.log('Sent a reminder to ' + msg.author.username))
      .catch(console.error);
  }, remind_timer*1000);
}

module.exports = {remindMe};
