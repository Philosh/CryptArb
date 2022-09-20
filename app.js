const fetch = require("node-fetch");

const http = require("http");
const CONFIG = require("./cryptoConfig.js");

const hostname = "127.0.0.1";
const port = 3000;

const requestMarketData = () => {
  const ftxQuotes = fetch(CONFIG.MARKET.FTX.APIURL + "markets")
    .then((res) => res.json())
    .then((data) => ({
      ftxQuotes: data.result
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
        krakenQuotes: res
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
      return { coinTigerQuotes };
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
      mexcQuotes: data.data
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
    }))
    .catch(console.log);

  Promise.all([ftxQuotes, krakenQuotes]).then((res) => {
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
          const compMarketName1 = marketName1.slice(0, -1);
          const compMarketName2 = marketName2.slice(0, -1);
          if (
            marketQuoteObj1.name === marketQuoteObj2.name ||
            compMarketName1 === marketQuoteObj2.name ||
            compMarketName2 === marketQuoteObj1.name
          ) {
            console.log(
              "common ",
              marketName1,
              compMarketName1,
              marketName2,
              compMarketName2
            );
            const price1 =
              ((marketQuoteObj2.bid - marketQuoteObj1.ask) /
                marketQuoteObj1.ask) *
              100;
            const price2 =
              ((marketQuoteObj1.bid - marketQuoteObj2.ask) /
                marketQuoteObj2.ask) *
              100;

            if ((price1 > 2 && price1 < 5) || (price2 > 2 && price2 < 5)) {
              console.log("-------");
              console.log("market1: ", marketName1, ", market2: ", marketName2);
              console.log(marketQuoteObj1, marketQuoteObj2);
              console.log("price1 : ", price1, " price2 : ", price2);
              console.log("-------");
            }
          }
        });
      });
    }
  }
  marketsQuotes.forEach((marketQuotes) => {
    const marketName = Object.keys(marketQuotes)[0];
    console.log("marketName", marketName);
    console.log(marketQuotes[marketName][0]);
  });
};

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/plain");
  requestMarketData();
  res.end("Hello World");
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
