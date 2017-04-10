const YTDL = require('ytdl-core');
let playlistQueue = [];

/**
 * @param {guild} guild The guild that the command orignated from
 * @return {Promise<VoiceConnection>}
 */
function connect(guild) {
  let voiceJoin = guild.channels.find(val => val.type === 'voice');
  if (voiceJoin === null) {
    console.log('ERR: Unable to find a voice channel.');
    return;
  }

  if (voiceJoin.joinable === false) {
    console.log('ERR: No permission to join the voice channel.');
    return;
  } else {
    return voiceJoin.join();
  }
}

/**
 * @param {guild} guild The guild that the command orignated from
 */
function disconnect(guild) {
  if (guild.voiceConnection === null) {
    return;
  }
  let voiceLeave = guild.voiceConnection.channel;
  voiceLeave.leave();
  console.log('Left the voice in ' + guild.name);
}

/**
 * @param {message} message A message object as defined in discord.js
 */
function play(message) {
  const streamOptions = { seek: 0, volume: 1 };
  console.log('Playing from link: ' + message.content.split(' ')[1]);
  const stream = YTDL(message.content.split(' ')[1], {filter: 'audioonly'});

  if (message.guild.voiceConnection === null) {
    connect(message.guild)
      .then(connection => {
        const dispatcher = connection.playStream(stream, streamOptions);
      })
      .catch(console.error);
  } else {
    const dispatcher = message.guild.voiceConnection.playStream(stream, streamOptions);
  }
}

module.exports = {connect, disconnect, play}
