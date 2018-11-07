import * as ytdl from 'ytdl-core';
import * as std from 'tstl';

import config from '../config';
import Logger from '../util/Logger';
import * as Discord from 'discord.js';
import Instruction from '../model/Instruction';

export default class MusicPlayer {
  private Logger: Logger = new Logger('MusicPlayer');

  private playlistQueue = new std.Queue<string>();
  private dispatcher = null;

  private defaultYoutubeHeader = /http(s?):\/\/(www.)?youtube.com\/watch\?v=/;
  private shortYoutubeHeader = /http(s?):\/\/youtu.be\//;

  /** Connects to a voice channel
   * @param {Discord.Collection<string, Discord.GuildChannel>} channels The channels associated with this Guild
   * @return {Promise<Discord.VoiceConnection>} VoiceConnection Promise
   */
  public connect(channels: Discord.Collection<string, Discord.GuildChannel>): Promise<Discord.VoiceConnection> {
    this.Logger.setMethod(this.connect.name);

    try {
      let sb = '';
      channels.forEach(channel => sb += channel.name + '[' + channel.type + ']' + ', ')
      this.Logger.verbose('Listing Connections', sb);

      let voiceJoin: Discord.VoiceChannel = channels.find((val) => val.name === config.default_channel && val.type === 'voice') as Discord.VoiceChannel;
      if (voiceJoin === null) {
        voiceJoin = channels.find((val) => val.type === 'voice') as Discord.VoiceChannel;
      }

      if(voiceJoin.connection !== null) {
        return new Promise((resolve, reject) => resolve(voiceJoin.connection));
      }

      this.Logger.verbose('Voice Channel', voiceJoin.name);

      if (voiceJoin === null) {
        this.Logger.warn('null', 'Unable to find a voice channel.');
        return null;
      } else if (voiceJoin.joinable === false) {
        this.Logger.warn('false', 'No permission to join');
        return null;
      } else {
        return voiceJoin.join();
      }
    } catch (err) { this.Logger.error(err, 'Connect?') };
  }

  /** Ends the voice channel and clears the playlist queue
   * @param {string} name The guild name
   * @param {Discord.VoiceConnection} connection The current voice connection
   */
  public disconnect(name: string, connection: Discord.VoiceConnection): void {
    this.Logger.setMethod(this.disconnect.name);

    if (connection !== null) {
      connection.channel.leave();

      this.Logger.verbose('', 'Left the voice channel in ' + name);
      this.playlistQueue = new std.Queue();
    }
  }

  /**
   * 
   * @param videoUrl 
   */
  public addToQueue(videoUrl: string): void {
    this.Logger.setMethod(this.addToQueue.name);

    if (this.defaultYoutubeHeader.test(videoUrl) || this.shortYoutubeHeader.test(videoUrl))
      this.playlistQueue.push(videoUrl);
  }

  public getQueueSize(): number {
    return this.playlistQueue.size();
  }

  /**
   * 
   * @param {Discord.VoiceConnection} connection The current voice connection to the guild
   * @param {Discord.TextChannel} channel The channel where the request came from
   */
  public play(connection: Discord.VoiceConnection, channel: Discord.TextChannel): void {
    this.Logger.setMethod(this.play.name);

    if (this.playlistQueue.front() !== null) {
      let curVideo = this.playlistQueue.front();

      const STREAM = ytdl(curVideo, {filter: 'audioonly'});
      const STREAMOPTIONS = {seek: 0, volume: 1};

      this.dispatcher = connection.playStream(STREAM, STREAMOPTIONS);
      this.dispatcher.on('end', () => {
        this.playlistQueue.pop();
        this.play(connection, channel);
      })

      ytdl.getInfo(curVideo)
      .then(info => {
        const minutes = Math.floor(Number.parseInt(info.length_seconds)/60);
        const seconds = Number.parseInt(info.length_seconds)%60;
        const videoCode = this.defaultYoutubeHeader.test(curVideo) ? curVideo.replace(this.defaultYoutubeHeader, '') : curVideo.replace(this.shortYoutubeHeader, '');

        this.Logger.verbose(`Now playing ${videoCode}`, 'play');
        channel.send(`:play_pause: Playing **${info.title}** [Length: ${minutes}:${seconds}]\n(${videoCode}) ${info.thumbnail_url}`);
      })
      .catch(err => this.Logger.error(err, 'play'));
    }
  }

  /**
   * Terminates the current playback and pops the front of the playlist queue
   */
  public skip(): Instruction {
    this.Logger.setMethod(this.skip.name);

    this.Logger.verbose('skip', this.playlistQueue.front().replace(this.defaultYoutubeHeader, '').replace(this.shortYoutubeHeader, '') + ' skipped');
    this.dispatcher.end();

    return new Instruction('skip', 'Skipping song');
  }

  /**
   * Adds a copy of the video at the front of the playlist queue to end of the queue
   */
  public repeat(): Instruction {
    this.Logger.setMethod(this.repeat.name);

    if (this.playlistQueue.empty()) {
      return null;
    } else {
      const curVideo = this.playlistQueue.front();
      const videoCode = this.defaultYoutubeHeader.test(curVideo) ? curVideo.replace(this.defaultYoutubeHeader, '') : curVideo.replace(this.shortYoutubeHeader, '');

      this.playlistQueue.push(curVideo);
      

      this.Logger.verbose('add', `Added ${videoCode} to the queue`);
      ytdl.getInfo(curVideo)
      .then(info => {
        return new Instruction('repeat', `Added **${info.title}** to the queue.`);
      })
      .catch(err => this.Logger.verbose(err, 'No metainfo found'));
    }
  }

  /**
   * Returns the video at the front of the playlist queue
   */
  public nowPlaying(): Instruction {
    this.Logger.setMethod(this.nowPlaying.name);

    if (this.playlistQueue.empty()) {
      return new Instruction('nowplaying', 'Nothing is being played but my heart.');
    } else {
      const curVideo = this.playlistQueue.front();

      ytdl.getInfo(curVideo)
      .then(info => {
        const videoCode = this.defaultYoutubeHeader.test(curVideo) ? curVideo.replace(this.defaultYoutubeHeader, '') : curVideo.replace(this.shortYoutubeHeader, '');
        const playbackInfo = `Now playing **${info.title}**\n(${videoCode}) ${info.thumbnail_url}`;
        return new Instruction('nowplaying', playbackInfo);
      });
    }
  }

  /**
   * @param videoUrl The URL to the Radio
   * @param connection The active voice connection
   * @param channel The channel from which the request originated
   */
  public radio(videoUrl: string, connection: Discord.VoiceConnection, channel: Discord.TextChannel): void {
    this.Logger.setMethod(this.radio.name);

    if (this.defaultYoutubeHeader.test(videoUrl) || this.shortYoutubeHeader.test(videoUrl)) {
      this.playlistQueue = new std.Queue();

      const stream = ytdl(videoUrl, {quality: '94'});
      this.dispatcher = connection.playStream(stream, { seek: 0, volume: 1 });

      channel.send('Cleared the playlist to play the radio')
        .catch((reason) => this.Logger.info(reason, 'Reject clear'));

      ytdl.getBasicInfo(videoUrl)
        .then(info => {
          const videoCode = this.defaultYoutubeHeader.test(videoUrl) ? videoUrl.replace(this.defaultYoutubeHeader, '') : videoUrl.replace(this.shortYoutubeHeader, '');
          let playbackInfo = `:play_pause: Playing radio at **${info.title} (${videoCode}) ${info.thumbnail_url}`;

          channel.send(playbackInfo)
            .catch((reason) => this.Logger.info(reason, 'Reject get info'));
        })
        .catch((err) => this.Logger.warn(err, 'Unable to get Live Stream info'));

      this.dispatcher.on('end', () => {
        this.dispatcher = null;
        this.play(connection, channel);
      });

      this.dispatcher.on('error', (err) => this.Logger.warn(err, 'Dispatcher on failure'));
    } else {
      channel.send('Sorry, but I can only play youtube live streams for now')
        .catch((reason) => this.Logger.warn(reason, 'Reject non-youtube request'));
    }
  }

  /**
   * @param {Discord.Guild} guild  The guild from which to disconnect
   */
  public stopRadio(guild: Discord.Guild): void {
    this.disconnect(guild.name, guild.voiceConnection);
  }

}












