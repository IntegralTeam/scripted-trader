import IORedis from 'ioredis';
import ICache from './interface';

export default class Redis implements ICache {
    constructor(private readonly redis: IORedis.Redis) {}

    public readonly get = async (key: string): Promise<string | null> => {
        return await this.redis.get(key);
    };

    public readonly hget = async (key: string, field: string): Promise<string | null> => {
        return await this.redis.hget(key, field);
    };

    public readonly set = async (key: string, value: string): Promise<void> => {
        await this.redis.set(key, value);
    };

    public readonly hset = async (key: string, field: string, value: string): Promise<void> => {
        await this.redis.hset(key, field, value);
    };

    public readonly hexists = async (key: string, field: string): Promise<boolean> => {
        return (await this.redis.hexists(key, field)) === 1;
    };
}
