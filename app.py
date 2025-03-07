from api import fetch
import asyncio

async def get_buy_quotes():
    kraken_url = "https://api.kraken.com/0/public/Ticker"
    kraken_quotes1 = await fetch(kraken_url)

    buy_quotes1 = {
        market: {
            "ask_price": market_data.get("a", [None])[0],
        }
        for market, market_data in kraken_quotes1["result"].items()
    }

    kraken_quotes2 = await fetch(kraken_url)

    buy_quotes2 = {
        market: {
            "ask_price": market_data.get("a", [None])[0],
        }
        for market, market_data in kraken_quotes2["result"].items()
    }

    return buy_quotes1, buy_quotes2


async def calculate_price_delta():

    buy_quotes1, buy_quotes2 = await get_buy_quotes()


    return buy_quotes1, buy_quotes2
