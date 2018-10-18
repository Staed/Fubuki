import * as request from 'request-promise';

import LOGGER from '../util/Logger';
import MISC from '../util/Misc';
import config from '../config';
import Instruction from '../model/Instruction';
import DiscordMessage from '../model/DiscordMessage';

let prevImgId = null;

export class Booru {
  private Logger = new LOGGER('Booru');
  private Misc = new MISC();

  private useShortener: boolean;
  private shortenerUrl: string;
  private googleApiKey: string;

  private danbooruAuth: string;
  private danbooruUrl: string;
  private danbooruPath: string;

  private static endpoint: string = 'booru';

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
   * @param {string} text - The text portion of the reply
   * @param {string} imgUrl - The complete URL to the desired image link
   */
  private sendGoogleShortenerRequest(text: string, imgUrl: string): Promise<Instruction> {
    this.Logger.setMethod(this.sendGoogleShortenerRequest.name);

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

    return new Promise((resolve, reject) => {
      request(options)
      .then( (body) => {
        if (body.id != null) {
          this.Logger.verbose('shorten', 'Shortened url to ' + body.id);
          resolve(new Instruction(Booru.endpoint, text + body.id));
        } else {
          resolve(new Instruction(Booru.endpoint, text + imgUrl));
        }
      })
      .catch( (err) => {
        this.Logger.warn(err, 'Unable to shorten url, returning long form');
        reject(new Instruction(Booru.endpoint, text + imgUrl));
      });
    });
    
  }

  /**
   * @param {DISCORD.Message} message - A message object as defined in discord.js
   * @param {string[]} cmds
   */
  public getDanbooru(cmds: string[]): Promise<Instruction> {
    this.Logger.setMethod(this.getDanbooru.name);

    let tagList = this.cleanGet(cmds);
    if (prevImgId != null) {
        tagList += '+-id:' + prevImgId;
    }
    let options =
        this.Misc.getOptions(this.danbooruAuth, this.danbooruPath, tagList);

    return new Promise((resolve, reject) => {
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
          resolve(new Instruction(Booru.endpoint, tagStr + '\n' + imgUrl))
        } else {
          this.Logger.warn('NullPointer', 'Received a null pointer instead of array at index ' + selectedIdx + ' on ' + JSON.stringify(body));
          resolve(new Instruction(Booru.endpoint, 'No picture found'));
        }

        if (this.useShortener) {
          let text = decodeURIComponent(tagStr) + '\n';
          resolve(this.sendGoogleShortenerRequest(text, imgUrl));
        } else {
          resolve(new Instruction(Booru.endpoint, decodeURIComponent(tagStr) + '\n' + imgUrl));
        }
    })
    .catch( (err) => {
      console.error('Request Failed: ' + err);
      reject(new Instruction(Booru.endpoint, 'Request Failed. Try again.'));
    });
    });
  }

  /**
   * @param {DISCORD.Message} message - A message object as defined in discord.js
   */
  public deleteBooru(messages: DiscordMessage[]): string {
    this.Logger.setMethod(this.deleteBooru.name);

    for (let message of messages) {
      if (message.authorID == config.id && /\*\*Tags:\*\* .*\nhttps:.*/.test(message.content) == true) {
        return message.messageID;
      }
    }

    return null;
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