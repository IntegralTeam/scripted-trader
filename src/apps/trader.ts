import { Server } from '../server/server';
import * as winston from 'winston';
import Config, { LoggerConfig } from '../config/config';
import { okex3 } from 'ccxt';
import InMemoryBroker from '../services/broker/in_memory';
import IORedis from 'ioredis';
import Redis from '../services/cache/redis';
import Trader from '../core/trading/trader';
import OKEX from '../services/exchanges/okex';
import { EventEmitter } from 'events';

(async () => {

    const emitter = new EventEmitter();
    emitter.once('test', console.log);
    emitter.emit('test', 'message')
    emitter.emit('test', 'message2')
    const logger = winston.createLogger(LoggerConfig).child({ app: 'trading api' });
    try {
        const config = new Config();

        const broker = new InMemoryBroker();
        logger.info('connect to redis database');
        let redis: IORedis.Redis;
        try {
            redis = new IORedis(config.redis.url, {
                password: config.redis.password,
            });
        } catch (error) {
            logger.error(`unable to connect to redis: ${error}`);
            process.exit();
        }

        const cache = new Redis(redis);

        const exchange = new OKEX(
            new okex3({
                apiKey: '166f1f34-051e-4f0c-af77-77c978960317',
                secret: '8C9F4D903587B89DF1C7205DAC1BE797',
                password: 'apitest',
                enableRateLimit: true,
            }),
        );

        const trader = new Trader(
            logger.child({
                app: 'trader',
            }),
            cache,
            broker,
            {
                okex: exchange,
            },
        );

        await trader.startProcessingRequests();

        logger.info('initialize express');
        const server = Server(logger, cache, broker);

        server.listen(config.server.port, () => {
            logger.info(`express server started on port ${config.server.port}`);
        });
    } catch (error) {
        logger.error(`unable to start the app. reason: ${error}`);
    }
})();
