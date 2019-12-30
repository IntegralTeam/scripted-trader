export interface TradeRequest {
    exchange: string;
    steps: [TradeStep];
}

export interface TradeStep {
    pair: string;
    price: number;
    quantity: number;
    side: TradeSide;
}

export enum TradeSide {
    Buy = 'buy',
    Sell = 'sell',
}

export interface TradeResponse {
    id: string;
}

export interface TradeStatusRequest {
    id: string;
}

export interface TradeStatusResponse {
    id: string;
    totalDelay: number;
    steps: TradeStatusStep[];
}

export interface TradeStatusStep extends TradeStep {
    index: number;
    status: TradeStatus;
    exchange: string;
    orderID?: string;
    actualPrice?: number;
    actualQuantity?: number;
    transmissionDelay?: number;
    executionDelay?: number;
}

export enum TradeStatus {
    Unknown = 0,
    Pending,
    Sent,
    Success,
    Error,
    Timeout,
}

