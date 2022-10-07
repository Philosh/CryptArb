const calculateProfitFromOB = (buyOB, sellOB, orderBook) => {
  let [tBuy, tSell, nBuy, nSell] = [0, 0, 0, 0];
  let tempBuyOb = buyOB.map((e) => e);
  let tempSellOb = sellOB.map((e) => e);
  let buyPrice = tempBuyOb[nBuy].price;
  let sellPrice = tempSellOb[nSell].price;

  while (buyPrice * 1.004 < sellPrice) {
    let buyQty = tempBuyOb[nBuy].quantity;
    let sellQty = tempSellOb[nSell].quantity;
    if (buyQty > sellQty) {
      const cBuy = buyPrice * tempSellOb[nSell].quantity;
      const cSell = sellPrice * tempSellOb[nSell].quantity;
      tBuy += cBuy;
      tSell += cSell;
      tempBuyOb[nBuy].quantity -= tempSellOb[nSell].quantity;
      tempSellOb[nSell].quantity = 0;
      nSell += 1;
    } else if (sellQty > buyQty) {
      const cBuy = buyPrice * tempBuyOb[nBuy].quantity;
      const cSell = sellPrice * tempBuyOb[nBuy].quantity;
      tBuy += cBuy;
      tSell += cSell;
      tempSellOb[nSell].quantity -= tempBuyOb[nBuy].quantity;
      tempBuyOb[nBuy].quantity = 0;
      nBuy += 1;
    } else {
      const cBuy = buyPrice * tempBuyOb[nBuy].quantity;
      const cSell = sellPrice * tempSellOb[nSell].quantity;
      tBuy += cBuy;
      tSell += cSell;
      tempBuyOb[nBuy].quantity = 0;
      tempSellOb[nSell].quantity = 0;
      nBuy += 1;
      nSell += 1;
    }

    buyPrice =
      nBuy < tempBuyOb.length && nSell < tempSellOb.length
        ? tempBuyOb[nBuy].price
        : Number.MAX_SAFE_INTEGER;
    sellPrice = nSell < tempSellOb.length ? tempSellOb[nSell].price : 0;
  }

  return { tBuy, tSell };
};

const findVal = (object, key) => {
  var value;
  Object.keys(object).some(function (k) {
    if (k === key) {
      value = object[k];
      return true;
    }
    if (object[k] && typeof object[k] === "object") {
      value = findVal(object[k], key);
      return value !== undefined;
    }
  });
  return value;
};

module.exports = {
  calculateProfitFromOB,
  findVal,
};
