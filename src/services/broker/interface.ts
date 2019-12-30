export default interface IBroker {
    readonly publish: (topic: string, payload: object) => Promise<boolean>;
    readonly request: <T>(topic: string, payload: object) => Promise<RequestPayload<T>>
    readonly subscribe: <T>(topic: string, callback: (payload: RequestPayload<T>) => void) => Promise<string>;
    readonly unsubscribe: (topic: string) => Promise<void>;
    readonly get: <T>(topic: string) => Promise<RequestPayload<T>>;
}


export interface RequestPayload<T> {
    requestID?: string,
    payload: T
}
