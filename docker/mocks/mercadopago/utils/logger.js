const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'mercadopago-mock' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          let msg = `${timestamp} [${level}]: ${message}`;
          const metaKeys = Object.keys(meta).filter(k => k !== 'service');
          if (metaKeys.length > 0) {
            const filteredMeta = {};
            metaKeys.forEach(k => filteredMeta[k] = meta[k]);
            msg += ' ' + JSON.stringify(filteredMeta);
          }
          return msg;
        })
      )
    })
  ]
});

module.exports = logger;
