import { Logger } from 'winston';
import express, { Express } from 'express';
import bodyParser = require('body-parser');
import morgan = require('morgan');
import TradeRouter from '../routes/trade';
import { ErrorMiddleware } from '../routes/middleware';
import ICache from '../services/cache/interface';
import IBroker from '../services/broker/interface';

export const Server = (logger: Logger, cache: ICache, broker: IBroker): Express => {
    const server = express();

    server.use(bodyParser.json());

    server.use(
        morgan('combined', {
            stream: {
                write: (message: string) => {
                    logger.info(message.trim());
                },
            },
        }),
    );

    const expressTradeRouter = express.Router();

    const tradeRouter = new TradeRouter(cache, broker);
    tradeRouter.registerRoutes(expressTradeRouter);

    server.use('/trade', expressTradeRouter);

    server.use(ErrorMiddleware);

    return server;
};
