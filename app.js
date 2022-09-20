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
    .then((res) => res.json())
    .then((data) => data);

  Promise.all([cointigerQuotes]).then((res) =>
    res.forEach((e) => console.log("Result: ", e))
  );
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
