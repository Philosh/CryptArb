from api import fetch
import asyncio
from decimal import Decimal
import copy

kraken_url = "https://api.kraken.com/0/public/Ticker"


class PollService:
    def __init__(self):
        self.price_delta = {}

    def get_price_delta(self):
        return self.price_delta

    async def get_buy_quote(self, url):
        quotes = await fetch(url)

        buy_quotes = {
            market: {
                "ask_price": market_data.get("a", [None])[0],
            }
            for market, market_data in quotes["result"].items()
        }

        return buy_quotes

    def calculate_price_delta(self, buy_quotes1, buy_quotes2):

        price_delta = {}
        for (market1, quotes1), (market2, quotes2) in zip(
            buy_quotes1.items(), buy_quotes2.items()
        ):
            if Decimal(quotes1["ask_price"]) == 0:
                price_delta[market1] = {"price_delta": 0}
            else:
                price_delta[market1] = {
                    "price_delta": (
                        Decimal(quotes2["ask_price"]) - Decimal(quotes1["ask_price"])
                    )
                    / Decimal(quotes1["ask_price"])
                    * 100,
                }

        return price_delta

    async def poll_data(self):
        buy_quotes1 = await self.get_buy_quote(kraken_url)
        while True:
            buy_quotes2 = await self.get_buy_quote(kraken_url)
            self.price_delta = self.calculate_price_delta(buy_quotes1, buy_quotes2)
            buy_quotes1 = copy.deepcopy(buy_quotes2)
            await asyncio.sleep(60)
