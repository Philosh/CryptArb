const http = require("http");
const axios = require("axios");

const hostname = "127.0.0.1";
const port = 3000;

const URLS = {
  FTX_API: "https://ftx.com/api/",
  KRAKEN_API: "https://api.kraken.com/0/public/",
  COINTIGER_URL: "https://www.cointiger.com/exchange/api/public/market/detail",
};

const requestMarketData = () => {
  axios
    .get(URLS.FTX_API + "markets")
    .then((res) => {
      return {
        ftxQuotes: res.data.result
          .map((e) => ({
            name: e.name,
            last: e.last,
          }))
          .filter((e) => {
            return e.name.includes("USD");
          })
          .map((e) => ({
            name: e.name.split("/")[0],
            last: e.last,
          })),
      };
    })
    .then((res) => {
      res.ftxQuotes.forEach((ftxQuote) => {
        axios
          .get(URLS.KRAKEN_API + "OHLC?pair=" + ftxQuote.name + "usd")
          .then((res2) => {
            if (res2.data.error.length === 0) {
              const krakenClose = Object.values(res2.data.result)[0].slice(
                -1
              )[0][4];
              const gain1 =
                (Math.abs(krakenClose - ftxQuote.last) / krakenClose) * 100;
              const gain2 =
                (Math.abs(ftxQuote.last - krakenClose) / ftxQuote.last) * 100;

              if (gain1 > 2 || gain2 > 2) {
                console.log(
                  gain1,
                  gain2,
                  ftxQuote.name,
                  krakenClose,
                  ftxQuote.last
                );
              }
            }
          });
      });

      return { ftxQuotes: res.ftxQuotes };
    })
    .then((res) => {
      axios.get(URLS.COINTIGER_URL).then((res3) => {
        res.ftxQuotes.forEach((ftxQuote) => {
          if (res3.data[ftxQuote.name + "USDT"]) {
            gain1 =
              (Math.abs(
                ftxQuote.last - res3.data[ftxQuote.name + "USDT"].last
              ) /
                ftxQuote.last) *
              100;
            gain2 =
              (Math.abs(
                res3.data[ftxQuote.name + "USDT"].last - ftxQuote.last
              ) /
                res3.data[ftxQuote.name + "USDT"].last) *
              100;
            if (gain1 > 2 || gain2 > 2) {
              console.log("cointiger", {
                cname: ftxQuote.name,
                ftxQuote: ftxQuote.last,
                coinQuote: res3.data[ftxQuote.name + "USDT"].last,
                gain1: gain1,
                gain2: gain2,
              });
            }
          }
        });
      });
    })
    .catch((error) => {
      console.error(error.message);
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
