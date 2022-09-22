const MARKET = {
  FTX: {
    APIURL: "https://ftx.com/api/",
    EXCLUDE_WORDS: ["BULL", "BEAR", "HALF", "HEDGE"],
  },
  KRAKEN: {
    APIURL: "https://api.kraken.com/0/public/",
  },
  COINTIGER: {
    APIURL: "https://www.cointiger.com/exchange/api/public/",
  },
  MEXC: {
    APIURL: "https://www.mexc.com/",
  },
  GATEIO: {
    APIURL: "https://api.gateio.ws/api/v4/",
  },
};

module.exports = {
  MARKET,
};
