# Fubuki

[![Build Status](https://travis-ci.org/Staed/Fubuki.svg?branch=master)](https://travis-ci.org/Staed/Fubuki)

About
-----
Fubuki is a discord bot written in Node.js using discord.js <br />
The main focus of the bot is to provide utility and power to the user without having to leave Discord. <br />
This is a *self-hosted bot* so you will need to host and maintain your own instance.

Features
------
|    Command    | Description | Example | Aliases |
|---------------|-------------|---------|---------|
|!ping          | Checks if Fubuki is still responsive. | <span style="color:#C39BD3">!ping</span>|         |
|!booru         | Searches the Danbooru image board for random images.<br />You can supply as many tags as you like to narrow your searches.<br />Be careful, the images might not be safe for work! | <span style="color:#C39BD3">!booru fubuki_(kantai_collection)</span> | <span style="color:#C39BD3">!b</span> |
|!bsafe         | Same as `!booru` but `rating:safe` is automatically added.| <span style="color:#C39BD3">!bsafe shigure_(kantai_collection)</span>|         |
|!delete        | Delete the last Danbooru search result. Only works if the search<br />result is within the last 100 messages in the server. | <span style="color:#C39BD3">!delete</span> |     |
|!remindme      | Fubuki will remind you of whatever you told her at that time. | <span style="color:#C39BD3">!remindme pick up laundry in 30 minutes</span> |       |
|!play          | Fubuki will add your youtube video to the playlist and<br />play it in a voice channel. |  <span style="color:#C39BD3">!play youtube.com/watch?v=dQw4w9WgXcQ</span> |     |
|!disconnect    | Disconnects Fubuki from any voice channel she is in<br />and resets the playlist queue. | <span style="color:#C39BD3">!disconnect</span>|      |
|!skip          | The current song in the playlist queue is skipped. | <span style="color:#C39BD3">!skip</span>|      |
|!repeat        | Puts the current song in the playlist queue another time. | <span style="color:#C39BD3">!repeat</span>|     |
|!nowplaying    | Displays the current song's information. | <span style="color:#C39BD3">!nowplaying</span>|     |
|!urban         | Search and returns the Urban Dictionary definition. | <span style="color:#C39BD3">!urban blue</span>|     |
|!avatar        | View your or someone else's avatar. | <span style="color:#C39BD3">!avatar Staed</span>| <span style="color:#C39BD3">!a</span>|
|!coinflip      | Flips a coin. Flip again if it lands on the edge. | <span style="color:#C39BD3">!coinflip</span>|        |
|!rate          | Rolls a 1d10 to determine your rating. | <span style="color:#C39BD3">!rate Staed</span>|      |
|!quote         | Fetches a random or specific user's quote from this server that was saved. | <span style="color:#C39BD3">!quote <br /> !quote Staed <br /> !quote @Staed#2910 </span>|      |
|!quote add     | Saves the last message from the specified user as a quote. | <span style="color:#C39BD3">!quote add Staed</span>|       |
|!quote list    | Lists all the quotes saved for this server.<br />Accessible only if you are an Administrator of the server. | <span style="color:#C39BD3">!quote list</span>|      |
|!quote delete  | Deletes the specified quote. Only quotes from the current server are<br />accessible and only Administrators have the power to use this command. | <span style="color:#C39BD3">!quote delete 5</span>|        |
|!stock [*yahoo* &#124; *google* &#124; *bloomberg*]        | Fetches the latest stock summary from the specified API for the company. | <span style="color:#C39BD3">!stock yahoo CL=F<br />!stock google ADC<br />!stock bloomberg GOOGL:US</span>|    &nbsp;  |
|!roll          | Fubuki will roll dice for you. | <span style="color:#C39BD3">!roll 2D8 + 1D10 - 3D1 + 5 + -7</span>|  &nbsp;  |
|!choose        | Fubuki will choose an option for you. You can give each option different weights. If a weight is not specified, it defaults to a weight of 1. | <span style="color:#C39BD3">!choose Clap #4# &#124; Don't Clap #2# &#124; Sleep</span> | &nbsp; |
|!season        | Fubuki will pull up the names of the animes that are airing in the current season ordered by popularity. | &nbsp; | &nbsp; |
|!aninfo        | Fubuki will pull up information on a specific anime. | <span style="color:#C39BD3">!aninfo Overlord 2</span> | &nbsp; |


Installation
------------
The latest stable release is [here](https://github.com/Staed/Fubuki/releases/latest). <br />
Simply unzip into the folder of choice and run `npm start`

License
-------
Released under the [MIT License](LICENSE).
