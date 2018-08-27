import * as log from './logger.js';

const curFile = 'remind.mjs';

/**
 * @param {message} message
 */
export function remindMe(message) {
  const func = 'remindMe';

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
        log.info(reason, curFile, func, 'Reject wrong format');
      });
    return;
  }
  let matchedStrings =
      message.content.match(/\d+[\s]+((hour(s)?)|(minute(s)?))/ig);
  log.verbose('set', curFile, func, 'Set reminder to ' +
              message.author.username + ' in ' + matchedStrings.join(' '));

  let remindTimer = 0;
  for (let elem of matchedStrings) {
    let timeArr = elem.split(' ');
    if (timeArr.length < 2) {
      log.verbose('bad match', curFile, func,
                  'Bad Time match in timeArr from !remindme');
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
        log.verbose('send', curFile, func, 'Sent a reminder to ' +
                    msg.author.username);
      })
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject remind message');
      });
  }, remindTimer*1000);
}
