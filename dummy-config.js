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

config.help_text = 'Sorry, the help text is getting fixed';

config.anilist_path = 'https://anilist.co/api/';
config.anilist_grant = 'grant_type=client_credentials';
config.anilist_secret = 'client_secret=YOUR_SECRET'; // TODO
config.anilist_id = 'client_id=YOUR_ID'; // TODO

module.exports = config;
