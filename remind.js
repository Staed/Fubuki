function remindMe(message) {
  if (!/^(!remindme)[\s\S]+?(in)[\s]+(\d+[\s]+(hour(s)?|minute(s)?))?([\s](and)[\s]+)?(\d+[\s](hour(s)?|minute(s)?))?[\s]*$/ig.test(message.content)) {
    message.channel.sendMessage('That was the wrong format, please send ' +
        'it as such:\n' +
      '!remind me [Your reminder text] in [Number] [hour(s) or minute(s)]' +
      ' and [Number] [minute(s) or hour(s)]\n' +
      'You can omit "and" and everything after it if desired.' +
      'Case does not matter.')
  }
  let matchedStrings = message.content.match(/\d+[\s]+((hour(s)?)|(minute(s)?))/ig);
  console.log('Reminder to ' + message.author.username
    + ' in ' + matchedStrings.join(' '));

  let remindTimer = 0;
  for (let elem of matchedStrings) {
    let timeArr = elem.split(' ');
    if (timeArr.length < 2) {
      console.log('Bad Time match in timeArr from !remindme');
      return;
    }

    if (timeArr[1] === 'hour' || timeArr[1] === 'hours') {
      remindTimer += 3600 * timeArr[0];
    } else if (timeArr[1] === 'minute' || timeArr[1] === 'minutes') {
      remindTimer += 60 * timeArr[0];
    }
  }
  let remindText = message.content.replace(/([\s]+in[\s]+\d+[\s]+(hour(s)?|minute(s)?))([\s](and)[\s]+)?(\d+[\s](hour(s)?|minute(s)?))?[\s]*$/ig, '');
  remindText = remindText.split(' ').slice(1).join(' ');

  message.channel.sendMessage('Okay, I\'ll remind you of that in '
    + remindTimer/60 + " minutes");
  setTimeout(function(){
    message.reply("reminding you: " + remindText)
      .then(msg => console.log('Sent a reminder to ' + msg.author.username))
      .catch(console.error);
  }, remindTimer*1000);
}

module.exports = {remindMe};
