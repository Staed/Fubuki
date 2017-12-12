/* eslint-disable */
let config = {};

config.discord_token = 'YOUR_DISCORD_TOKEN'; // TODO
config.id = 0;

config.danbooru_auth = 'https://YOUR_USERNAME:YOUR_DANBOORU_API_KEY@danbooru.donmai.us/'; // TODO
config.danbooru_url = 'https://danbooru.donmai.us/';
config.danbooru_get = 'posts.json?tags=';

config.sbooru_url = 'https://safebooru.org/';
config.sbooru_get = 'index.php?page=dapi&s=post&q=index&tags=';

config.admin_id = '';
config.default_channel = 'Music';

config.google_url_shortener_url = 'https://www.googleapis.com/urlshortener/v1/url';
config.google_api_key = 'YOUR_GOOGLE_API_KEY'; // TODO
config.google_youtube_url = 'https://www.googleapis.com/youtube/v3/videos';
config.use_shortener = false;

config.urban_url = 'http://api.urbandictionary.com/v0/define?term=';

config.bloomberg_path = 'https://www.bloomberg.com/';
config.bloomberg_quote = 'quote/';

config.google_path = 'https://www.google.com/';
config.google_finance = 'finance?q=';

config.anilist_path = 'https://anilist.co/api/';
config.anilist_grant = 'grant_type=client_credentials';
config.anilist_secret = 'client_secret=YOUR_SECRET'; // TODO
config.anilist_id = 'client_id=YOUR_ID'; // TODO

config.help_text = '!ping\t\tChecks if Fubuki is still responsive.\n\tEx: !ping' +
				   '\n!booru or !b\t\tSearches the Danbooru image board for random images. You can supply as many tags as you like to narrow your searches. Be careful, the images might not be safe for work!\n\tEx: !booru fubuki_(kantai_collection)' +
				   '\n!bsafe\t\tSame as `!booru` but `rating:safe` is automatically added.\n\tEx: !bsafe shigure_(kantai_collection)' +
				   '\n!delete\t\tDelete the last Danbooru search result. Only works if the search result is within the last 100 messages in the server.\n\tEx: !delete' +
				   '\n!remindme\t\tFubuki will remind you of whatever you told her at that time.\n\tEx: !remindme pick up laundry in 30 minutes' +
				   '\n!play\t\tFubuki will add your youtube video to the playlist and play it in a voice channel.\n\tEx: !play youtube.com/watch?v=dQw4w9WgXcQ' +
				   '\n!disconnect\t\tDisconnects Fubuki from any voice channel she is in and resets the playlist queue.\n\tEx: !disconnect' +
				   '\n!skip\t\tThe current song in the playlist queue is skipped.\n\tEx: !skip' +
				   '\n!repeat\t\tPuts the current song in the playlist queue another time.\n\tEx: !repeat' +
				   '\n!nowplaying\t\tDisplays the current song\'s information.\n\tEx: !nowplaying' +
				   '\n!urban\t\tSearch and returns the Urban Dictionary definition.\n\tEx: !urban blue' +
				   '\n!avatar or !a\t\tView your or someone else\'s avatar.\n\tEx: !avatar Staed' +
				   '\n!coinflip\t\tFlips a coin. Flip again if it lands on the edge.\n\tEx: !coinflip' +
				   '\n!rate\t\tRolls a 1d10 to determine your rating.\n\tEx: !rate Staed' +
                   '\n!quote\t\tFetches a random or specific user\'s quote from this server that was saved.\n\tEx: !quote\t\t or !quote Staed\t\t or !quote @Staed#2910' +
				   '\n!quote add\t\tSaves the last message from the specified user as a quote.\n\tEx: !quote add Staed' +
				   '\n!quote list\t\tLists all the quotes saved for this server. Accessible only if you are an Administrator of the server.\n\tEx: !quote list' +
				   '\n!quote delete\t\tDeletes the specified quote. Only quotes from the current server are accessible and only Administrators have the power to use this command.\n\tEx: !quote delete 5' +
				   '\n!stock [*yahoo* | *google* | *bloomberg*]\t\tFetches the latest stock summary from the specified API for the company.\n\tEx: !stock yahoo CL=F\t\t or !stock google ADC\t\t or !stock bloomberg GOOGL:US' +
				   '\n!roll\t\tFubuki will roll dice for you.\n\tEx: !roll 2D8 + 1D10 - 3D1 + 5 + -7' +
				   '\n!choose\t\tFubuki will choose an option for you. You can give each option different weights. If a weight is not specified, it defaults to a weight of 1.\n\tEx: !choose Clap #4# | Don\'t Clap #2# | Sleep' +
				   '\n!season\t\tFubuki will pull up the names of the animes that are airing in the current season ordered by popularity.' +
				   '\n!aninfo\t\tFubuki will pull up information on a specific anime.\n\tEx: !aninfo Overlord 2';

module.exports = config;
