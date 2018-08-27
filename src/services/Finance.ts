import * as request from 'request-promise';
import * as cheerio from 'cheerio';
import * as yahooFinance from 'yahoo-finance';
import * as DISCORD from 'discord.js';

import config from '../config';
import LOGGER from '../util/Logger';
import * as misc from './misc';

export default class Finance {
  private Logger = new LOGGER('Finance');

  /**
   * @param {message} message - A message object as defined in discord.js
   * @param {string} apiName - Name of the stock API to use
   * @param {string} company - Ticker symbol for a company on the stock market
   */
  public getStock(message: DISCORD.Message, apiName: string, company: string) {
    const func = 'getStock';

    switch (apiName) {
      case 'bloomberg':
        this.getBloomberg(message, company);
        break;
      case 'yahoo':
        this.getYahoo(message, company);
        break;
      case 'google':
        this.getGoogle(message, company);
        break;
      default:
        message.channel.send('Only \"bloomberg\", \"yahoo\", \"google\" ' +
          'API calls are accepted right now')
          .catch((reason) => {
            this.Logger.info(reason, 'Invalid stock API message');
          });
    }
  }

  /**
   * @param {message} message - A message object as defined in discord.js
   * @param {string} company - Ticker symbol for a company on the stock market
   */
  private getYahoo(message, company) {
    this.Logger.setMethod('getYahoo');

    yahooFinance.quote({
      symbol: company,
      modules: ['price', 'summaryDetail',
        'summaryProfile', 'defaultKeyStatistics'],
    }, (err, quotes) => {
      let detail = quotes.summaryDetail;
      let stats = quotes.defaultKeyStatistics;

      let header = quotes.price.longName;
      if (header == undefined) {
        header = quotes.price.shortName;
        header = header.replace(/,.*/, '').trim();
      }

      if (stats == undefined) {
        stats = {trailingEps: ' - '};
      }

      let data = [
        ['Previous Close', detail.previousClose,
          'Market Cap', detail.marketCap],
        ['Open', detail.open, 'Beta', detail.beta],
        ['Bid', detail.bid, 'PE Ratio (TTM)', detail.trailingPE],
        ['Ask', detail.ask, 'EPS (TTM)', stats.trailingEps],
        ['Day\'s Range',
          detail.regularMarketDayLow + ' - ' + detail.regularMarketDayHigh,
          '52 Week Range',
          detail.fiftyTwoWeekLow + ' - ' + detail.fiftyTwoWeekHigh],
        ['Volume', detail.volume, 'Avg. Volume', detail.averageVolume],
      ];

      let output = '```';
      for (let i = 0; i < data.length; i++) {
        output += misc.padRight(data[i][0].toString(), 15) + ' ';
        output += misc.padRight(data[i][1].toString(), 25) + ' ';
        output += misc.padRight(data[i][2].toString(), 15) + ' ';
        output += data[i][3] + '\n';
      }
      output += '```';

      message.channel.send('**' + header + ' (' + company.toUpperCase() + ')**')
        .catch((reason) => {
          this.Logger.info(reason, 'Stock header message');
        });
      message.channel.send(output)
        .catch((reason) => {
          this.Logger.info(reason, 'Stock information message');
        });
    });
  }

  /**
   * @param {message} message - A message object as defined in discord.js
   * @param {string} company - Ticker symbol for a company on the stock market
   */
  private getGoogle(message, company) {
    this.Logger.setMethod('getGoogle');

    let options =
      misc.getOptions(config.google_path, config.google_finance, company);

    request(options)
      .then((body) => {
        const $ = cheerio.load(body);

        let noMatch =
          $('.g-doc').find('.g-section').last().parent().parent().parent();
        let noTag = noMatch.children().last().text().trim();

        if (noTag.match(/no matches/)) {
          this.Logger.verbose('bad match', 'No such ticker name');
          message.channel.send('I couldn\'t find a company with that ticker name')
            .catch((reason) => {
              this.Logger.info(reason, 'Company not found message');
            });
          return;
        }

        let name = $('div[id=companyheader]').find('.g-first h3').text();
        name = name.replace(/\xA0.*/, '').trim();

        let marketData = $('.id-market-data-div');
        let currentPrice = marketData.find('.id-price-panel .pr').text().trim();
        let header = '**' + name + '**, currently at ' + currentPrice;

        let divYield = 'td[data-snapfield=latest_dividend-dividend_yield]';

        let data = [
          ['Range', $('td[data-snapfield=range]').next().text().trim()],
          ['Div/Yield', $(divYield).next().text().trim()],
          ['52 Week', $('td[data-snapfield=range_52week]').next().text().trim()],
          ['EPS', $('td[data-snapfield=eps]').next().text().trim()],
          ['Open', $('td[data-snapfield=open]').next().text().trim()],
          ['Shares', $('td[data-snapfield=shares]').next().text().trim()],
          ['Vol / Avg', $('td[data-snapfield=vol_and_avg]').next().text().trim()],
          ['Beta', $('td[data-snapfield=beta]').next().text().trim()],
          ['Market Cap', $('td[data-snapfield=market_cap]').next().text().trim()],
          ['P/E', $('td[data-snapfield=pe_ratio]').next().text().trim()],
        ];

        let output = '```';
        for (let i = 0; i < data.length - 1; i += 2) {
          output += misc.padRight(data[i][0], 12) + ' ';
          output += misc.padRight(data[i][1], 23) + ' ';
          output += misc.padRight(data[i + 1][0], 13) + ' ';
          output += data[i + 1][1] + '\n';
        }
        output += '```';

        if (output.slice(3, output.length - 3).trim().length < 1) {
          output = '``` No Data Found ```';
        }

        this.Logger.verbose('request', 
          'Received request for Google stock data of ' +
          company.toUpperCase() + ' aka ' + name);

        message.channel.send(header)
          .catch((reason) => {
            this.Logger.info(reason, 'Stock header message');
          });
        message.channel.send(output)
          .catch((reason) => {
            this.Logger.info(reason, 'Stock information message');
          });
      })
      .catch((err) => {
        this.Logger.warn(err, 'Request stock failed');
        message.channel.send('Query timed out')
          .catch((reason) => {
            this.Logger.info(reason, 'Query timed out message');
          });
      });
  }

  /**
   * @param {message} message - A message object as defined in discord.js
   * @param {string} company - Ticker symbol for a company on the stock market
   */
  private getBloomberg(message, company) {
    this.Logger.setMethod('getBloomberg');

    if (company == undefined) {
      this.Logger.warn('undefined', 'No ticker specified');
      message.channel.send('You need to specify the ticker symbol and ' +
        'exchange of the company I\'m looking for!')
        .catch((reason) => {
          this.Logger.info(reason, 'Invalid company message');
        });
      return;
    }

    let options =
      misc.getOptions(config.bloomberg_path, config.bloomberg_quote, company);

    request(options)
      .then((body) => {
        const $ = cheerio.load(body);

        let noTag = $('.container .premium__message').text().trim();
        if (noTag.match(/The search for .*/)) {
          this.Logger.warn('bad match', 'No such tag');
          message.channel.send('I couldn\'t find a company with that ' +
            'ticker name and exchange')
            .catch((reason) => {
              this.Logger.info(reason, 'Company not found message');
            });
          return;
        }

        let name = $('.basic-quote h1.name').text().trim();
        let currency =
          $('.basic-quote .price-container .currency').text().trim();
        let currentPrice =
          $('.basic-quote .price-container .price').text().trim();
        let header = '**' + name + '**, currently at ' +
          currentPrice + ' ' + currency;

        let data = [];

        let table = $('.data-table_detailed');
        table.find('.cell').each((i, cell) => {
          let label = $(cell).find('.cell__label').text().trim();
          let value = $(cell).find('.cell__value').text().trim();

          if (/Earnings per Share/.test(label)) {
            label = 'EPS (USD) (TTM)';
          }
          if (/Shares Outstanding/.test(label)) {
            label = 'Shares (m)';
          }
          if (/Current P\/E Ratio/.test(label)) {
            label = 'PE Ratio (TTM)';
          }

          data.push([label, value]);
        });

        let output = '```';
        for (let i = 0; i < data.length - 1; i += 2) {
          output += misc.padRight(data[i][0], 17) + ' ';
          output += misc.padRight(data[i][1], 20) + ' ';
          output += misc.padRight(data[i + 1][0], 20) + ' ';
          output += data[i + 1][1] + '\n';
        }
        output += '```';

        this.Logger.verbose('request', 
          'Received request for Bloomberg stock data of ' +
          company.toUpperCase() + ' aka ' + name);
        message.channel.send(header)
          .catch((reason) => {
            this.Logger.info(reason, 'Stock header message');
          });
        message.channel.send(output)
          .catch((reason) => {
            this.Logger.info(reason, 'Stock information message');
          });
      })
      .catch((reason) => {
        this.Logger.info(reason, 'Request stock failed');
        message.channel.send('Query timed out')
          .catch((reason) => {
            this.Logger.info(reason, 'Query timed out message');
          });
      });
  }
}
