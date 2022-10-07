const cryptoUtilities = require("./cryptoUtilities");

const MARKET = {
  FTX: {
    name: "FTX",
    APIURL: "https://ftx.com/api/",
    tickJoiner: "/",
    EXCLUDE_WORDS: ["BULL", "BEAR", "HALF", "HEDGE"],
    getOrderBookURL: (pair) => {
      return MARKET.FTX.APIURL + "markets/" + pair + "/orderbook?depth=20";
    },
    processOBData: (ob, bidOrAsk) => {
      return cryptoUtilities
        .findVal(ob, bidOrAsk)
        .map((e) => ({ price: parseFloat(e[0]), quantity: parseFloat(e[1]) }));
    },
  },
  KRAKEN: {
    name: "KRAKEN",
    APIURL: "https://api.kraken.com/0/public/",
    tickJoiner: "",
    getOrderBookURL: (pair) => {
      return MARKET.KRAKEN.APIURL + "Depth?pair=" + pair;
    },
    processOBData: (ob, bidOrAsk) => {
      return cryptoUtilities
        .findVal(ob, bidOrAsk)
        .map((e) => ({ price: parseFloat(e[0]), quantity: parseFloat(e[1]) }));
    },
  },
  COINTIGER: {
    name: "COINTIGER",
    APIURL: "https://www.cointiger.com/exchange/api/public/",
    tickJoiner: "",
    TRADING_MACRO: "https://api.cointiger.com/exchange/trading",
    getOrderBookURL: (pair) => {
      return (
        MARKET.COINTIGER.TRADING_MACRO +
        "/api/market/depth?symbol=" +
        pair.toLowerCase() +
        "&type=step0"
      );
    },
    processOBData: (ob, bidOrAsk) => {
      bidOrAsk = bidOrAsk == "bids" ? "buys" : bidOrAsk;
      return cryptoUtilities
        .findVal(ob, bidOrAsk)
        .map((e) => ({ price: parseFloat(e[0]), quantity: parseFloat(e[1]) }));
    },
  },
  MEXC: {
    name: "MEXC",
    APIURL: "https://www.mexc.com/",
    ORDERBOOK_POSTFIX: "open/api/v2/market/depth",
    tickJoiner: "_",
    getOrderBookURL: (pair) => {
      return (
        MARKET.MEXC.APIURL +
        MARKET.MEXC.ORDERBOOK_POSTFIX +
        "?depth=20&symbol=" +
        pair
      );
    },
    processOBData: (ob, bidOrAsk) => {
      return cryptoUtilities.findVal(ob, bidOrAsk).map((e) => ({
        price: parseFloat(e.price),
        quantity: parseFloat(e.quantity),
      }));
    },
  },
  GATEIO: {
    name: "GATEIO",
    APIURL: "https://api.gateio.ws/api/v4/",
    tickJoiner: "_",
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
    processOBData: (ob, bidOrAsk) => {
      return cryptoUtilities
        .findVal(ob, bidOrAsk)
        .map((e) => ({ price: parseFloat(e[0]), quantity: parseFloat(e[1]) }));
    },
  },
};

module.exports = {
  MARKET,
};
