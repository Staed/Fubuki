import * as request from 'request-promise';
import * as Discord from 'discord.js';

import config from '../config';
import LOGGER from '../util/Logger';
import Instruction from '../model/Instruction';

export default class Anime {
  private Logger = new LOGGER('Anime');
  private aniListToken;

  /**
   * Asks AniList for a token and then runs either aniListAiring() or
   * aniListSpecific()
   * @param {string} queryType Which function to run upon completion
   * @param {Discord.Message} message A message object as defined in discord.js
   * @param {string} title The title of the specific show wanted, or null.
   */
  private aniListQuery(queryType: string, title: string): Promise<Instruction> {
    this.Logger.setMethod(this.aniListQuery.name);
    
    return new Promise((resolve, reject) => {
      if (this.aniListToken != null && this.aniListToken.expires > (Date.now()/1000 - 60)) {
        if ('airing' == queryType.toLowerCase()) {
          resolve(this.aniListAiring());
        } else if ('specific' == queryType.toLowerCase()) {
          resolve(this.aniListSpecific(title));
        } else {
          this.Logger.verbose('invalid', 'Invalid queryType in aniListQuery with token');
          reject(null);
        }
      }
  
      let authUri = config.anilist_path + 'auth/access_token?' + config.anilist_grant + '&' + config.anilist_id + '&' + config.anilist_secret;
  
      let authOptions: request.Options = {
        method: 'POST',
        uri: authUri,
        json: true,
      } as request.Options;
      
      request(authOptions)
        .then((body) => {
          this.aniListToken = {'access_token': body.access_token, 'expires': body.expires};
      
          if ('airing' == queryType.toLowerCase()) {
            resolve(this.aniListAiring());
          } else if ('specific' == queryType.toLowerCase()) {
            resolve(this.aniListSpecific(title));
          } else {
            this.Logger.verbose('invalid', 'Invalid queryType in aniListQuery without token');
            reject(null);
          }
        })
        .catch((reason) => {
          this.Logger.info(reason, 'Reject message');
          reject(null);
        });
    });
  }
  
  /**
   * @param {Discord.Message} message A message object as defined in discord.js
   */
  private aniListAiring(): Promise<Instruction> {
    this.Logger.setMethod(this.aniListAiring.name);
  
    let tdy = new Date();
    let mth = tdy.getMonth();
    let season = 'Winter';
    if (mth > 3 && mth <= 6) {
      season = 'Spring';
    } else if (mth > 6 && mth <= 9) {
      season = 'Summer';
    } else if (mth > 9) {
      season = 'Fall';
    }
  
    let airingOptions: request.Options = {
      method: 'GET',
      uri: config.anilist_path + 'browse/anime?sort=popularity-desc&year='
           + tdy.getFullYear() + '&type=Tv&season=' + season +
           '&access_token=' + this.aniListToken.access_token + '&full_page=true',
      json: true,
    } as request.Options;
  
    return new Promise((resolve, reject) => {
      request(airingOptions)
        .then((body) => {
          let resultString = [];
          let resultArray = body;
    
          let ct = 1;
          for (let element of resultArray) {
            if (!element.genres.includes('Hentai') &&
                resultString.toString().length < 2000) {
              resultString.push('**' + ct + '.** ' + element.title_english);
              ct += 1;
            }
          }
          if (resultString.toString().length > 2000) {
            resultString.pop();
            resolve(new Instruction('season', 'Search results truncated due to length...'));
          }
    
          resolve(new Instruction('season', resultString.join('\n')));
        })
        .catch((reason) => {
          this.Logger.info(reason, 'Reject request message')
          reject(null);
        });
    });
  }
  
  /**
   * @param {Discord.Message} message A message object as defined in discord.js
   */
  public season(): Promise<Instruction> {
    return this.aniListQuery('airing', null);
  }
  
  /**
   * @param {Discord.Message} message A message object as defined in discord.js
   * @param {string} title A string containing the title of the show
   */
  private aniListSpecific(title: string): Promise<Instruction> {
    this.Logger.setMethod(this.aniListSpecific.name);
  
    let queryUri = config.anilist_path + 'anime/search/' + title + '?access_token=' + this.aniListToken.access_token;
  
    let queryOptions: request.Options = {
      method: 'GET',
      uri: queryUri,
      json: true,
    } as request.Options;
  
    return new Promise((resolve, reject) => {
      request(queryOptions)
      .then((body) => {
        if (body == null || body == '') {
          resolve(new Instruction('anime', 'I couldn\'t find that anime.'));
        }
        
        let text = '';
        let showInfo = body[0];
    
        text += '**' + showInfo.title_english + '**';
        text += '\n**Status:** ' + showInfo.airing_status;
        text += '\n**Description:** ' + showInfo.description.replace(/<br>/g, '\n').replace(/(\n)+/g, '\n');
    
        let startTime = String(showInfo.start_date_fuzzy);
        let date = parseInt(startTime.substring(6, ));
        let month = parseInt(startTime.substring(4, 6));
        let year = parseInt(startTime.substring(0, 4));
        let timeString = new Date(year, month, date);
        let timeOptions = {month: 'long', day: 'numeric', year: 'numeric'};
        text += '\n**Starting around:** ';
        text += timeString.toLocaleDateString('en-US', timeOptions);
        text += '\n' + showInfo.image_url_lge;
    
        resolve(new Instruction('anime', text));
      })
      .catch((reason) => {
        this.Logger.info(reason, 'Reject request message');
        reject(null);
      });
    });
  }

  /**
   * @param {Discord.Message} message A message object as defined in discord.js
   */
  public aninfo(title: string): Promise<Instruction> {
      return this.aniListQuery('specific', title);
  }
}