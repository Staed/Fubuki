import * as path from 'path';
import * as fs from 'fs';
const winston = require('winston');
require('winston-daily-rotate-file');

export default class Logger {
    private currentFile: string;
    private method: string;
    private logDirectory: string;
    private logger;

    constructor(currentFile: string) {
        // this.logDirectory = path.dirname(new URL('../logs', import.meta.url).pathname);
        this.logDirectory = path.join(__dirname, '/../../logs/')
        this.currentFile = currentFile;

        if (!fs.existsSync(this.logDirectory)) {
            fs.mkdirSync(this.logDirectory);
        }

        this.logger = winston.createLogger({
            level: 'verbose',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf((info) => `${info.timestamp} [${info.level}]: ${info.message}`)
            ),
            exitOnError: false,
            transports: [
                new (winston.transports.DailyRotateFile)({
                    name: 'error',
                    filename: path.join(this.logDirectory, '%DATE%-error.log'),
                    datePattern: 'YYYY-MM-DD',
                    level: 'error',
                    humanReadableUnhandledException: true,
                }),
                new (winston.transports.DailyRotateFile)({
                    name: 'combined',
                    filename: path.join(this.logDirectory, '%DATE%-combined.log'),
                    datePattern: 'YYYY-MM-DD',
                }),
                new (winston.transports.Console)({
                    colorize: true,
                }),
            ],
        });
    }

    /**
     * Logs a message at the specified level via Winston
     * @param {string} level
     * @param {*} reason The error caught from a bluebird Promise
     * @param {string} call The thing it was doing
     */
    private logIt(level: string, reason: any, call: string) {
        let originString = call + ', \'' + this.method + '\' in ' +  this.currentFile;

        this.logger.log(level, originString + ', Reason: ' + reason);
    }

    /**
     * Log an 'info' level message via Winston.
     * These will typically be discord.js message.channel.send() errors.
     * @param {*} reason The error caught from a bluebird Promise
     * @param {string} call The thing it was doing
     */
    public info(reason: any, call: string) {
        this.logIt('info', reason, call);
    }

    /**
     * Log an 'warn' level message via Winston
     * @param {*} reason The error caught from a bluebird Promise
     * @param {string} call The thing it was doing
     */
    public warn(reason: any, call: string) {
        this.logIt('warn', reason, call);
    }


    /**
     * Log a 'error' level message via Winston
     * @param {*} reason The error caught from a bluebird Promise
     * @param {string} call The thing it was doing
     */
    public error(reason: any, call: string) {
        this.logIt('error', reason, call);
    }

    /**
     * Log a 'verbose' level message via Winston.
     * This will be messages about what the program is doing even though no
     * errors or exceptions were ran into.
     * @param {*} reason What happened
     * @param {string} call The thing it was doing
     */
    public verbose(reason: any, call: string) {
        this.logIt('verbose', reason, call);
    }

    public setMethod(name: string) {
        this.method = name;
    }
}
