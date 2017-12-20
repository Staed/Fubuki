let winston = require('winston');
require('winston-daily-rotate-file');

let path = require('path');
const logDir = path.join(__dirname + '/../logs');

const fs = require('fs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

let logger = new (winston.Logger)({
    level: 'verbose',
    exitOnError: false,
    transports: [
        new (winston.transports.DailyRotateFile)({
            name: 'error',
            filename: path.join(logDir, '-error.log'),
            datePattern: 'yyyy-MM-dd',
            prepend: true,
            level: 'error',
            humanReadableUnhandledException: true,
        }),
        new (winston.transports.DailyRotateFile)({
            name: 'combined',
            filename: path.join(logDir, '-combined.log'),
            datePattern: 'yyyy-MM-dd',
            prepend: true,
        }),
        new (winston.transports.Console)({
            colorize: true,
        }),
    ],
    exceptionHandlers: [
        new (winston.transports.DailyRotateFile)({
            name: 'exception',
            filename: path.join(logDir, '-exceptions.log'),
            datePattern: 'yyyy-MM-dd',
            prepend: true,
        }),
    ],
});

/**
 * Logs a message at the specified level via Winston
 * @param {string} level
 * @param {*} reason The error caught from a bluebird Promise
 * @param {string} location The js file it originated from
 * @param {string} method The method it came from
 * @param {string} call The thing it was doing
 */
function logIt(level, reason, location, method, call) {
    let originString = call + ', ' + method + '():' + location;
    logger.log(level, originString + ', Reason: %s', reason);
}

/**
 * Log an 'info' level message via Winston.
 * These will typically be discord.js message.channel.send() errors.
 * @param {*} reason The error caught from a bluebird Promise
 * @param {string} location The js file it originated from
 * @param {string} method The method it came from
 * @param {string} call The thing it was doing
 */
function info(reason, location, method, call) {
    logIt('info', reason, location, method, call);
}

/**
 * Log an 'warn' level message via Winston
 * @param {*} reason The error caught from a bluebird Promise
 * @param {string} location The js file it originated from
 * @param {string} method The method it came from
 * @param {string} call The thing it was doing
 */
function warn(reason, location, method, call) {
    logIt('warn', reason, location, method, call);
}

/**
 * Log a 'error' level message via Winston
 * @param {*} reason The error caught from a bluebird Promise
 * @param {string} location The js file it originated from
 * @param {string} method The method it came from
 * @param {string} call The thing it was doing
 */
function error(reason, location, method, call) {
    logIt('error', reason, location, method, call);
}

/**
 * Log a 'verbose' level message via Winston.
 * This will be messages about what the program is doing even though no
 * errors or exceptions were ran into.
 * @param {*} reason What happened
 * @param {string} location The js file it originated from
 * @param {string} method The method it came from
 * @param {string} call The thing it was doing
 */
function verbose(reason, location, method, call) {
    logIt('verbose', reason, location, method, call);
}

module.exports = {info, warn, error, verbose};
