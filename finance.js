let config = require('./config');
let request = require('request-promise');
let cheerio = require('cheerio');
let misc = require('./misc.js');

/**
 * @param {message} message  A message object as defined in discord.js
 * @param {string} company  A string containing the ticker symbol for a company on the stock market
 * @return  {}
 */
 function getStock(message, company) {
   if (company == undefined) {
     console.log("No ticker symbol specified");
     message.channel.send("You need to specify the ticker symbol of the company I'm looking for!")
      .catch( reason => { console.log("Rejected Stock Reject Promise for " + reason); });
     return;
   }

   let options = misc.getOptions(config.bloomberg_path, config.bloomberg_quote, company);

   request(options)
     .then(function (body) {
       $ = cheerio.load(body);

       let no_tag = $('.container .premium__message').text().trim();
       if (no_tag.match(/The search for .*/)) {
         console.log("No such tag");
         message.channel.send("I couldn't find a company with that ticker name")
           .catch( reason => { console.log("Rejected Stock Fail Promise for " + reason); });
         return;
       }

       let name = $('.basic-quote h1.name').text().trim();
       let exchange = $('.basic-quote .ticker-container .exchange').text().trim();
       let currency = $('.basic-quote .price-container .currency').text().trim();
       let current_price = $('.basic-quote .price-container .price').text().trim();

       let mobile_dom = $('.basic-quote .mobile-basic-data .data-table .cell');
       let open_price = '';
       let last_close = '';

       mobile_dom.each(function(cell) {
         let label = $(this).find('.cell__label').text().trim().toLowerCase();
         if (label == 'open') {
           open_price = $(this).find('.cell__value').text().trim();
         } else if (label == 'previous close') {
           last_close = $(this).find('.cell__value').text().trim();
         }
       });

       let res = '**' + name + "** in the " + exchange + " exchange\n";
       res += "Currently at " + current_price + ' ' + currency + ' and opened at ';
       res += open_price + ' ' + currency + ' and closed yesterday at ';
       res += last_close + ' ' + currency;

       console.log("Recieve request for stock data of " + company.toUpperCase() + " aka " + name);
       message.channel.send(res)
         .catch( reason => { console.log("Rejected Stock Text Promise for " + reason); });
     })
     .catch(function (err) {
       console.log("Failed Stock Request Promise for " + err);
       message.channel.send("Query timed out")
         .catch( reason => { console.log("Rejected Stock RequestReject Promise for " + reason); });
     });
 }

  module.exports = {getStock};
