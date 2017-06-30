/**
 * This file handles reminders which are messages that the user desires to be
 * played back to them at a specified time via @mention.
 */

/**
 * Checks for the message to be in the proper format via regular expressions.
 * If it is in the proper format, this process sleeps until the specified time.
 * Then at that time, it sends a message containing the original message
 * contents and @mentions that person. As this function runs asynchronously,
 * there are no issues with the process sleeping. The reminders are stored in
 * temporary memory and will be lost upon restarting Fubuki. This is due to the
 * time sensitive nature of reminders - usually being short durations.
 *
 * @param {message} message - The original message object prompting this call
 */
function remindMe(message) {
  let remindRegex = new RegExp([
    '.+?in[\\s]+(\\d+\[\\s]+(hour(s)?|minute(s)?))?',
    '( and[\\s]+(\\d+[\\s](hour(s)?|minute(s)?)))?',
  ].join(''), 'ig');

  if (!remindRegex.test(message.content)) {
    message.channel.sendMessage(
      'That was the wrong format, please send it as such:\n' +
      '!remindme [Your reminder text] in [Number] [hour(s) or minute(s)]' +
      ' and [Number] [minute(s) or hour(s)]\nYou can omit "and" and' +
      ' everything after it if desired. Case does not matter.'
    )
      .catch( (reason) => {
        console.log('Rejected Remind WrongFormat Promise for ' + reason);
      });
    return;
  }
  let matchedStrings =
      message.content.match(/\d+[\s]+((hour(s)?)|(minute(s)?))/ig);
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

  let remindInput = new RegExp([
    '([\\s]+in[\\s]+\\d+[\\s]+(hour(s)?|minute(s)?))',
    '([\\s](and)[\\s]+)?(\\d+[\\s](hour(s)?|minute(s)?))?[\\s]*$',
  ].join(''), 'ig');
  let remindText = message.content.replace(remindInput, '');
  remindText = remindText.split(' ').slice(1).join(' ');

  message.channel.sendMessage('Okay, I\'ll remind you of that in '
    + remindTimer/60 + ' minutes');
  setTimeout( () => {
    message.reply('reminding you: ' + remindText)
      .then( (msg) => {
        console.log('Sent a reminder to ' + msg.author.username);
      })
      .catch(console.error);
  }, remindTimer*1000);
}

module.exports = {remindMe};
