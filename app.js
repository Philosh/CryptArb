const fetch = require("node-fetch");
const axios = require("axios");
const http = require("http");
const CONFIG = require("./cryptoConfig.js");

const hostname = "127.0.0.1";
const port = 3000;

const sleep = (milliseconds) => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
};
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
      marketInfo: {
        name: "FTX",
        apiURL: CONFIG.MARKET.FTX.APIURL,
        getOrderBookURL: CONFIG.MARKET.FTX.getOrderBookURL,
        tickJoiner: "/",
      },
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
        marketInfo: {
          name: "KRAKEN",
          apiURL: CONFIG.MARKET.KRAKEN.APIURL,
          getOrderBookURL: CONFIG.MARKET.KRAKEN.getOrderBookURL,
          tickJoiner: "",
        },
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
        marketInfo: {
          name: "COINTIGER",
          apiURL: CONFIG.MARKET.COINTIGER.APIURL,
          getOrderBookURL: CONFIG.MARKET.COINTIGER.getOrderBookURL,
          tickJoiner: "",
        },
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
      marketInfo: {
        name: "MEXC",
        apiURL: CONFIG.MARKET.MEXC.APIURL,
        getOrderBookURL: CONFIG.MARKET.MEXC.getOrderBookURL,
        tickJoiner: "_",
      },
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
        marketInfo: {
          name: "GATEIO",
          apiURL: CONFIG.MARKET.GATEIO.APIURL,
          getOrderBookURL: CONFIG.MARKET.GATEIO.getOrderBookURL,
          tickJoiner: "_",
        },
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
              const buyOrderBook = fetch(marketInfo1.getOrderBookURL(ticker1))
                .then((res) => res.json())
                .then((data) => data);
              const sellOrderBook = fetch(marketInfo2.getOrderBookURL(ticker2))
                .then((res) => res.json())
                .then((data) => data);
              Promise.all([buyOrderBook, sellOrderBook]).then((res) => {
                console.log(
                  marketName1,
                  "Buy Order Book",
                  buyOrderBook,
                  "\n",
                  marketName2,
                  "Sell order book",
                  sellOrderBook
                );
              });
              sleep(100);
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
