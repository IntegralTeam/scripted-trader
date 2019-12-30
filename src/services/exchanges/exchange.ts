import ccxt, { Exchange } from 'ccxt';
export default abstract class DefaultExchange {
    protected constructor(protected readonly exchange: Exchange) {}

    public readonly placeFixedPriceOrder = (
        side: string,
        pair: string,
        price: number,
        amount: number,
    ) => {
        return this.exchange.createOrder(pair, 'limit', side, amount, price);
    };

    public readonly placeMarketPriceOrder = (side: string, pair: string, amount: number) => {
        return this.exchange.createOrder(pair, 'market', side, amount);
    };

    public readonly orderStatus = (orderID: string, symbol: string) => {
        return this.exchange.fetchOrder(orderID, symbol);
    };

    public readonly fetchBalance = async (symbol: string) => {
        const balances = await this.exchange.fetchBalance()
        return balances[symbol].free
    }
}
