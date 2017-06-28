let config = require('./config');
let request = require('request-promise');
let cheerio = require('cheerio');
let yahoo_finance = require('yahoo-finance');

let misc = require('./misc.js');

/**
 * @param {message} message  A message object as defined in discord.js
 * @param {string} api_name  A string containing the name of the stock API to use
 * @param {string} company  A string containing the ticker symbol for a company on the stock market
 */
 function getStock(message, api_name, company) {
   switch(api_name) {
    case "bloomberg":
      getBloomberg(message, company);
      break;
    case "yahoo":
      getYahoo(message, company);
      break;
    case "google":
      getGoogle(message, company);
      break;
    default:
      message.channel.send("Only \"bloomberg\", \"yahoo\", \"google\" API calls are accepted right now")
        .catch( reason => { console.log("Rejected Stock API Promise for " + reason); });
   }
 }

 /**
  * @param {message} message  A message object as defined in discord.js
  * @param {string} company  A string containing the ticker symbol for a company on the stock market
  */
  function getYahoo(message, company) {
    yahoo_finance.quote({
      symbol: company,
      modules: [ 'price', 'summaryDetail', 'summaryProfile', 'defaultKeyStatistics' ]
    }, function (err, quotes) {
      //console.log(quotes);

      let detail = quotes.summaryDetail;
      let stats = quotes.defaultKeyStatistics;

      let header = quotes.price.longName; // + quotes.summaryProfile.longBusinessSummary + "\n\n";

      let data = [
        ["Previous Close", detail.previousClose, "Market Cap", detail.marketCap],
        ["Open", detail.open, "Beta", detail.beta],
        ["Bid", detail.bid, "PE Ratio (TTM)", detail.trailingPE],
        ["Ask", detail.ask, "EPS (TTM)", stats.trailingEps],
        ["Day's Range", detail.regularMarketDayLow + " - " + detail.regularMarketDayHigh, "52 Week Range", detail.fiftyTwoWeekLow + " - " + detail.fiftyTwoWeekHigh],
        ["Volume", detail.volume, "Avg. Volume", detail.averageVolume]
      ]

      let output = "```";
      for (let i = 0; i < data.length; i++) {
        output += misc.padRight(data[i][0].toString(), 15) + " ";
        output += misc.padRight(data[i][1].toString(), 25) + " ";
        output += misc.padRight(data[i][2].toString(), 15) + " " + data[i][3] + "\n";
      }
      output += "```";

      message.channel.send("**" + header + " (" + company.toUpperCase() + ")**")
        .catch( reason => { console.log("Rejected Stock YahooHeader Promise for " + reason); });
      message.channel.send(output)
        .catch( reason => { console.log("Rejected Stock YahooPrint Promise for " + reason); });
    });
  }

 /**
  * @param {message} message  A message object as defined in discord.js
  * @param {string} company  A string containing the ticker symbol for a company on the stock market
  */
function getGoogle(message, company) {
  let options = misc.getOptions(config.google_path, config.google_finance, company);

  request(options)
    .then(function (body) {
      $ = cheerio.load(body);

      let no_match = $('.g-doc').find('.g-section').last().parent().parent().parent();
      let no_tag = no_match.children().last().text().trim();

      if (no_tag.match(/no matches/)) {
        console.log("No such ticker name");
        message.channel.send("I couldn't find a company with that ticker name")
          .catch( reason => { console.log("Rejected Stock GoogleFail Promise for " + reason); });
        return;
      }

      let market_data = $('.id-market-data-div');;

      let name = $('.g-wrap .g-section .hdg').attr('id', 'companyheader').find('.g-first h3').text().trim();
      let current_price = market_data.find('.id-price-panel .pr').text().trim();
      let header = "**" + name + "**, currently at " + current_price;

      let stock_info = market_data.find('.snap-panel-and-plusone .snap-panel .snap-data');
      let first_row = stock_info.find('tr');
      let second_row = stock_info.next().find('tr');

      let data = [];

      first_row.each(function(cell) {
        let label = $(this).find('.key').text().trim();
        let value = $(this).find('.val').text().trim();

        data.push([label, value]);
      });

      second_row.each(function(cell) {
        let label = $(this).find('.key').text().trim();
        let value = $(this).find('.val').text().trim();

        data.push([label, value]);
      });

      let output = "```";
      for (let i = 0; i < data.length - 1; i += 2) {
        output += misc.padRight(data[i][0], 12) + " ";
        output += misc.padRight(data[i][1], 23) + " ";
        output += misc.padRight(data[i+1][0], 13) + " " + data[i+1][1] + "\n";
      }
      output += "```";

      console.log("Recieved request for Google stock data of " + company.toUpperCase() + " aka " + name);
      message.channel.send(header)
        .catch( reason => { console.log("Rejected Stock GoogleHeader Promise for " + reason); });
      message.channel.send(output)
        .catch( reason => { console.log("Rejected Stock GooglePrint Promise for " + reason); });
    })
    .catch(function (err) {
      console.log("Failed Stock GoogleRequest Promise for " + err);
      message.channel.send("Query timed out")
        .catch( reason => { console.log("Rejected Stock GoogleRequestReject Promise for " + reason); });
    });
}

 /**
  * @param {message} message  A message object as defined in discord.js
  * @param {string} company  A string containing the ticker symbol for a company on the stock market
  */
 function getBloomberg(message, company) {
   if (company == undefined) {
     console.log("No ticker symbol specified");
     message.channel.send("You need to specify the ticker symbol and exchange of the company I'm looking for!")
      .catch( reason => { console.log("Rejected Stock BloombergReject Promise for " + reason); });
     return;
   }

   let options = misc.getOptions(config.bloomberg_path, config.bloomberg_quote, company);

   request(options)
     .then(function (body) {
       $ = cheerio.load(body);

       let no_tag = $('.container .premium__message').text().trim();
       if (no_tag.match(/The search for .*/)) {
         console.log("No such tag");
         message.channel.send("I couldn't find a company with that ticker name and exchange")
           .catch( reason => { console.log("Rejected Stock BloombergFail Promise for " + reason); });
         return;
       }

       let name = $('.basic-quote h1.name').text().trim();
       let currency = $('.basic-quote .price-container .currency').text().trim();
       let current_price = $('.basic-quote .price-container .price').text().trim();
       let header = "**" + name + "**, currently at " + current_price + " " + currency;

       let first_row = [];
       let second_row = [];
       let third_row = [];
       let fourth_row = [];
       let fifth_row = [];
       let sixth_row = [];

       let detailed_quote = $('.detailed-quote .data-table .cell');
       detailed_quote.each(function(cell) {
         let label = $(this).find('.cell__label').text().trim();

         let value = '.cell__value';

         if (/.*p\/e ratio.*/i.test(label)) {
           fourth_row.unshift('PE Ratio (TTM)' , $(this).find(value).text().trim());
         } else if (/earnings per share.*/i.test(label)) {
           fourth_row.push('EPS (TTM)', $(this).find(value).text().trim());
         } else if (/market cap .*/i.test(label)) {
           fifth_row.unshift(label, $(this).find(value).text().trim());
         } else if (/shares.*/i.test(label)) {
           sixth_row.unshift("O/S (m)", $(this).find(value).text().trim());
         } else if (/price\/sales.*/i.test(label)) {
           sixth_row.push("PSR", $(this).find(value).text().trim());
         } else {
           switch(label.toLowerCase()) {
             case "open":
              first_row.unshift(label, $(this).find(value).text().trim());
              break;
             case "day range":
              first_row.push(label, $(this).find(value).text().trim());
              break;
             case "volume":
              fifth_row.push(label, $(this).find(value).text().trim());
              break;
             case "previous close":
              second_row.unshift(label, $(this).find(value).text().trim());
              break;
             case "52wk range":
              second_row.push(label, $(this).find(value).text().trim());
              break;
             case "1 yr return":
              third_row.unshift(label, $(this).find(value).text().trim());
              break;
             case "ytd return":
              third_row.push(label, $(this).find(value).text().trim());
              break;
             default:
           }
         }
       });

       let data = [];
       data.push(first_row);
       data.push(second_row);
       data.push(third_row);
       data.push(fourth_row);
       data.push(fifth_row);
       data.push(sixth_row);

       let output = "```";
       for (let i = 0; i < data.length; i++) {
         output += misc.padRight(data[i][0], 20) + " ";
         output += misc.padRight(data[i][1], 17) + " ";
         output += misc.padRight(data[i][2], 13) + " " + data[i][3] + "\n";
       }
       output += "```";

       console.log("Recieved request for Bloomberg stock data of " + company.toUpperCase() + " aka " + name);
       message.channel.send(header)
         .catch( reason => { console.log("Rejected Stock BloombergHeader Promise for " + reason); });
       message.channel.send(output)
         .catch( reason => { console.log("Rejected Stock BloomBergPrint Promise for " + reason); });
     })
     .catch(function (err) {
       console.log("Failed Stock BloombergRequest Promise for " + err);
       message.channel.send("Query timed out")
         .catch( reason => { console.log("Rejected Stock BloombergRequestReject Promise for " + reason); });
     });
 }

  module.exports = {getStock};
