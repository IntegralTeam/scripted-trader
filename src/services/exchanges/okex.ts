import DefaultExchange from './exchange';
import { okex } from 'ccxt';

export default class OKEX extends DefaultExchange {
    constructor(exchange: okex) {
        super(exchange)
    }
}
