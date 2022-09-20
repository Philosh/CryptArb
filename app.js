const fetch = require("node-fetch");

const http = require("http");
const CONFIG = require("./cryptoConfig.js");

const hostname = "127.0.0.1";
const port = 3000;

const requestMarketData = () => {
  const ftxQuotes = fetch(CONFIG.MARKET.FTX.APIURL + "markets")
    .then((res) => res.json())
    .then((data) =>
      data.result
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
    );

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

      return Promise.all(krakenPromises).then((res) => res.filter((e) => e));
    });

  const cointigerQuotes = fetch(
    CONFIG.MARKET.COINTIGER.APIURL + "market/detail"
  )
    .then((res) => {
      if (!res.ok) {
        console.log("Response StatusCode", res.status);
        throw Error(res.statusText);
      }
      return res.json();
    })
    .then((data) => data)
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
    .then((data) =>
      data.data.filter(
        (e) =>
          e.symbol.includes("USDT") &&
          !e.symbol.includes("3L") &&
          !e.symbol.includes("3S") &&
          !e.symbol.includes("4L") &&
          !e.symbol.includes("4S")
      )
    )
    .catch(console.log);
  // Promise.all([krakenQuotes, mexcQuotes]).then((res) =>
  //   res[0].forEach((krakenQuote) => {
  //     const krakenName = Object.keys(krakenQuote)[0];
  //     res[1].forEach((mexcQuote) => {
  //       if (mexcQuote.symbol.split("_")[0] === krakenName.split("USD")[0]) {
  //         const gain1 =
  //           (Math.abs(krakenQuote[krakenName].c[0] - mexcQuote.last) /
  //             mexcQuote.last) *
  //           100;
  //         const gain2 =
  //           (Math.abs(mexcQuote.last - krakenQuote[krakenName].c[0]) /
  //             krakenQuote[krakenName].c[0]) *
  //           100;

  //         if (gain1 > 1 || gain2 > 1) {
  //           console.log("--------");
  //           console.log("gain1", gain1, "gain2", gain2);
  //           console.log("common names", krakenName);
  //           console.log("mexcQuote", mexcQuote);
  //           console.log("krakenQuote", krakenQuote);
  //           console.log("--------");
  //         }
  //       }
  //     });
  //   })
  // );

  Promise.all([cointigerQuotes, mexcQuotes]).then((res) => {
    const coinKeys = Object.keys(res[0]);
    res[1].forEach((mexcQuote) => {
      const mexcName = mexcQuote.symbol.split("_")[0];
      coinKeys.forEach((coinName) => {
        if (coinName.includes(mexcName)) {
          const gain1 =
            ((mexcQuote.bid - res[0][coinName].lowestAsk) /
              res[0][coinName].lowestAsk) *
            100;
          const gain2 =
            ((res[0][coinName].highestBid - mexcQuote.ask) / mexcQuote.ask) *
            100;

          if (gain1 > 5 && gain1 < 200) {
            console.log("-------");
            console.log("common name", mexcName);
            console.log("gain1", gain1);
            console.log("buy cointiger :", res[0][coinName].lowestAsk);
            console.log("sell mexc : ", mexcQuote.bid);
            console.log("--------");
          } else if (gain2 > 5 && gain2 < 200) {
            console.log("------");
            console.log("common name", mexcName);
            console.log("gain2", gain2);
            console.log("buy mexc : ", mexcQuote.ask);
            console.log("sell cointiger : ", res[0][coinName].highestBid);

            console.log("---------");
          }
        }
      });
    });
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
