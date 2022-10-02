const MARKET = {
  FTX: {
    APIURL: "https://ftx.com/api/",
    EXCLUDE_WORDS: ["BULL", "BEAR", "HALF", "HEDGE"],
    getOrderBookURL: (pair) => {
      return MARKET.FTX.APIURL + "markets/" + pair + "/orderbook?depth=20";
    },
  },
  KRAKEN: {
    APIURL: "https://api.kraken.com/0/public/",
    getOrderBookURL: (pair) => {
      return MARKET.KRAKEN.APIURL + "Depth?pair=" + pair;
    },
  },
  COINTIGER: {
    APIURL: "https://www.cointiger.com/exchange/api/public/",
    TRADING_MACRO: "https://api.cointiger.com/exchange/trading",
    getOrderBookURL: (pair) => {
      return (
        MARKET.COINTIGER.TRADING_MACRO +
        "/api/market/depth?symbol=" +
        pair.toLowerCase() +
        "&type=step0"
      );
    },
  },
  MEXC: {
    APIURL: "https://www.mexc.com/",
    ORDERBOOK_POSTFIX: "open/api/v2/market/depth",
    getOrderBookURL: (pair) => {
      return (
        MARKET.MEXC.APIURL +
        MARKET.MEXC.ORDERBOOK_POSTFIX +
        "?depth=20&symbol=" +
        pair
      );
    },
  },
  GATEIO: {
    APIURL: "https://api.gateio.ws/api/v4/",
    ORDERBOOK_POSTFIX: "spot/order_book",
    getOrderBookURL: (pair) => {
      return (
        MARKET.GATEIO.APIURL +
        MARKET.GATEIO.ORDERBOOK_POSTFIX +
        "?currency_pair=" +
        pair +
        "&limit=20"
      );
    },
  },
};

module.exports = {
  MARKET,
};
