import * as ytdl from 'ytdl-core';

import * as config from '../../config';
import * as log from './logger.js';

const curFile = 'musicplayer.mjs';

let lastPlayed = '';
let playlistQueue = [];
let dispatcher = null;
let ytHeader = /http(s?):\/\/(www.)?youtube.com\/watch\?v=/;

/**
 * @param {guild} guild - The guild that the command orignated from
 * @return {Promise<VoiceConnection>}
 */
export function connect(guild) {
  const func = 'connect';

  let voiceJoin = guild.channels.find( (val) =>
                                        val.name === config.default_channel);
  if (voiceJoin === null) {
    voiceJoin = guild.channels.find( (val) => val.type === 'voice');

    if (voiceJoin === null) {
      log.warn('null', curFile, func, 'Unable to find a voice channel.');
      return;
    }
  }

  if (voiceJoin.joinable === false) {
    log.warn('false', curFile, func, 'No permission to join');
    return;
  } else {
    return voiceJoin.join();
  }
}

/** Ends the voice channel and clears the playlist queue
 * @param {guild} guild - The guild that the command orignated from
 */
export function disconnect(guild) {
  const func = 'disconnect';

  if (guild.voiceConnection === null) {
    return;
  }
  let voiceLeave = guild.voiceConnection.channel;
  voiceLeave.leave();
  log.verbose('', curFile, func, 'Left the voice in ' + guild.name);
  playlistQueue = [];
}

/**
 * @param {message} message - A message object as defined in discord.js
 */
export function play(message) {
  const func = 'play';

  let nextVid = message.content.split(' ')[1];
  if (nextVid == undefined) {
    message.channel.send('You need to specify a URL!')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject play undefined message');
      });
    log.verbose('blank', curFile, func, 'Blank URL, command skipped');
    return;
  }

  if (!/youtube.com/.test(nextVid)) {
    message.channel.send('You can only play from youtube videos right now!')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject non-youtube');
      });
    return;
  }

  playlistQueue.push(nextVid);

  log.verbose('added', curFile, func, 'Added ' +
              nextVid.replace(ytHeader, '') + ' to the queue');
  ytdl.getInfo(nextVid, (err, info) => {
    if (err) {
      log.warn(err, curFile, func, 'No metainfo for the video found');
  } else {
      if (playlistQueue.length > 1) {
        message.channel.send('Added **' + info.title + '** to the queue.')
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject add success message');
          });
      }
    }
  });

  if (playlistQueue.length <= 1) {
    playQueued(playlistQueue[0], message);
  }
}

/**
 * @param {string} nextVid - The URL string to the next video
 * @param {message} message - A message object as defined in discord.js
 */
function playQueued(nextVid, message) {
  const func = 'playQueued';

  const STREAMOPTIONS = {seek: 0, volume: 1};

  if (nextVid != null) {
    const STREAM = ytdl(nextVid, {filter: 'audioonly'});

    if (message.guild.voiceConnection === null) {
      connect(message.guild)
        .then( (connection) => {
          log.verbose('playing', curFile, func, 'Now Playing: ' +
                      nextVid.replace(ytHeader, ''));

          ytdl.getInfo(nextVid, (err, info) => {
            if (err) {
              log.warn(err, curFile, func, 'No metainfo found new');
            } else {
              let playbackInfo = ':play_pause: Playing **' + info.title +
                '** [Length: ' + Math.floor(info.length_seconds/60) +
                ':' + info.length_seconds%60 + ']\n(' +
                nextVid.replace(ytHeader, '') + ') ' + info.thumbnail_url;

              message.channel.send(playbackInfo)
                .catch( (reason) => {
                  log.info(reason, curFile, func, 'Reject get info');
                });
            }
          });

          lastPlayed = nextVid;
          dispatcher = connection.playStream(STREAM, STREAMOPTIONS);

          dispatcher.on('end', () => {
            dispatcher = null;
            playNext(message);
          });

          dispatcher.on('error', (err) => {
            log.warn(err, curFile, func, 'Dispatcher on failure new');
          });
        })
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Couldn\'t connect');
          message.channel.send('Could not connect to a voice channel')
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject fail message');
            });
        });
    } else {
      ytdl.getInfo(nextVid, (err, info) => {
        if (err) {
          log.verbose(err, curFile, func, 'No metainfo old');
        } else {
          let playbackInfo = ':play_pause: Playing **' + info.title +
            '** [Length: ' + Math.floor(info.length_seconds/60) +
            ':' + info.length_seconds%60 + ']\n(' +
            nextVid.replace(ytHeader, '') + ') ' + info.thumbnail_url;

          message.channel.send(playbackInfo)
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject success');
            });
        }
      });

      dispatcher =
          message.guild.voiceConnection.playStream(STREAM, STREAMOPTIONS);

      dispatcher.on('end', () => {
        dispatcher = null;
        playNext(message);
      });

      dispatcher.on('error', (err) => {
        log.warn(err, curFile, func, 'Dispatcher on failure old');
      });
    }
  }
}

/**
 * @param {message} message - A message object as defined in discord.js
 */
function playNext(message) {
  const func = 'playNext';

  playlistQueue.shift();
  if (playlistQueue.length > 0) {
    log.verbose('playing', curFile, func, 'Now Playing: ' +
                playlistQueue[0].replace(ytHeader, ''));
    playQueued(playlistQueue[0], message);
  }
}

/**
 * @param {message} message
 */
export function skip(message) {
  const func = 'skip';

  log.verbose('skip', curFile, func, playlistQueue[0].replace(ytHeader, '') +
              ' skipped');
  message.channel.send('Skipping song.')
    .catch( (reason) => {
      log.info(reason, curFile, func, 'Reject success');
    });
  dispatcher.end();
}

/**
 * @param {message} message
 */
export function repeat(message) {
  const func = 'repeat';

  message.content = '!play ' + lastPlayed;
  if (playlistQueue.length === 0) {
    play(message);
  } else {
    playlistQueue.push(lastPlayed);

    log.verbose('add', curFile, func, 'Added ' +
                lastPlayed.replace(ytHeader, '') + ' to the queue');
    ytdl.getInfo(lastPlayed, (err, info) => {
      if (err) {
        log.verbose(err, curFile, func, 'No metainfo found');
      } else {
        message.channel.send('Added **' + info.title + '** to the queue.')
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject success');
          });
      }
    });
  }
}

/**
 * @param {channel} channel - The channel from which the message orignated
 */
export function nowPlaying(channel) {
  const func = 'nowPlaying';

  if (playlistQueue.length === 0) {
    channel.send('Nothing is being played but my heart.')
      .catch( (reason) => {
        log.info(reason, curFile, func, 'Reject empty message');
      });
  } else {
    ytdl.getInfo(playlistQueue[0], (err, info) => {
      if (err) {
        log.warn(err, curFile, func, 'No metainfo found');
      } else {
        let playbackInfo = 'Now playing **' + info.title + '**\n(' +
          playlistQueue[0].replace(ytHeader, '') + ') ' + info.thumbnail_url;
        channel.send(playbackInfo)
          .catch( (reason) => {
            log.info(reason, curFile, func, 'Reject success');
          });
      }
    });
  }
}

/**
 * @param {message} message
 */
export function radio(message) {
  const func = 'radio';

  let url = message.content.split(' ')[1];
  let startLen = 0;

  if (!/youtube.com/.test(url)) {
    message.channel.send('Sorry, but I can only play ' +
                         'youtube live streams for now')
      .catch( (reason) => {
        log.warn(reason, curFile, func, 'Reject non-youtube request');
      });
  } else {
    message.channel.send('Attempting to play stream at: ' +
                         url.replace('https://www.', ''))
      .catch( (reason) => {
        log.warn(reason, curFile, func, 'Reject play stream');
      });

    ytdl.getInfo(url, (err, info) => {
      if (err) {
        log.warn(err, curFile, func, 'No metainfo found');
      } else {
        for (format of info.formats) {
          if (format.max_dvr_duration_sec != undefined) {
            startLen = Math.max(0, format.max_dvr_duration_sec - 5);
            break;
          }
        }
      }

      let streamOpt = {range: {start: startLen, end: 999999}, quality: 93};
      const stream = ytdl(url, streamOpt);
      connect(message.guild)
        .then( (connection) => {
          playlistQueue = [url];
          dispatcher = connection.playStream(stream);

          message.channel.send('Cleared the playlist to play the radio')
            .catch( (reason) => {
              log.info(reason, curFile, func, 'Reject clear');
            });

          let playbackInfo = ':play_pause: Playing radio at ** ' + info.title +
              + url.replace(ytHeader, '') + ' ' + info.thumbnail_url;

          message.channel.send(playbackInfo)
              .catch( (reason) => {
                log.info(reason, curFile, func, 'Reject get info');
              });

          dispatcher.on('end', () => {
            dispatcher = null;
            playNext(message);
          });

          dispatcher.on('error', (err) => {
            log.warn(err, curFile, func, 'Dispatcher on failure');
          });
        })
        .catch( (reason) => {
          log.info(reason, curFile, func, 'Reject connect');
        });
    });
  }
}

/**
 * @param {guild} guild  The guild from which to disconnect
 */
export function stopRadio(guild) {
  disconnect(guild);
}
