import * as ytdl from 'ytdl-core';
import * as std from 'tstl';

import config from '../config';
import Logger from '../util/Logger';
import * as Discord from 'discord.js';

export default class MusicPlayer {
  private Logger: Logger = new Logger('MusicPlayer');

  private lastPlayed = '';
  private playlistQueue = new std.Queue<string>();
  private dispatcher = null;
  private youtubeHeader = /http(s?):\/\/(www.)?youtube.com\/watch\?v=/;

  /**
   * @param {Discord.Guild} guild - The guild that the command orignated from
   * @return {Promise<Discord.VoiceConnection>}
   */
  public connect(guild: Discord.Guild): Promise<Discord.VoiceConnection> {
    this.Logger.setMethod(this.connect.name);

    try {
      let sb = '';
      guild.channels.forEach(channel => sb += channel.name + '[' + channel.type + ']' + ', ')
      this.Logger.verbose('Listing Connections', sb);

    // const voiceJoin: Discord.VoiceChannel = Optional
    //   .of(guild.channels.find((val) => val.name === config.default_channel))
    //   .orElse(guild.channels.find((val) => val.type === 'voice')) as Discord.VoiceChannel;
    let voiceJoin: Discord.VoiceChannel = guild.channels.find((val) => val.name === config.default_channel && val.type === 'voice') as Discord.VoiceChannel;
    if (voiceJoin === null) {
      voiceJoin = guild.channels.find((val) => val.type === 'voice') as Discord.VoiceChannel;
    }

    this.Logger.verbose('Voice Channel', voiceJoin.name);

    if (voiceJoin === null) {
      this.Logger.warn('null', 'Unable to find a voice channel.');
    } else if (voiceJoin.joinable === false) {
      this.Logger.warn('false', 'No permission to join');
    } else {
      return voiceJoin.join();
    }
  } catch (err) { this.Logger.error(err, 'Connect?')};
  }

  /** Ends the voice channel and clears the playlist queue
   * @param {Discord.Guild} guild - The guild that the command orignated from
   */
  public disconnect(guild: Discord.Guild): void {
    this.Logger.setMethod(this.disconnect.name);

    if (guild.voiceConnection !== null) {
      guild.voiceConnection.channel.leave();

      this.Logger.verbose('', 'Left the voice channel in ' + guild.name);
      this.playlistQueue = new std.Queue();
    }
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   */
  public play(message: Discord.Message): void {
    this.Logger.setMethod('play');

    const nextVid = message.content.split(' ')[1];
    if (nextVid === undefined) {
      message.channel.send('You need to specify a URL!')
        .catch((reason) => this.Logger.warn(reason, 'Failed to send message about missing URL'));
      this.Logger.verbose('blank', 'Blank URL, command skipped');
    } else if (!/youtube.com/.test(nextVid)) {
      message.channel.send('You can only play from youtube videos right now!')
        .catch((reason) => this.Logger.warn(reason, 'Failed to send message rejecting play request'));
    } else {
      this.playlistQueue.push(nextVid);

      this.Logger.verbose('added', 'Added ' + nextVid.replace(this.youtubeHeader, '') + ' to the queue');
      ytdl.getBasicInfo(nextVid)
      .then((info: ytdl.videoInfo) => { 
        this.Logger.verbose('Getting Basic Video Info', 'Title: ' + info.title + ', ID: ' + info.video_id + ', Author: ' + info.author.name);
        message.channel.send('Added **' + info.title + '** to the queue.')
          .catch((reason) => this.Logger.warn(reason, 'Failed to send message about MusicPlayer queue state'));
      })
      .catch((err) => this.Logger.error(err, 'Error in getting video basic info'));

      if (this.playlistQueue.size() <= 1) {
        this.playQueued(this.playlistQueue.front(), message);
      }
    }
  }

  /**
   * @param {string} nextVid - The URL string to the next video
   * @param {Discord.Message} message - A message object as defined in discord.js
   */
  private playQueued(nextVid: string, message: Discord.Message) {
    this.Logger.setMethod(this.playQueued.name);

    const STREAMOPTIONS = {seek: 0, volume: 1};

    if (nextVid !== null) {
      const STREAM = ytdl(nextVid, {filter: 'audioonly'});

      if (message.guild.voiceConnection === null) {
        this.connect(message.guild)
          .then((connection) => {
            this.Logger.verbose('playing', 'Now Playing: ' + nextVid.replace(this.youtubeHeader, ''));

            ytdl.getBasicInfo(nextVid)
            .then((info) => {
              const playbackInfo = ':play_pause: Playing **' + info.title + '** [Length: ' + Math.floor(Number.parseInt(info.length_seconds)/60) +
                ':' + Number.parseInt(info.length_seconds)%60 + ']\n(' + info.video_id + ') ' + info.thumbnail_url;

              message.channel.send(playbackInfo)
                .catch((reason) => this.Logger.info(reason, 'Reject get info'));
            })
            .catch((err) => this.Logger.warn(err, 'No metainfo found new'));

            this.lastPlayed = nextVid;
            this.dispatcher = connection.playStream(STREAM, STREAMOPTIONS);

            this.dispatcher.on('end', () => {
              this.playNext(message);
            });

            this.dispatcher.on('error', (err) => this.Logger.warn(err, 'Dispatcher on failure new'));
          })
          .catch((reason) => {
            this.Logger.info(reason, 'Couldn\'t connect');
            message.channel.send('Could not connect to a voice channel')
              .catch((reason) => this.Logger.info(reason, 'Reject fail message'));
          });
      } else {
        ytdl.getInfo(nextVid, (err, info) => {
          if (err) {
            this.Logger.verbose(err, 'No metainfo old');
          } else {
            let playbackInfo = ':play_pause: Playing **' + info.title + '** [Length: ' + Math.floor(Number.parseInt(info.length_seconds)/60) +
              ':' + Number.parseInt(info.length_seconds)%60 + ']\n(' + nextVid.replace(this.youtubeHeader, '') + ') ' + info.thumbnail_url;

            message.channel.send(playbackInfo)
              .catch((reason) => this.Logger.info(reason, 'Failed to send message with playback info'));
          }
        });

        this.dispatcher = message.guild.voiceConnection.playStream(STREAM, STREAMOPTIONS);

        this.dispatcher.on('end', () => {
          // this.dispatcher = null;
          this.playNext(message);
        })
        .catch((err) => this.Logger.error(err, 'Dispatcher received \'end\' event'));

        this.dispatcher.on('error', (err) => {
          this.Logger.warn(err, 'Dispatcher received \'error\' event');
        });
      }
    }
  }

  /**
   * @param {Discord.Message} message - A message object as defined in discord.js
   */
  private playNext(message: Discord.Message): void {
    this.Logger.setMethod(this.playNext.name);
    this.playlistQueue.pop();
    if (this.playlistQueue.size() > 0) {
      this.Logger.verbose('playing', 'Now Playing: ' + this.playlistQueue[0].replace(this.youtubeHeader, ''));
      this.playQueued(this.playlistQueue.front(), message);
    }
  }

  /**
   * @param {Discord.Message} message
   */
  public skip(message: Discord.Message): void {
    this.Logger.setMethod(this.skip.name);

    this.Logger.verbose('skip', this.playlistQueue.front().replace(this.youtubeHeader, '') + ' skipped');
    message.channel.send('Skipping song.')
      .catch((reason) => this.Logger.info(reason, 'Reject success'));
    this.dispatcher.end();
  }

  /**
   * @param {Discord.Message} message
   */
  public repeat(message: Discord.Message): void {
    this.Logger.setMethod(this.repeat.name);

    message.content = '!play ' + this.lastPlayed;
    if (this.playlistQueue.size() === 0) {
      this.play(message);
    } else {
      this.playlistQueue.push(this.lastPlayed);

      this.Logger.verbose('add', 'Added ' + this.lastPlayed.replace(this.youtubeHeader, '') + ' to the queue');
      ytdl.getInfo(this.lastPlayed, (err, info) => {
        if (err) {
          this.Logger.verbose(err, 'No metainfo found');
        } else {
          message.channel.send('Added **' + info.title + '** to the queue.')
            .catch((reason) => this.Logger.info(reason, 'Reject success'));
        }
      });
    }
  }

  /**
   * @param {Discord.TextChannel} channel - The channel from which the message orignated
   */
  public nowPlaying(channel: Discord.TextChannel): void {
    this.Logger.setMethod(this.nowPlaying.name);

    if (this.playlistQueue.size() === 0) {
      channel.send('Nothing is being played but my heart.')
        .catch((reason) => this.Logger.info(reason, 'Reject empty message'));
    } else {
      ytdl.getInfo(this.playlistQueue[0], (err, info) => {
        if (err) {
          this.Logger.warn(err, 'No metainfo found');
        } else {
          const playbackInfo = 'Now playing **' + info.title + '**\n(' + this.playlistQueue[0].replace(this.youtubeHeader, '') + ') ' + info.thumbnail_url;
          channel.send(playbackInfo)
            .catch((reason) => this.Logger.info(reason, 'Reject success'));
        }
      });
    }
  }

  /**
   * @param {Discord.Message} message
   */
  public radio(message: Discord.Message): void {
    this.Logger.setMethod(this.radio.name);

    let url = message.content.split(' ')[1];
    let startLen = 0;

    if (!/youtube.com/.test(url)) {
      message.channel.send('Sorry, but I can only play youtube live streams for now')
        .catch((reason) => this.Logger.warn(reason, 'Reject non-youtube request'));
    } else {
      const stream = ytdl(url, {quality: '94'});
      this.connect(message.guild)
        .then((connection) => {
          this.playlistQueue = new std.Queue();
          this.playlistQueue.push(url);
          this.dispatcher = connection.playStream(stream, {seek: 0, volume: 1});

          message.channel.send('Cleared the playlist to play the radio')
            .catch( (reason) => this.Logger.info(reason, 'Reject clear'));

            ytdl.getBasicInfo(url)
            .then(info => {
              let playbackInfo = ':play_pause: Playing radio at ** ' + info.title + url.replace(this.youtubeHeader, '') + ' ' + info.thumbnail_url;

              message.channel.send(playbackInfo)
                .catch( (reason) => this.Logger.info(reason, 'Reject get info'));
            })
            .catch((err) => this.Logger.warn(err, 'Unable to get Live Stream info'));

            this.dispatcher.on('end', () => {
              this.dispatcher = null;
              this.playNext(message);
            });

            this.dispatcher.on('error', (err) => this.Logger.warn(err, 'Dispatcher on failure'));
        })
        .catch( (reason) => this.Logger.info(reason, 'Reject connect'));
    }
  }

  /**
   * @param {Discord.Guild} guild  The guild from which to disconnect
   */
  public stopRadio(guild: Discord.Guild): void {
    this.disconnect(guild);
  }

}












