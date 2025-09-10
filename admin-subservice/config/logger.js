const winston = require("winston");

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const logColors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

winston.addColors(logColors);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  levels: logLevels,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss:ms",
    }),
    winston.format.colorize({ all: true }),
    winston.format.printf((info) => {
      if (info.stack) {
        return `${info.timestamp} ${info.level}: ${info.message}\n${info.stack}`;
      }
      return `${info.timestamp} ${info.level}: ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: winston.format.combine(
        winston.format.uncolorize(),
        winston.format.json()
      ),
    }),
  ],
});

module.exports = logger;
