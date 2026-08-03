import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const transports: winston.transport[] = [];

if (isProduction) {
  transports.push(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      level: 'info',
    }),
  );
} else {
  transports.push(
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'combined.log',
      level: 'info',
    }),
    new winston.transports.Console({
      format: winston.format.simple(),
      level: 'info',
    }),
  );
}

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports,
});