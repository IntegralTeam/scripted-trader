import { Router } from 'express';
import { RouteWrapper } from './wrappers';
import {
    TradeRequest,
    TradeResponse,
    TradeStatusRequest,
    TradeStatusResponse,
} from '../model/trading';
import ICache from '../services/cache/interface';
import IBroker from '../services/broker/interface';
import { CacheKey, QueueName } from '../config/constants';

export default class TradeRouter {
    /**
     *
     * Initializes TradeRouter.
     *
     *
     */
    constructor(private readonly cache: ICache, private readonly broker: IBroker) {}

    /**
     *
     * Registers routes to express router
     *
     * @param router - valid express router object
     */
    public registerRoutes(router: Router) {
        router.get('/:id', RouteWrapper(this.tradeStatus, ['id']));
        router.post('', RouteWrapper(this.trade));
    }

    /**
     *
     * Route that returns the status of the trade request
     *
     * @param body - valid TradeStatusRequest
     */
    private tradeStatus = async (body: TradeStatusRequest): Promise<TradeStatusResponse> => {
        return JSON.parse((await this.cache.hget(CacheKey.TradingRequests, body.id)) || '{}');
    };

    /**
     *
     * Route that accepts a trade request and passes it to the trading engine
     *
     * @param body - valid TradeRequest
     */
    private trade = async (body: TradeRequest): Promise<TradeResponse> => {
        // TODO: Add real validation
        if (body.exchange !== 'okex') {
            throw new Error('Unsupported exchange');
        }

        if (body.steps.length <= 0) {
            throw new Error('Invalid input. No steps found');
        }
        const response = await this.broker.request<TradeResponse>(
            QueueName.TradingRequestsQueue,
            body,
        );

        return response.payload;
    };
}
