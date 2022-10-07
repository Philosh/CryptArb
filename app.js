const fetch = require("node-fetch");
const axios = require("axios");
const http = require("http");
const CONFIG = require("./cryptoConfig.js");
const cryptoUtilities = require("./cryptoUtilities");

const hostname = "127.0.0.1";
const port = 3000;

const requestMarketData = () => {
  const ftxQuotes = fetch(CONFIG.MARKET.FTX.APIURL + "markets")
    .then((res) => res.json())
    .then((data) => ({
      FTX: data.result
        .map((e) => ({ name: e.name, last: e.last, bid: e.bid, ask: e.ask }))
        .filter((e) => e.name.includes("USD"))
        .filter((e) => !e.name.includes("USDT"))
        .filter((e) => {
          return CONFIG.MARKET.FTX.EXCLUDE_WORDS.reduce(
            (prev, curr) => prev && !e.name.includes(curr),
            true
          );
        })
        .filter((e) => e.name.split("/")[0] !== "USD")
        .map((e) => ({ ...e, name: e.name.split("/").join("") })),
      marketInfo: CONFIG.MARKET.FTX,
    }));

  const krakenQuotes = fetch(CONFIG.MARKET.KRAKEN.APIURL + "Assets")
    .then((res) => res.json())
    .then((data) => {
      const assetPairs = Object.keys(data.result)
        .filter((e) => !e.includes(".") && !/\d/.test(e))
        .filter((e) => e.substring(0, 2) !== "XX")
        .map((e) => e + "USD");

      const krakenPromises = assetPairs.map((e) => {
        return fetch(CONFIG.MARKET.KRAKEN.APIURL + "Ticker?pair=" + e).then(
          (res) =>
            res.json().then((data) => {
              return data.result;
            })
        );
      });

      return Promise.all(krakenPromises).then((res) => ({
        KRAKEN: res
          .filter((e) => e)
          .map((e) => {
            const tickerName = Object.keys(e)[0];
            const tickerObj = e[tickerName];
            return {
              name: tickerName,
              last: tickerObj.c[0],
              bid: tickerObj.b[0],
              ask: tickerObj.a[0],
            };
          }),
        marketInfo: CONFIG.MARKET.KRAKEN,
      }));
    });

  const coinTigerQuotes = fetch(
    CONFIG.MARKET.COINTIGER.APIURL + "market/detail"
  )
    .then((res) => {
      if (!res.ok) {
        console.log("Response StatusCode", res.status);
        throw Error(res.statusText);
      }
      return res.json();
    })
    .then((data) => {
      const tickerNames = Object.keys(data);
      const coinTigerQuotes = tickerNames.map((tickerName) => {
        const tickerObj = data[tickerName];
        return {
          name: tickerName,
          last: tickerObj.last,
          bid: tickerObj.highestBid,
          ask: tickerObj.lowestAsk,
        };
      });
      return {
        COINTIGER: coinTigerQuotes,
        marketInfo: CONFIG.MARKET.COINTIGER,
      };
    })
    .catch(console.log);

  const mexcQuotes = fetch(
    CONFIG.MARKET.MEXC.APIURL + "open/api/v2/market/ticker"
  )
    .then((res) => {
      if (!res.ok) {
        console.log("Response StatusCode", res.status);
        throw Error(res.statusText);
      }
      return res.json();
    })
    .then((data) => ({
      MEXC: data.data
        .filter(
          (e) =>
            e.symbol.includes("USDT") &&
            !e.symbol.includes("3L") &&
            !e.symbol.includes("3S") &&
            !e.symbol.includes("4L") &&
            !e.symbol.includes("4S")
        )
        .map((e) => ({
          name: e.symbol.split("_").join(""),
          last: e.last,
          bid: e.bid,
          ask: e.ask,
        })),
      marketInfo: CONFIG.MARKET.MEXC,
    }))
    .catch(console.log);

  const gateIOQuotes = fetch(CONFIG.MARKET.GATEIO.APIURL + "spot/tickers")
    .then((res) => res.json())
    .then((data) => {
      return {
        GATEIO: data.map((e) => ({
          name: e.currency_pair.split("_").join(""),
          last: e.last,
          ask: e.lowest_ask,
          bid: e.highest_bid,
        })),
        marketInfo: CONFIG.MARKET.GATEIO,
      };
    });

  Promise.all([
    ftxQuotes,
    krakenQuotes,
    mexcQuotes,
    gateIOQuotes,
    coinTigerQuotes,
  ]).then((res) => {
    displayArbitrage(res);
  });
};

const displayArbitrage = (marketsQuotes) => {
  const orderBookURLS = [];
  for (let i = 0; i < marketsQuotes.length; i++) {
    const marketQuotesObj1 = marketsQuotes[i];
    const marketName1 = Object.keys(marketQuotesObj1)[0];
    for (let j = i + 1; j < marketsQuotes.length; j++) {
      const marketQuotesObj2 = marketsQuotes[j];
      const marketName2 = Object.keys(marketQuotesObj2)[0];
      marketQuotesObj1[marketName1].forEach((marketQuoteObj1) => {
        marketQuotesObj2[marketName2].forEach((marketQuoteObj2) => {
          const compTickerName1 = marketQuoteObj1.name.slice(0, -1);
          const compTickerName2 = marketQuoteObj2.name.slice(0, -1);
          if (
            marketQuoteObj1.name === marketQuoteObj2.name ||
            compTickerName1 === marketQuoteObj2.name ||
            compTickerName2 === marketQuoteObj1.name
          ) {
            const price1 =
              ((marketQuoteObj2.bid - marketQuoteObj1.ask) /
                marketQuoteObj1.ask) *
              100;
            const price2 =
              ((marketQuoteObj1.bid - marketQuoteObj2.ask) /
                marketQuoteObj2.ask) *
              100;

            const marketInfo1 = marketQuotesObj1.marketInfo;
            const marketInfo2 = marketQuotesObj2.marketInfo;
            const ticker1 =
              marketQuoteObj1.name.split("USD")[0] +
              marketInfo1.tickJoiner +
              "USD" +
              marketQuoteObj1.name.split("USD")[1];
            const ticker2 =
              marketQuoteObj2.name.split("USD")[0] +
              marketInfo2.tickJoiner +
              "USD" +
              marketQuoteObj2.name.split("USD")[1];

            if (price1 > 2 && price1 < 20) {
              console.log("--x-xx---x--");
              // const arbSentence = `BUY ${marketQuoteObj1.name} from ${
              //   marketName1.split("Quotes")[0]
              // } @ ${marketQuoteObj1.ask}\nSELL ${marketQuoteObj2.name} to ${
              //   marketName2.split("Quotes")[0]
              // } @ ${marketQuoteObj2.bid}`;
              // console.log(arbSentence);
              // const sent = `potential gain ${price1.toFixed(2)} %`;
              // console.log(sent);
              orderBookURLS.push({
                buyMarket: marketName1,
                buy: marketInfo1.getOrderBookURL(ticker1),
                buyMarketInfo: marketInfo1,
                sellMarket: marketName2,
                sell: marketInfo2.getOrderBookURL(ticker2),
                sellMarketInfo: marketInfo2,
              });

              console.log(
                "BUY from ",
                marketName1,
                marketInfo1.getOrderBookURL(ticker1)
              );
              console.log(
                "SELL to",
                marketName2,
                marketInfo2.getOrderBookURL(ticker2)
              );
              console.log("--x--xx-xx-x---");
            } else if (price2 > 2 && price2 < 20) {
              console.log("--x--x--xx--");
              // const arbSentence = `BUY ${marketQuoteObj2.name} from ${
              //   marketName2.split("Quotes")[0]
              // } @ ${marketQuoteObj2.ask}\nSELL ${marketQuoteObj1.name} to ${
              //   marketName1.split("Quotes")[0]
              // } @ ${marketQuoteObj1.bid}`;
              // console.log(arbSentence);
              // const sent = `potential gain ${price2.toFixed(2)} %`;
              // console.log(sent);

              orderBookURLS.push({
                buyMarket: marketName2,
                buy: marketInfo2.getOrderBookURL(ticker2),
                buyMarketInfo: marketInfo2,
                sellMarket: marketName1,
                sell: marketInfo1.getOrderBookURL(ticker1),
                sellMarketInfo: marketInfo1,
              });

              console.log(
                "BUY from ",
                marketName2,
                marketInfo2.getOrderBookURL(ticker2)
              );
              console.log(
                "SELL to ",
                marketName1,
                marketInfo1.getOrderBookURL(ticker1)
              );
              console.log("--xx--x--xx-x--");
            }
          }
        });
      });
    }
  }

  const delay = 500;

  orderBookURLS.map(async (orderBook, index) => {
    return new Promise((resolve) => setTimeout(resolve, delay * index)).then(
      async () => {
        const orderBook1 = fetch(orderBook.buy)
          .then((res) => res.json())
          .then((data) => data);
        const orderBook2 = fetch(orderBook.sell)
          .then((res) => res.json())
          .then((data) => data);
        Promise.all([orderBook1, orderBook2]).then((res) => {
          // const buyOB = cryptoUtilities.findVal(res[0], "asks");
          // const sellOB = cryptoUtilities.findVal(res[1], "bids");
          // cryptoUtilities.calculateProfitFromOB(buyOB, sellOB);

          const buyOB = orderBook.buyMarketInfo.processOBData(res[0], "asks");
          const sellOB = orderBook.sellMarketInfo.processOBData(res[1], "bids");
          const { tBuy, tSell } = cryptoUtilities.calculateProfitFromOB(
            buyOB,
            sellOB,
            orderBook
          );
          console.log("---- xx ---- xx ---- xx ---");
          console.log(orderBook.buy, "tBuy ", tBuy);
          console.log(orderBook.sell, "tSell ", tSell);
          console.log("----- xxx ----- xx --- xxx ---");
          // console.log(
          //   orderBook.buyMarket,
          //   "Buy Order Book for",
          //   orderBook.buy,
          //   orderBook.buyMarketInfo.processOBData(res[0], "asks"),
          //   "\n",
          //   orderBook.sellMarket,
          //   "Sell order book for",
          //   orderBook.sell,
          //   orderBook.sellMarketInfo.processOBData(res[1], "bids")
          // );
        });
      }
    );
  });
  console.log(CONFIG.MARKET.FTX.getOrderBookURL("BTC/USD"));
  console.log(CONFIG.MARKET.KRAKEN.getOrderBookURL("BTCUSD"));
  console.log(CONFIG.MARKET.MEXC.getOrderBookURL("BTC_USDT"));
  console.log(CONFIG.MARKET.COINTIGER.getOrderBookURL("btcusdt"));
  console.log(CONFIG.MARKET.GATEIO.getOrderBookURL("BTC_USDT"));
  marketsQuotes.forEach((marketQuotes) => {
    const marketName = Object.keys(marketQuotes)[0];
    console.log("marketName", marketName);
  });
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  requestMarketData();

  res.end("Hello world");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
