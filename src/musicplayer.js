/**
 * This file contains all the youtube playback features of Fubuki.
 * @package ytdl-core
 */

let config = require('../config');
const ytdl = require('ytdl-core');

let lastPlayed = '';
let playlistQueue = [];
let dispatcher = null;
let ytHeader = /http(s?):\/\/(www.)?youtube.com\/watch\?v=/;

/**
 * Attempts to connect to the default voice channelspecified in config.js and
 * connects to the first avalible voice channel if that fails. The returned
 * VoiceConnection object is necessary to send audio to Discord.
 *
 * @param {guild} guild - The guild that the command orignated from
 * @return {Promise<VoiceConnection>}
 */
function connect(guild) {
  let voiceJoin = guild.channels.find( (val) =>
                                        val.name === config.default_channel);
  if (voiceJoin === null) {
    voiceJoin = guild.channels.find( (val) => val.type === 'voice');

    if (voiceJoin === null) {
      console.log('ERR: Unable to find a voice channel.');
      return;
    }
  }

  if (voiceJoin.joinable === false) {
    console.log('ERR: No permission to join the voice channel.');
    return;
  } else {
    return voiceJoin.join();
  }
}

/**
 * Exits the current voice channel of that server and clears the playlist queue
 *
 * @param {guild} guild - The guild that the command orignated from
 */
function disconnect(guild) {
  if (guild.voiceConnection === null) {
    return;
  }
  let voiceLeave = guild.voiceConnection.channel;
  voiceLeave.leave();
  console.log('Left the voice in ' + guild.name);
  playlistQueue = [];
}

/**
 * Adds youtube videos to the playlist which will be played later
 *
 * @param {message} message - The original message object prompting this call
 */
function play(message) {
  let nextVid = message.content.split(' ')[1];
  if (nextVid == undefined) {
    message.channel.send('You need to specify a URL!')
      .catch( (reason) => {
        console.log('Rejected Music PlayUndefined Promise for ' + reason);
      });
    console.log('Blank URL, command skipped');
    return;
  }

  if (!/youtube.com/.test(nextVid)) {
    message.channel.send('You can only play from youtube videos right now!')
      .catch( (err) => console.log(err));
    return;
  }

  playlistQueue.push(nextVid);

  console.log('Added ' + nextVid.replace(ytHeader, '') + ' to the queue');
  ytdl.getInfo(nextVid, (err, info) => {
    if (err) console.log('No metainfo for the video found');
    else {
      if (playlistQueue.length > 1) {
        message.channel.send('Added **' + info.title + '** to the queue.')
          .catch( (reason) => {
            console.log('Rejected Play AddSuccess Promise for ' + reason);
          });
      }
    }
  });

  // Used to start the queue consumption if it wasn't active already
  if (playlistQueue.length <= 1) {
    playQueued(playlistQueue[0], message);
  }
}

/**
 * Extracts the youtube URL from the front of the queue and connects the audio
 * of that video to the audio stream in Discord. It will continue to play the
 * videos one-by-one until the queue is empty.
 *
 * @param {string} nextVid - The URL string to the next video
 * @param {message} message - The original message object prompting this call
 */
function playQueued(nextVid, message) {
  const STREAMOPTIONS = {seek: 0, volume: 1};

  if (nextVid != null) {
    const STREAM = ytdl(nextVid, {filter: 'audioonly'});

    if (message.guild.voiceConnection === null) {
      // Initial voice channel connections are made
      connect(message.guild)
        .then( (connection) => {
          console.log('Now Playing: ' + nextVid.replace(ytHeader, ''));

          ytdl.getInfo(nextVid, (err, info) => {
            if (err) console.log('No metainfo for the video found');
            else {
              let playbackInfo = ':play_pause: Playing **' + info.title +
                '** [Length: ' + Math.floor(info.length_seconds/60) +
                ':' + info.length_seconds%60 + ']\n(' +
                nextVid.replace(ytHeader, '') + ') ' + info.thumbnail_url;

              message.channel.send(playbackInfo)
                .catch( (reason) => {
                  console.log('Rejected PlayQueued GetInfo Promise for ' +
                              reason);
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
            console.log(err);
          });
        })
        .catch( (err) => {
          console.log('Couldnt connect to voice channel: ' + err);
          message.channel.send('Could not connect to a voice channel')
            .catch( (reason) => {
              console.log('Rejected PlayQueued Fail Promise for ' + reason);
            });
        });
    } else {
      // In this case the connection was already established
      ytdl.getInfo(nextVid, (err, info) => {
        if (err) console.log('No metainfo for the video found');
        else {
          let playbackInfo = ':play_pause: Playing **' + info.title +
            '** [Length: ' + Math.floor(info.length_seconds/60) +
            ':' + info.length_seconds%60 + ']\n(' +
            nextVid.replace(ytHeader, '') + ') ' + info.thumbnail_url;

          message.channel.send(playbackInfo)
            .catch( (reason) => {
              console.log('Rejected PlayQueued Success Promise for ' + reason);
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
        console.log(err);
      });
    }
  }
}

/**
 * Dequeues and calls {@playQueued} to consume the next element in the queue
 *
 * @param {message} message - The original message object prompting this call
 */
function playNext(message) {
  playlistQueue.shift();
  if (playlistQueue.length > 0) {
    console.log('Now Playing: ' + playlistQueue[0].replace(ytHeader, ''));
    playQueued(playlistQueue[0], message);
  }
}

/**
 * Skips the playback of the front element of the queue by dequeuing it and
 * ending the audio stream to Discord
 *
 * @param {message} message - The original message object prompting this call
 */
function skip(message) {
  console.log(playlistQueue[0].replace(ytHeader, '') + ' skipped');
  message.channel.send('Skipping song.')
    .catch( (reason) => {
      console.log('Rejected Skip Success Promise for ' + reason);
    });
  dispatcher.end();
}

/**
 * Simply adds another copy of the front of the queue to the back of the queue
 *
 * @param {message} message - The original message object prompting this call
 */
function repeat(message) {
  message.content = '!play ' + lastPlayed;
  if (playlistQueue.length === 0) {
    play(message);
  } else {
    playlistQueue.push(lastPlayed);

    console.log('Added ' + lastPlayed.replace(ytHeader, '') + ' to the queue');
    ytdl.getInfo(lastPlayed, (err, info) => {
      if (err) console.log('No metainfo for the video found');
      else {
        message.channel.send('Added **' + info.title + '** to the queue.')
          .catch( (reason) => {
            console.log('Rejected Repeat Success Promise for ' + reason);
          });
      }
    });
  }
}

/**
 * Requests the information on the youtube video at the URL at the front of the
 * queue and replies with it.
 *
 * @param {channel} channel - The channel from which the message orignated
 */
function nowPlaying(channel) {
  if (playlistQueue.length === 0) {
    channel.send('Nothing is being played but my heart.')
      .catch( (reason) => {
        console.log('Rejected NowPlaying Empty Promise for ' + reason);
      });
  } else {
    ytdl.getInfo(playlistQueue[0], (err, info) => {
      if (err) console.log('No metainfo for the video found');
      else {
        let playbackInfo = 'Now playing **' + info.title + '**\n(' +
          playlistQueue[0].replace(ytHeader, '') + ') ' + info.thumbnail_url;
        channel.send(playbackInfo)
          .catch( (reason) => {
            console.log('Rejected NowPlaying Success Promise for ' + reason);
          });
      }
    });
  }
}

/**
 * Streams a live youtube video from the beginning of the video session.
 * {@code ytdl-core} doesn't currently support playback at the current timestap
 * of the live video.
 *
 * @param {message} message - The original message object prompting this call
 */
function radio(message) {
  let url = message.content.split(' ')[1];

  if (!/youtube.com/.test(url)) {
    message.channel.send('Sorry, but I can only play ' +
                         'youtube live streams for now')
      .catch( (err) => console.log(err));
  } else {
    message.channel.send('Attempting to play stream at: ' +
                         url.replace(/http(s)+?:\/\/(www\.)?/, ''))
      .catch( (err) => console.log(err));

    ytdl.getInfo(url, (err, info) => {
      if (err) console.log('No metainfo for the video found');
      else {
        for (format of info.formats) {
          if (format.max_dvr_duration_sec != undefined) {
            startLen = Math.max(0, format.max_dvr_duration_sec - 5);
            break;
          }
        }
      }

      /**
       *  93 refers to itag 93 which denotes a live stream. Higher quality is
       * avoided due to live streams not always having such high quality.
       */

      let streamOpt = {quality: 93};
      const stream = ytdl(url, streamOpt);
      connect(message.guild)
        .then( (connection) => {
          playlistQueue = [url];
          dispatcher = connection.playStream(stream);

          message.channel.send('Cleared the playlist to play the radio')
            .catch( (err) => console.log(err));

          let minHeader = /http(s)+?:\/\/(www\.)?(youtube.com)?/;
          let playbackInfo = ':play_pause: Playing **' + info.title +
              '** radio (' + url.replace(minHeader, '') + ') ' +
              info.thumbnail_url;

          message.channel.send(playbackInfo)
              .catch( (reason) => {
                console.log('Rejected PlayQueued GetInfo Promise for ' +
                            reason);
              });

          dispatcher.on('end', () => {
            dispatcher = null;
            playNext(message);
          });

          dispatcher.on('error', (err) => {
            console.log(err);
          });
        })
        .catch( (err) => console.log(err) );
    });
  }
}

/**
 * Ends the connection to the voice channel in Discord
 *
 * @param {guild} guild  The guild from which to disconnect
 */
function stopRadio(guild) {
  disconnect(guild);
}

module.exports = {
  connect,
  disconnect,
  play,
  skip,
  repeat,
  nowPlaying,
  radio,
  stopRadio,
};
