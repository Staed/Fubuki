import * as Discord from 'discord.js';
import * as request from 'request-promise';

import LOGGER from '../util/Logger';
import config from '../config';

export default class UrbanDictionary {
    private Logger = new LOGGER('UrbanDictionary');
    
    /**
     *  @param {Discord.Message} message - A message object as defined in discord.js
     *  @param {string[]} cmds
     */
    public getDefinition(message: Discord.Message, cmds: string[]) {
        this.Logger.setMethod('getDefinition');

        const term = cmds.slice(1).join('+');

        const options = {
            uri: config.urban_url + term,
            json: true,
        } as request.Options;

        request(options)
            .then((body) => {
                if (body.result_type == 'no_results') {
                    message.channel.send('There are no results for: ' + term.replace('+', ' '))
                        .catch( (reason) => this.Logger.info(reason, 'No result message'));
                } else {
                    let firstDef = body.list[0];
                    message.channel.send('**' + cmds.slice(1).join(' ') + ':**\n' + firstDef.definition + '\n' + firstDef.example)
                        .catch( (reason) => this.Logger.info(reason, 'Definition message'));
                }
            })
            .catch((err) => {
                this.Logger.warn(err, 'Access API Error');
                message.channel.send('Error accessing Urban Dictionary')
                    .catch( (reason) => this.Logger.info(reason, 'Reject message'));
            });
    }

}