const YTDL = require('ytdl-core');
let config = require('./config');

let last_played = '';
let playlist_queue = [];
let dispatcher = null;
let yt_header = /http(s?):\/\/(www.)?youtube.com\/watch\?v=/;
let playing_radio = false;

/**
 * @param {guild} guild The guild that the command orignated from
 * @return {Promise<VoiceConnection>}
 */
function connect(guild) {
  let voice_join = guild.channels.find(val => val.name === config.default_channel);
  if (voice_join === null) {
    voice_join = guild.channels.find(val => val.type === 'voice');

    if (voice_join === null) {
      console.log('ERR: Unable to find a voice channel.');
      return;
    }
  }

  if (voice_join.joinable === false) {
    console.log('ERR: No permission to join the voice channel.');
    return;
  } else {
    return voice_join.join();
  }
}

/** Ends the voice channel and clears the playlist queue
 * @param {guild} guild The guild that the command orignated from
 */
function disconnect(guild) {
  if (guild.voiceConnection === null) {
    return;
  }
  let voice_leave = guild.voiceConnection.channel;
  voice_leave.leave();
  console.log('Left the voice in ' + guild.name);
  playlist_queue = [];
  playing_radio = false;
}

/**
 * @param {message} message A message object as defined in discord.js
 */
function play(message) {
  let next_vid = message.content.split(' ')[1]
  if (next_vid == undefined) {
    message.channel.send("You need to specify a URL!")
      .catch( reason => { console.log("Rejected Music PlayUndefined Promise for " + reason); });
    console.log("Blank URL, command skipped");
    return;
  }

  playlist_queue.push(next_vid);

  console.log('Added ' + next_vid.replace(yt_header,'') + ' to the queue');
  YTDL.getInfo(next_vid, function(err, info) {
    if (err) console.log("No metainfo for the video found");
    else {
      if (playlist_queue.length > 1) {
        message.channel.send('Added **' + info.title + '** to the queue.');
      }
    }
  });

  if (playlist_queue.length <= 1) {
    playQueued(playlist_queue[0], message);
  }
}

/**
 * @param {string} next_vid
 * @param {message} message A message object as defined in discord.js
 */
function playQueued(next_vid, message) {
  const STREAMOPTIONS = { seek: 0, volume: 1 };

  if (next_vid != null) {
    const STREAM = YTDL(next_vid, {filter: 'audioonly'});

    if (message.guild.voiceConnection === null) {
      connect(message.guild)
        .then(connection => {
          console.log('Now Playing: ' + next_vid.replace(yt_header,''));

          YTDL.getInfo(next_vid, function(err,info) {
            if (err) console.log("No metainfo for the video found");
            else {
              let playback_info = ':play_pause: Playing **' + info.title +
                '** [Length: ' + Math.floor(info.length_seconds/60) +
                ':' + info.length_seconds%60 + ']\n(' +
                next_vid.replace(yt_header,'') + ') ' +  info.thumbnail_url;

              message.channel.send(playback_info);
            }
          });

          last_played = next_vid;
          dispatcher = connection.playStream(STREAM, STREAMOPTIONS);

          dispatcher.on('end', () => {
            dispatcher = null;
            playNext(message);
          });

          dispatcher.on('error', (err) => {
            console.log(err)
          });
        });
    } else {
      YTDL.getInfo(next_vid, function(err,info) {
        if (err) console.log("No metainfo for the video found");
        else {
          let playback_info = ':play_pause: Playing **' + info.title +
            '** [Length: ' + Math.floor(info.length_seconds/60) +
            ':' + info.length_seconds%60 + ']\n(' +
            next_vid.replace(yt_header,'') + ') ' + info.thumbnail_url;

          message.channel.send(playback_info);
        }
      });

      dispatcher = message.guild.voiceConnection.playStream(STREAM, STREAMOPTIONS);

      dispatcher.on('end', () => {
        dispatcher = null;
        playNext(message);
      });

      dispatcher.on('error', (err) => {
        console.log(err)
      });
    }
  }
}

/**
 * @param {message} message A message object as defined in discord.js
 */
function playNext(message) {
  playlist_queue.shift();
  if (playlist_queue.length > 0) {
    console.log("Now Playing: " + playlist_queue[0].replace(yt_header,''));
    playQueued(playlist_queue[0], message);
  }
}

/**
 * @param {message} message
 */
function skip(message) {
  console.log(playlist_queue[0].replace(yt_header,'') + ' skipped');
  message.channel.send('Skipping song.');
  dispatcher.end();
}

/**
 * @param {message}
 */
function repeat(message) {
  message.content = '!play ' + last_played;
  if (playlist_queue.length === 0) {
    play(message);
  } else {
    playlist_queue.push(last_played);

    console.log('Added ' + last_played.replace(yt_header,'') + ' to the queue');
    YTDL.getInfo(last_played, function(err, info) {
      if (err) console.log("No metainfo for the video found");
      else {
        message.channel.send('Added **' + info.title + '** to the queue.');
      }
    });
  }
}

/**
 * @param {channel} channel The channel from which the message orignated
 */
function nowPlaying(channel) {
  if (playlist_queue.length === 0) {
    channel.send('Nothing is being played but my heart.');
  } else {
    YTDL.getInfo(playlist_queue[0], function(err, info) {
      if (err) console.log("No metainfo for the video found");
      else {
        let playback_info = 'Now playing **' + info.title + '**\n(' +
          playlist_queue[0].replace(yt_header,'') + ') ' + info.thumbnail_url;
        channel.send(playback_info);
      }
    });
  }
}

/**
 * @param {message} message
 */
function radio(message) {
  playing_radio = true;
  repeatRadio(message);
}

function repeatRadio(message) {
  if (playing_radio === false) return;
  let radio_link = message.content.split(' ')[1];
  if (radio_link === null) return; // Handle non-youtube radios here eventually

  const STREAMOPTIONS = { seek: 0, volume: 1 };
  const STREAM = YTDL(radio_link, {filter: 'audioonly'});

  if (message.guild.voiceConnection === null) {
    connect(message.guild)
      .then(connection => {
        dispatcher = connection.playStream(STREAM, STREAMOPTIONS);

        /**STREAM.on('progress', (chunk_length, downloaded, download_length) => {
          if (downloaded / chunk_length > 0.8) repeatRadio(message);
        });*/

        dispatcher.on('end', () => {
          dispatcher = null;
          repeatRadio(message);
        });

        dispatcher.on('error', (err) => {
          console.log(err)
        });
      });
  } else {
    dispatcher = message.guild.voiceConnection.playStream(STREAM, STREAMOPTIONS);

    dispatcher.on('end', () => {
      dispatcher = null;
      repeatRadio(message);
    });

    dispatcher.on('error', (err) => {
      console.log(err)
    });
  }
}

function stopRadio() {
  playing_radio = false;
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
}
