export default interface ICache {
    readonly hget: (key: string, field: string) => Promise<string | null>;
    readonly hset: (key: string, field: string, value: string) => Promise<void>;

    readonly get: (key: string) => Promise<string | null>;
    readonly set: (key: string, value: string) => Promise<void>;

    readonly hexists: (key: string, field: string) => Promise<boolean>;
}
