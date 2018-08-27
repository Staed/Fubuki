import * as DISCORD from 'discord.js';
import * as request from 'request-promise';

import LOGGER from '../util/Logger';
import * as misc from './misc';

let prevImgId = null;

export class Booru {
  private Logger = new LOGGER('Booru');

  private useShortener: boolean;
  private shortenerUrl: string;
  private googleApiKey: string;

  private danbooruAuth: string;
  private danbooruUrl: string;
  private danbooruPath: string;

  constructor(builder: BooruBuilder) {
    this.useShortener = builder.getUseShortener;
    this.shortenerUrl = builder.getShortenerUrl;
    this.googleApiKey = builder.getGoogleApiKey;
    this.danbooruAuth = builder.getDanbooruAuth;
    this.danbooruUrl = builder.getDanbooruUrl;
    this.danbooruPath = builder.getDanbooruPath;
  }

  /**
   * @param {string[]} cmds
   * @return {string}
   */
  private cleanGet(cmds: string[]): string {
    let tagArr = [];
    for (let val of cmds.slice(1)) {
      tagArr.push(encodeURIComponent(val));
    }
    return String(tagArr.join('+'));
  }

  /**
   * @param {message} message - A message object as defined in discord.js
   * @param {string} text - The text portion of the reply
   * @param {string} imgUrl - The complete URL to the desired image link
   */
  private sendGoogleShortenerRequest(message: DISCORD.Message, text: string, imgUrl: string) {
    this.Logger.setMethod('sendGoogleShortenerRequest');

    let options: request.Options = {
      method: 'POST',
      uri: this.shortenerUrl + '?key=' + this.googleApiKey,
      body: {
        'longUrl': imgUrl,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      json: true,
    };

    request(options)
      .then( (body) => {
        if (body.id != null) {
          this.Logger.verbose('shorten', 'Shortened url to ' + body.id);
          message.channel.send(text + body.id)
            .catch( (reason) => {
              this.Logger.info(reason, 'Short URL message');
            });
        } else {
          message.channel.send(text + imgUrl)
            .catch( (reason) => {
              this.Logger.info(reason, 'Full URL message');
            });
        }
      })
      .catch( (err) => {
        this.Logger.warn(err, 'Unable to shorten url, returning long form');
        message.channel.send(text + imgUrl)
          .catch( (reason) => {
            this.Logger.info(reason, 'URL message');
        });
      });
  }

  /**
   * @param {message} message - A message object as defined in discord.js
   * @param {string[]} cmds
   */
  public getDanbooru(message: DISCORD.Message, cmds: string[]) {
    this.Logger.setMethod('getDanbooru');

    let tagList = this.cleanGet(cmds);
    if (prevImgId != null) {
        tagList += '+-id:' + prevImgId;
    }
    let options =
        misc.getOptions(this.danbooruAuth, this.danbooruPath, tagList);

    request(options)
      .then( (body) => {
        let selectedIdx = Math.floor(Math.random() * (body.length));
        let tagStr = '**Tags:** ' + this.cleanGet(cmds).split('+').join(', ');
        let imgUrl;

        if (body != null && body[selectedIdx] != null) {
          imgUrl = body[selectedIdx].file_url;
          if (!imgUrl.match(/http.*/)) {
            imgUrl = this.danbooruUrl + imgUrl;
          }
          prevImgId = body[selectedIdx].id;
        } else {
          message.channel.send('No picture found')
            .catch( (reason) => {
              this.Logger.info(reason, 'Reject no picture');
            });
          this.Logger.warn('NullPointer', 'Received a null pointer instead of array at index ' + selectedIdx + ' on ' + JSON.stringify(body));
          return;
        }

        if (this.useShortener) {
          let text = decodeURIComponent(tagStr) + '\n';
          this.sendGoogleShortenerRequest(message, text, imgUrl);
        } else {
          message.channel.send(decodeURIComponent(tagStr) + '\n' + imgUrl)
            .catch( (reason) => {
              this.Logger.info(reason, 'Reject booru URL');
            });
        }
    })
    .catch( (err) => {
      return console.error('Request Failed: ' + err);
      message.channel.send('Request Failed. Try again.')
        .catch( (reason) => {
          this.Logger.info(reason, 'Reject request fail');
        });
    });
  }

}

export class BooruBuilder {
  private useShortener: boolean;
  private shortenerUrl: string;
  private googleApiKey: string;

  private danbooruAuth: string;
  private danbooruUrl: string;
  private danbooruPath: string;

  constructor(useShortener: boolean) {
    this.useShortener = useShortener;
    return this;
  }

  get getUseShortener() {
    return this.useShortener;
  }

  public setShortenerUrl(shortenerUrl: string): BooruBuilder {
    this.shortenerUrl = shortenerUrl;
    return this;
  }

  get getShortenerUrl() {
    return this.shortenerUrl;
  }

  public setGoogleApiKey(googleApiKey: string): BooruBuilder {
    this.googleApiKey = googleApiKey;
    return this;
  }

  get getGoogleApiKey() {
    return this.googleApiKey;
  }

  public setDanbooruAuth(danbooruAuth: string): BooruBuilder {
    this.danbooruAuth = danbooruAuth;
    return this;
  }

  get getDanbooruAuth() {
    return this.danbooruAuth;
  }

  public setDanbooruUrl(danbooruUrl: string): BooruBuilder {
    this.danbooruUrl = danbooruUrl;
    return this;
  }

  get getDanbooruUrl() {
    return this.danbooruUrl;
  }

  public setDanbooruPath(danbooruPath: string): BooruBuilder {
    this.danbooruPath = danbooruPath;
    return this;
  }

  get getDanbooruPath() {
    return this.danbooruPath;
  }

  public build(): Booru {
    return new Booru(this);
  }
}