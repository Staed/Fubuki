/**
 * @fileoverview This file contains functions that return a formated "quote"
 * of the company associated with the ticker name passed in.
 * @package request-promise cheerio yahoo-finance
 */

let config = require('../config');
let request = require('request-promise');
let cheerio = require('cheerio');
let yahooFinance = require('yahoo-finance');
let misc = require('./misc.js');

/**
 * Upon recieving a call to this function, it attempts to respond with the
 * corresponding API call.
 *
 * @param {message} message - The original message object prompting this call
 * @param {string} apiName - Name of the stock API to use
 * @param {string} company - Ticker symbol for a company on the stock market
 */
 function getStock(message, apiName, company) {
   switch (apiName) {
    case 'bloomberg':
      getBloomberg(message, company);
      break;
    case 'yahoo':
      getYahoo(message, company);
      break;
    case 'google':
      getGoogle(message, company);
      break;
    default:
      message.channel.send('Only \"bloomberg\", \"yahoo\", \"google\" ' +
                           'API calls are accepted right now')
        .catch( (reason) => {
          console.log('Rejected Stock API Promise for ' + reason);
        });
   }
 }

 /**
  * Using the yahoo-finance module, this function extracts the desired info
  * into a string. the string reply is formatted into a table by padding.
  *
  * @param {message} message - The original message object prompting this call
  * @param {string} company - Ticker symbol for a company on the stock market
  */
  function getYahoo(message, company) {
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

      /**
       * TODO: Consider iterating through {@code detail} and {@code stats}
       * This would be to check for and correct all undefined values.
       */
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
        .catch( (reason) => {
          console.log('Rejected Stock YahooHeader Promise for ' + reason);
        });
      message.channel.send(output)
        .catch( (reason) => {
          console.log('Rejected Stock YahooPrint Promise for ' + reason);
      });
    });
  }

 /**
  * Because there's a lack of a decent Google Finance API due to the offical
  * API having been disabled by Google, this function pieces together the
  * stock quote via web scraping. The resulting data is formatted into a
  * table via padding and sent by {@code message.channel.send()}
  *
  * @param {message} message - The original message object prompting this call
  * @param {string} company - Ticker symbol for a company on the stock market
  */
function getGoogle(message, company) {
  let options =
      misc.getOptions(config.google_path, config.google_finance, company);

  request(options)
    .then( (body) => {
      $ = cheerio.load(body);

      let noMatch =
          $('.g-doc').find('.g-section').last().parent().parent().parent();
      let noTag = noMatch.children().last().text().trim();

      if (noTag.match(/no matches/)) {
        console.log('No such ticker name');
        message.channel.send('I couldn\'t find a company with that ticker name')
          .catch( (reason) => {
            console.log('Rejected Stock GoogleFail Promise for ' + reason);
          });
        return;
      }

      // Begin scraping from the Google Finance website
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

      // Format the data gotten into a tidy string table, then reply with it
      let output = '```';
      for (let i = 0; i < data.length - 1; i += 2) {
        output += misc.padRight(data[i][0], 12) + ' ';
        output += misc.padRight(data[i][1], 23) + ' ';
        output += misc.padRight(data[i+1][0], 13) + ' ' + data[i+1][1] + '\n';
      }
      output += '```';

      if (output.slice(3, output.length - 3).trim().length < 1) {
        output = '``` No Data Found ```';
      }

      let logText = 'Recieved request for Google stock data of ';
      logText += company.toUpperCase() + ' aka ' + name;
      console.log(logText);

      message.channel.send(header)
        .catch( (reason) => {
          console.log('Rejected Stock GoogleHeader Promise for ' + reason);
        });
      message.channel.send(output)
        .catch( (reason) => {
          console.log('Rejected Stock GooglePrint Promise for ' + reason);
        });
    })
    .catch( (err) => {
      console.log('Failed Stock GoogleRequest Promise for ' + err);
      message.channel.send('Query timed out')
        .catch( (reason) => {
          console.log('Rejected Stock GoogleRequestReject Promise for ' +
                      reason);
        });
    });
}

 /**
  * Much like {@code getGoogle()}, this function gathers the necessary stock
  * quote information by web scraping. This is due to the offical Bloomberg API
  * requiring payment and Fubuki is meant to be free as in speech.
  * @see getGoogle
  *
  * @param {message} message - A message object as defined in discord.js
  * @param {string} company - Ticker symbol for a company on the stock market
  */
 function getBloomberg(message, company) {
   if (company == undefined) {
     console.log('No ticker symbol specified');
     message.channel.send('You need to specify the ticker symbol and ' +
                          'exchange of the company I\'m looking for!')
      .catch( (reason) => {
        console.log('Rejected Stock BloombergReject Promise for ' + reason);
      });
     return;
   }

   let options =
      misc.getOptions(config.bloomberg_path, config.bloomberg_quote, company);

   request(options)
     .then( (body) => {
       $ = cheerio.load(body);

       let noTag = $('.container .premium__message').text().trim();
       if (noTag.match(/The search for .*/)) {
         console.log('No such tag');
         message.channel.send('I couldn\'t find a company with that ' +
                              'ticker name and exchange')
           .catch( (reason) => {
             console.log('Rejected Stock BloombergFail Promise for ' + reason);
           });
         return;
       }

       // Begin scraping from Bloomberg's website
       let name = $('.basic-quote h1.name').text().trim();
       let currency =
          $('.basic-quote .price-container .currency').text().trim();
       let currentPrice =
          $('.basic-quote .price-container .price').text().trim();
       let header = '**' + name + '**, currently at ' +
                    currentPrice + ' ' + currency;

       let data = [];

       let table = $('.data-table_detailed');
       table.find('.cell').each( (i, cell) => {
         let label = $(cell).find('.cell__label').text().trim();
         let value = $(cell).find('.cell__value').text().trim();

         // Shorten the labels so they don't take up too much space in the table
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

       // Format the data gotten into a tidy string table, then reply with it
       let output = '```';
       for (let i = 0; i < data.length - 1; i += 2) {
         output += misc.padRight(data[i][0], 17) + ' ';
         output += misc.padRight(data[i][1], 20) + ' ';
         output += misc.padRight(data[i+1][0], 20) + ' ' + data[i+1][1] + '\n';
       }
       output += '```';

       console.log('Recieved request for Bloomberg stock data of ' +
                   company.toUpperCase() + ' aka ' + name);
       message.channel.send(header)
         .catch( (reason) => {
           console.log('Rejected Stock BloombergHeader Promise for ' + reason);
         });
       message.channel.send(output)
         .catch( (reason) => {
           console.log('Rejected Stock BloomBergPrint Promise for ' + reason);
         });
     })
     .catch( (err) => {
       console.log('Failed Stock BloombergRequest Promise for ' + err);
       message.channel.send('Query timed out')
         .catch( (reason) => {
           console.log('Rejected Stock BloombergRequestReject Promise for ' +
                       reason);
         });
     });
 }

  module.exports = {getStock};
