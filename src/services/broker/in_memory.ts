import IBroker, { RequestPayload } from './interface';
import EventEmitter from 'events';
import uuid from 'uuid/v4';

export default class InMemoryBroker implements IBroker {
    constructor(private readonly emitter = new EventEmitter()) {}

    public readonly publish = async (topic: string, payload: object): Promise<boolean> => {
        return this.emitter.emit(topic, { payload });
    };

    public readonly request = async <T>(
        topic: string,
        payload: object,
    ): Promise<RequestPayload<T>> => {
        return new Promise((resolve, reject) => {
            const requestID = uuid();

            this.get<T>(requestID).then(resolve, reject);

            this.emitter.emit(topic, {
                requestID,
                payload,
            });
        });
    };

    public readonly subscribe = async <T>(
        topic: string,
        callback: (payload: RequestPayload<T>) => void,
    ): Promise<string> => {
        this.emitter.on(topic, callback);
        return topic;
    };

    public readonly unsubscribe = (topic: string): Promise<void> => {
        return new Promise((resolve) => {
            this.emitter.off(topic, resolve);
        });
    };
    public readonly get = <T>(topic: string): Promise<RequestPayload<T>> => {
        return new Promise((resolve) => {
            this.emitter.once(topic, (value) => {
                resolve(value);
            });
        });
    };
}
