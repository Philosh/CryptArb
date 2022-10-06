const calculateProfitFromOB = (buyOB, sellOB) => {
  let [tBuy, tSell, nBuy, nSell] = [0, 0, 0, 0];
  console.log(buyOB, sellOB);
  let tempBuyOb = {
    ...buyOB,
  };
  let tempSellOb = {
    ...sellOB,
  };
  let buyPrice = tempBuyOb[nBuy].price;
  let sellPrice = tempSellOb[nSell].price;
  while (buyPrice < sellPrice * 1.004) {
    let buyQty = tempBuyOb[nBuy];
    let sellQty = tempSellOb[nSell];
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

    if (tempBuyOb[nBuy] === undefined) {
      console.log("buyOb", buyOB, "sellOb", sellOB);
    }

    buyPrice =
      nBuy < tempBuyOb.length && nSell < tempSellOb.length
        ? tempBuyOb[nBuy].price
        : tempSellOb[nSell - 1].price;
    sellPrice = nSell < tempSellOb.length ? tempSellOb[nSell].price : 0;
  }
  console.log("tBuy", tBuy, "tSell", tSell);
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
