/* eslint-disable */

export default {
	MAXTIMEOUT: 10000,
	discord_token: 'YOUR_DISCORD_TOKEN', // TODO
	id: '0',

	danbooru_auth: 'https://YOUR_USERNAME:YOUR_DANBOORU_API_KEY@danbooru.donmai.us/', // TODO
	danbooru_url: 'https://danbooru.donmai.us/',
	danbooru_get: 'posts.json?tags=',

	sbooru_url: 'https://safebooru.org/',
	sbooru_get: 'index.php?page=dapi&s=post&q=index&tags=',

	admin_id: '',
	default_channel: 'Music',

	google_url_shortener_url: 'https://www.googleapis.com/urlshortener/v1/url',
	google_api_key: 'YOUR_GOOGLE_API_KEY', // TODO
	google_youtube_url: 'https://www.googleapis.com/youtube/v3/videos',
	use_shortener: false,

	urban_url: 'http://api.urbandictionary.com/v0/define?term=',

	bloomberg_path: 'https://www.bloomberg.com/',
	bloomberg_quote: 'quote/',

	google_path: 'https://www.google.com/',
	google_finance: 'finance?q=',

	anilist_path: 'https://anilist.co/api/',
	anilist_grant: 'grant_type=client_credentials',
	anilist_secret: 'client_secret=YOUR_SECRET', // TODO
	anilist_id: 'client_id=YOUR_ID', // TODO

	help_text1:		'**!ping**    Checks if Fubuki is still responsive.\n\t\tEx: !ping' +
                    '\n\n**!booru** or **!b**    Searches the Danbooru image board for random images. You can supply as many tags as you like to narrow your searches. Be careful, the images might not be safe for work!\n\t\tEx: !booru fubuki_(kantai*_collection)*' +
                   	'\n\n**!bsafe**    Same as `!booru` but `rating:safe` is automatically added.\n\t\tEx: !bsafe shigure_(kantai_collection)' +
                   	'\n\n**!delete**    Delete the last Danbooru search result. Only works if the search result is within the last 100 messages in the server.\n\t\tEx: !delete' +
                   	'\n\n**!remindme**    Fubuki will remind you of whatever you told her at that time.\n\t\tEx: !remindme pick up laundry in 30 minutes' +
                   	'\n\n**!play**    Fubuki will add your youtube video to the playlist and play it in a voice channel.\n\t\tEx: !play youtube.com/watch?v=dQw4w9WgXcQ' +
                   	'\n\n**!disconnect**    Disconnects Fubuki from any voice channel she is in and resets the playlist queue.\n\t\tEx: !disconnect' +
                   	'\n\n**!skip**    The current song in the playlist queue is skipped.\n\t\tEx: !skip' +
                   	'\n\n**!repeat**    Puts the current song in the playlist queue another time.\n\t\tEx: !repeat' + 
                   	'\n\n**!nowplaying**    Displays the current song\'s information.\n\t\tEx: !nowplaying' +
                   	'\n\n**!urban**    Search and returns the Urban Dictionary definition.\n\t\tEx: !urban blue' +
                   	'\n\n**!avatar** or **!a**    View your or someone else\'s avatar.\n\t\tEx: !avatar Staed' +
                   	'\n\n**!coinflip**    Flips a coin. Flip again if it lands on the edge.\n\t\tEx: !coinflip',

	help_text2:		'\n\n**!rate**    Rolls a 1d10 to determine your rating.\n\t\tEx: !rate Staed' +
                   	'\n\n**!quote**    Fetches a random or specific user\'s quote from this server that was saved.\n\t\tEx: !quote       or !quote Staed       or !quote @Staed#2910' +
                   	'\n\n**!quote add**    Saves the last message from the specified user as a quote.\n\t\tEx: !quote add Staed' +
                   	'\n\n**!quote list**    Lists all the quotes saved for this server. Accessible only if you are an Administrator of the server.\n\t\tEx: !quote list' +
                   	'\n\n**!quote delete**    Deletes the specified quote. Only quotes from the current server are accessible and only Administrators have the power to use this command.\n\t\tEx: !quote delete 5' +
                   	'\n\n**!stock [*yahoo* | *google* | *bloomberg*]**    Fetches the latest stock summary from the specified API for the company.\n\t\tEx: !stock yahoo CL=F       or !stock google ADC       or !stock bloomberg GOOGL:US' +
                   	'\n\n**!roll**    Fubuki will roll dice for you.\n\t\tEx: !roll 2D8 + 1D10 - 3D1 + 5 + -7' +
                   	'\n\n**!choose**    Fubuki will choose an option for you. You can give each option different weights. If a weight is not specified, it defaults to a weight of 1.\n\t\tEx: !choose Clap #4# | Don\'t Clap #2# | Sleep' +
                   	'\n\n**!season**    Fubuki will pull up the names of the animes that are airing in the current season ordered by popularity.' +
                   	'\n\n**!aninfo**    Fubuki will pull up information on a specific anime.\n\t\tEx: !aninfo Overlord 2',
}
