const YTDL = require('ytdl-core');
let config = require('./config');

let lastPlayed = '';
let playlistQueue = [];
let dispatcher = null;
let ytheader = /http(s?):\/\/(www.)?youtube.com\/watch\?v=/;

/**
 * @param {guild} guild The guild that the command orignated from
 * @return {Promise<VoiceConnection>}
 */
function connect(guild) {
  let voiceJoin = guild.channels.find(val => val.name === config.default_channel);
  if (voiceJoin === null) {
    voiceJoin = guild.channels.find(val => val.type === 'voice');

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
 * @param {guild} guild The guild that the command orignated from
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
 * @param {message} message A message object as defined in discord.js
 */
function play(message) {
  let nextVid = message.content.split(' ')[1]
  playlistQueue.push(nextVid);

  console.log('Added ' + nextVid.replace(ytheader,'') + ' to the queue');
  YTDL.getInfo(nextVid, function(err, info) {
    if (err) console.log("No metainfo for the video found");
    else {
      if (playlistQueue.length > 1) {
        message.channel.sendMessage('Added **' + info.title + '** to the queue.');
      }
    }
  });

  if (playlistQueue.length <= 1) {
    playQueued(playlistQueue[0], message);
  }
}

/**
 * @param {string} nextVid
 * @param {message} message A message object as defined in discord.js
 */
function playQueued(nextVid, message) {
  const STREAMOPTIONS = { seek: 0, volume: 1 };

  if (nextVid != null) {
    const STREAM = YTDL(nextVid, {filter: 'audioonly'});

    if (message.guild.voiceConnection === null) {
      connect(message.guild)
        .then(connection => {
          console.log('Now Playing: ' + nextVid.replace(ytheader,''));

          YTDL.getInfo(nextVid, function(err,info) {
            if (err) console.log("No metainfo for the video found");
            else {
              let playbackInfo = ':play_pause: Playing **' + info.title +
                '** [Length: ' + Math.floor(info.length_seconds/60) +
                ':' + info.length_seconds%60 + ']\n(' +
                nextVid.replace(ytheader,'') + ') ' +  info.thumbnail_url;

              message.channel.sendMessage(playbackInfo);
            }
          });

          lastPlayed = nextVid;
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
      YTDL.getInfo(nextVid, function(err,info) {
        if (err) console.log("No metainfo for the video found");
        else {
          let playbackInfo = ':play_pause: Playing **' + info.title +
            '** [Length: ' + Math.floor(info.length_seconds/60) +
            ':' + info.length_seconds%60 + ']\n(' +
            nextVid.replace(ytheader,'') + ') ' + info.thumbnail_url;

          message.channel.sendMessage(playbackInfo);
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
  playlistQueue.shift();
  if (playlistQueue.length > 0) {
    console.log("Now Playing: " + playlistQueue[0].replace(ytheader,''));
    playQueued(playlistQueue[0], message);
  }
}

/**
 * @param {message}
 */
function skip(message) {
  message.channel.sendMessage('Not implemented yet.');
}

/**
 * @param {message}
 */
function repeat(message) {
  message.content = '!play ' + lastPlayed;
  if (playlistQueue.length === 0) {
    play(message);
  } else {
    playlistQueue.push(lastPlayed);

    console.log('Added ' + lastPlayed.replace(ytheader,'') + ' to the queue');
    YTDL.getInfo(lastPlayed, function(err, info) {
      if (err) console.log("No metainfo for the video found");
      else {
        message.channel.sendMessage('Added **' + info.title + '** to the queue.');
      }
    });
  }
}

module.exports = {connect, disconnect, play, skip, repeat}
