const http = require("http");
const axios = require("axios");

const hostname = "127.0.0.1";
const port = 3000;

const URLS = {
  FTX_API: "https://ftx.com/api/",
  KRAKEN_API: "https://api.kraken.com/0/public/",
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
          }),
      };
    })
    .then((res) => {
      console.log("ftxQuotes,", res.ftxQuotes);
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
