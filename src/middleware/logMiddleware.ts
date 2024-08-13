import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import mongoose from 'mongoose';
import moment from 'moment';


export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
    const start = moment().format('YYYY-MM-DD HH:mm:ss');

    logger.info(`
    ========== start ==========
    function: Request Logger
    Method: ${req.method}
    URL: ${req.originalUrl}
    Headers: ${JSON.stringify(req.headers)}
    Query Parameters: ${JSON.stringify(req.query)}
    Body: ${JSON.stringify(req.body)}
    ========== ended ==========
    `);

    res.on('finish', () => {
      const duration = moment().diff(start, 'milliseconds');
      logger.info(`
      ========== start ==========
      function: Response Logger
      Method: ${req.method}
      URL: ${req.originalUrl}
      Status: ${res.statusCode}
      Duration: ${duration}ms
      ========== ended ==========
      `, { file: 'detailsale.log' });
    });
    next();
};

export const dbLogger = (req: Request, res: Response, next: NextFunction): void => {
    const exec = mongoose.Query.prototype.exec;
    mongoose.Query.prototype.exec = async function (...args) {
      const model = this.model;
      const collectionName = model.collection.collectionName;
      
      // Record the start time
      const start = moment().format('YYYY-MM-DD HH:mm:ss');

      // Record the end time and calculate the duration
      const end = moment().format('YYYY-MM-DD HH:mm:ss');

      // Execute the query
      const result = await exec.apply(this, args);

      // Convert to milliseconds
      const duration = moment(end, 'YYYY-MM-DD HH:mm:ss').diff(moment(start, 'YYYY-MM-DD HH:mm:ss'), 'milliseconds');

      logger.info(`
      ========== start ==========
      MongoDB Query: ${JSON.stringify(this.getQuery())}
      Collection: ${collectionName}
      Duration: ${duration}ms
      ========== ended ==========
      `);
      
      return result;
    };
  next();
};

export const errorLogger = (err: any, req: Request, res: Response, next: NextFunction): void => {
      logger.error(`
      ========== start ==========
      Error Message: ${err.message}
      Stack: ${err.stack}
      ========== ended ==========
      `);
      next();
};