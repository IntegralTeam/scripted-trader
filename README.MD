# Scripted Trader

## Prerequisites
 - Node.JS **v11.x**
 - TypeScript **v3.3+**
 - Yarn **latest**
 - Redis **latest**

## Running
1. Run `yarn` to install dependencies
2. Compile TypeScript to JavaScrip
3. Run the application from `dist` directory

## API Reference

* **POST** _/trade_ - Begins trading for provided exchange with provided steps (currently only OKEx is supported). Returns
an id of a trade request that can be used to fetch the status of the request.
```
in: {
    	"exchange": "okex",
    	"steps": [{
    		"pair": "ETH/BTC",
    		"price": 0.00001,
    		"quantity": 10,
    		"side": "buy"
    	}]
    }
    
out: {
         "result": {
             "id": "7ac2393d-647b-41bb-bc17-00a423341018"
         }
     }
```
* **GET** _/trade/:id_ - Returns all information about the trading request
```json
{
    "result": {
        "id": "7ac2393d-647b-41bb-bc17-00a423341018",
        "totalDelay": 2954,
        "steps": [
            {
                "pair": "ETH/BTC",
                "price": 0.00001,
                "quantity": 10,
                "side": "buy",
                "id": "7ac2393d-647b-41bb-bc17-00a423341018",
                "index": 0,
                "exchange": "okex",
                "status": 4,
                "startingTime": 1559839673456,
                "orderID": "2955914527577088",
                "transmissionDelay": 2954
            }
        ]
    }
}
```
