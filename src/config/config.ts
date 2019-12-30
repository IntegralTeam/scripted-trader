import * as winston from 'winston';
import { format, LoggerOptions } from 'winston';
import config from 'config';

export const LoggerConfig: LoggerOptions = {
    format: format.combine(format.timestamp(), format.json()),
    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
    transports: [new winston.transports.Console()],
};

export default class Config {
    public readonly server: ServerConfig;

    public readonly redis: RedisConfig;

    constructor() {
        this.server = this.parseServerConfig();
        this.redis = this.parseRedisConfig();
    }

    private readonly parseServerConfig = (): ServerConfig => {
        return {
            port: config.has('server.port') ? config.get('server.port') : '4000',
        };
    };

    private readonly parseRedisConfig = (): RedisConfig => {
        return {
            url: config.has('redis.url') ? config.get('redis.url') : '',
            password: config.has('redis.password') ? config.get('redis.password') : '',
        };
    };
}

interface ServerConfig {
    readonly port: string;
}

interface RedisConfig {
    readonly url: string;
    readonly password?: string;
}
