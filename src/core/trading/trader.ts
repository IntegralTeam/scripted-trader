import ICache from '../../services/cache/interface';
import IBroker from '../../services/broker/interface';
import { CacheKey, TradingRequestsQueue } from '../../config/constants';
import {
    TradeRequest,
    TradeStatus,
    TradeStatusResponse,
    TradeStatusStep,
} from '../../model/trading';
import uuid from 'uuid/v4';
import DefaultExchange from '../../services/exchanges/exchange';
import { Logger } from 'winston';

export default class Trader {
    constructor(
        private readonly logger: Logger,
        private readonly cache: ICache,
        private readonly broker: IBroker,
        private readonly exchanges: Record<string, DefaultExchange>,
        private readonly pollingInterval = 10 * 1000,
    ) {}

    public readonly startProcessingRequests = async () => {
        await this.broker.subscribe<TradeRequest>(TradingRequestsQueue, async (request) => {
            const id = uuid();
            if (!request.requestID) {
                return;
            }
            this.logger.info(`accepted request with id: ${request.requestID}`);
            await this.broker.publish(request.requestID, {
                id,
            });
            await this.cache.hset(
                CacheKey.TradingRequests,
                id,
                JSON.stringify({
                    id,
                    totalDelay: 0,
                    steps: request.payload.steps.map((step, index) => ({
                        ...step,
                        index,
                        exchange: request.payload.exchange,
                        status: TradeStatus.Pending,
                    })),
                }),
            );

            await this.startStep({
                ...request.payload.steps[0],
                id,
                index: 0,
                exchange: request.payload.exchange,
                status: TradeStatus.Pending,
                startingTime: new Date().getTime(),
            });
        });
    };

    private readonly startStep = async (step: ProcessingStep, quantity?: number) => {
        const meta = {
            requestID: step.id,
            stepIndex: step.index,
        };
        this.logger.info('begin processing', meta);
        try {
            const exchange = this.exchanges[step.exchange];
            const timeBefore = new Date().getTime();
            let response: any = null;
            if (step.price > 0) {
                this.logger.info('create fixed price order', {
                    ...meta,
                    price: step.price,
                });
                response = await exchange.placeFixedPriceOrder(
                    step.side,
                    step.pair,
                    step.price,
                    step.quantity,
                );
            } else {
                this.logger.info('create market price order', meta);
                response = await exchange.placeMarketPriceOrder(
                    step.side,
                    step.pair,
                    step.quantity,
                );
            }
            this.logger.info('order creation successful', meta);
            step.orderID = response.id;
            step.status = TradeStatus.Sent;
            step.transmissionDelay = new Date().getTime() - timeBefore;

            this.logger.info(
                'persist new step status and begin polling for the state change',
                meta,
            );
            const cacheResponse = await this.cache.hget(CacheKey.TradingRequests, step.id);
            if (cacheResponse) {
                const request = JSON.parse(cacheResponse) as TradeStatusResponse;
                request.steps[step.index] = step;

                await this.cache.hset(CacheKey.TradingRequests, step.id, JSON.stringify(request));

                setTimeout(() => this.checkStep(step), this.pollingInterval);
            }
        } catch (error) {
            this.logger.error('error processing', {
                ...meta,
                error,
            });
        }
    };

    private readonly checkStep = async (step: ProcessingStep) => {
        //TODO: make a better solution. For now just check if we have funds before moving on to the next step.
        const meta = {
            requestID: step.id,
            stepIndex: step.index,
            orderID: step.orderID,
        };
        try {
            this.logger.info('check step order status', meta);
            const response = await this.exchanges[step.exchange].orderStatus(
                step.orderID as string,
                step.pair,
            );
            if (response.status === 'closed') {
                this.logger.info('the orded is filled. checking balance', meta);
                const balance = await this.exchanges[step.exchange].fetchBalance(
                    step.pair.split('/')[1],
                );
                if (balance >= response.filled) {
                    this.logger.info('funds have arrived. persist status');
                    step.executionDelay = new Date().getTime() - step.startingTime;
                    step.status = TradeStatus.Success;
                    step.actualQuantity = response.amount;
                    step.actualPrice = response.price;
                    const cacheResponse = await this.cache.hget(CacheKey.TradingRequests, step.id);
                    if (cacheResponse) {
                        const request = JSON.parse(cacheResponse) as TradeStatusResponse;
                        request.totalDelay += step.executionDelay + (step.transmissionDelay || 0);
                        request.steps[step.index] = step;

                        const nextStep = request.steps[step.index + 1];
                        if (nextStep) {
                            this.logger.info('begin processing next step');
                            await this.startStep({
                                ...nextStep,
                                id: step.id,
                                exchange: step.exchange,
                                status: TradeStatus.Pending,
                                startingTime: new Date().getTime(),
                            });
                        }
                        await this.cache.hset(
                            CacheKey.TradingRequests,
                            step.id,
                            JSON.stringify(request),
                        );
                    }
                } else {
                    this.logger.info("funds haven't arrived yet", meta);
                    setTimeout(() => this.checkStep(step), this.pollingInterval);
                }
                return;
            } else if (response.status === 'open') {
                this.logger.info('order is still open, continue polling', meta);
                setTimeout(() => this.checkStep(step), this.pollingInterval);
                return;
            }
        } catch (error) {
            this.logger.error('error checking', {
                ...meta,
                error,
            });
        }
        this.logger.info('Order was either cancelled, or resulted in an error', meta);

        const cacheResponse = await this.cache.hget(CacheKey.TradingRequests, step.id);
        if (cacheResponse) {
            const request = JSON.parse(cacheResponse) as TradeStatusResponse;
            request.totalDelay += (step.transmissionDelay || 0) + (step.executionDelay || 0);
            request.steps = request.steps.map((cachedStep, index) => {
                return index < step.index
                    ? cachedStep
                    : {
                          ...cachedStep,
                          status: TradeStatus.Error,
                      };
            });

            await this.cache.hset(CacheKey.TradingRequests, step.id, JSON.stringify(request));
        }
    };
}

interface ProcessingStep extends TradeStatusStep {
    id: string;
    startingTime: number;
}
