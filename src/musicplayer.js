let config = require('../config');
const ytdl = require('ytdl-core');

let lastPlayed = '';
let playlistQueue = [];
let dispatcher = null;
let ytHeader = /http(s?):\/\/(www.)?youtube.com\/watch\?v=/;
let playingRadio = false;

/**
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

/** Ends the voice channel and clears the playlist queue
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
  playingRadio = false;
}

/**
 * @param {message} message - A message object as defined in discord.js
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

  if (playlistQueue.length <= 1) {
    playQueued(playlistQueue[0], message);
  }
}

/**
 * @param {string} nextVid - The URL string to the next video
 * @param {message} message - A message object as defined in discord.js
 */
function playQueued(nextVid, message) {
  const STREAMOPTIONS = {seek: 0, volume: 1};

  if (nextVid != null) {
    const STREAM = ytdl(nextVid, {filter: 'audioonly'});

    if (message.guild.voiceConnection === null) {
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
 * @param {message} message - A message object as defined in discord.js
 */
function playNext(message) {
  playlistQueue.shift();
  if (playlistQueue.length > 0) {
    console.log('Now Playing: ' + playlistQueue[0].replace(ytHeader, ''));
    playQueued(playlistQueue[0], message);
  }
}

/**
 * @param {message} message
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
 * @param {message} message
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
 * @param {message} message
 */
function radio(message) {
  playingRadio = true;
  repeatRadio(message);
}

/**
 * @param {message} message
 */
function repeatRadio(message) {
  if (playingRadio === false) return;
  let radioLink = message.content.split(' ')[1];
  if (radioLink === null) return; // Handle non-youtube radios here eventually

  const STREAMOPTIONS = {seek: 0, volume: 1};
  const STREAM = ytdl(radioLink, {filter: 'audioonly'});

  if (message.guild.voiceConnection === null) {
    connect(message.guild)
      .then( (connection) => {
        dispatcher = connection.playStream(STREAM, STREAMOPTIONS);

        dispatcher.on('end', () => {
          dispatcher = null;
          repeatRadio(message);
        });

        dispatcher.on('error', (err) => {
          console.log(err);
        });
      });
  } else {
    dispatcher =
        message.guild.voiceConnection.playStream(STREAM, STREAMOPTIONS);

    dispatcher.on('end', () => {
      dispatcher = null;
      repeatRadio(message);
    });

    dispatcher.on('error', (err) => {
      console.log(err);
    });
  }
}

/**
 *
 */
function stopRadio() {
  playingRadio = false;
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
