
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const ethers = require("ethers");
const abi = require("../constants/abi.json");
const async = require("async");
const saveToBlockchain = require("../listeners/saveRealItemHistory");
const visualVerification = require("./VisualVerification");
const Subcollection = require("./Subcollection");
const Iyzipay = require("iyzipay");
const { getIdFromParams } = require("../utils/getIdFromParams");
const Donor = require("./Donor");
const {v4: uuidv4} = require("uuid");

require("dotenv").config();


const activeItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    reqired: true,
    trim: true,
    unique: true
  },
  seller: {
    type: String,
    required: true
  },
  charityAddress: {
    type: String
  },
  buyer: {
    type: String
  },
  nftAddress: {
    type: String
  },
  tokenId: {
    type: Number
  },
  price: {
    type: String
  },
  subcollectionId: {
    type: Number
  },
  tokenUri: { // IPFS url
    type: String,
  },
  charityImage: {
    type: String
  },
  history: [
    event = {
      key: {
        type: String  // buy, list, update
      },
      date: {
        type: String
      },
      price: {
        type: String
      },
      buyer: {
        type: String
      },
      openseaTokenId: {
        type: Number
      },
      transactionHash: {
        type: String
      },
      isQrCodePrinted: {
        type: Boolean,
        required: false,
        default: false
      }
    }
  ],

  real_item_history: [  // ! important ! currently running on centralized Web2.0. However it is too easy to store this on Blockchain.
    event = {
      key: {
        type: String  // stamp, shipped, delivered
      },
      buyer: {  // Included in qr code
        type: String
      },
      openseaTokenId: {  // Included in qr code
        type: Number
      },
      date: {
        type: String
      },
      location: {  // will be comed as hashed will not be tamperable
        type: Object
      },
      transactionHash: {
        type: String
      },
      visualVerificationTokenId: {
        type: Number
      }
    }
  ],

  availableEditions: {
    type: Number
  },

  timestamp_created: {
    type: Date,
    default: Date.now
  },

  attributes: [],

  route: {
    type: Object,
  }
});

const PAYMENT_API_KEY = process.env.PAYMENT_API_KEY;
const PAYMENT_SECRET_KEY = process.env.PAYMENT_SECRET_KEY;


function getFiltersByQueries(priceRange, editionRange) {

  const filters = {
    priceFilters: [],
    editionFilters: []
  }

  priceRange
    ? priceRange.split(",").forEach(element => {
      filters.priceFilters.push(element)
    })
    : ""

  editionRange
    ? editionRange.split(",").forEach(element => {
      filters.editionFilters.push(element)
    })
    : ""


  return filters;
}

activeItemSchema.statics.createActiveItem = function (body, callback) {
  const newActiveItem = new ActiveItem(body);
  if (newActiveItem) {
    newActiveItem.save();
    return callback(null, newActiveItem);
  }
  return callback("bad_request");
}


let priceFilteredArray = [];
let editionFilteredArray = [];

activeItemSchema.statics.sortDefault = function (body, callback) {

  priceFilteredArray = [];
  editionFilteredArray = [];

  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter);
  ActiveItem.find({
    subcollectionId: body.subcollectionId,
  }, (err, activeItems) => {

    if (err) return callback(err);

    if (filters.priceFilters[0] == undefined && filters.editionFilters[0] == undefined) return callback(null, activeItems)

    filters.priceFilters[0] != undefined

      ? async.timesSeries(activeItems.length, (i, next) => {
        const activeItem = activeItems[i];
        const price = parseFloat(ethers.utils.formatEther(activeItem.price, "ether"));

        let flag = 0;

        filters.priceFilters.forEach(eachPriceFilter => {

          const [min, max] = eachPriceFilter.split("-");
          if (price >= parseFloat(min) && price <= parseFloat(max)) {
            flag = 1;
          }
        })

        if (flag) priceFilteredArray.push(activeItem);
        next();

      }, (err) => {
        if (err) return callback(err);
      })

      : priceFilteredArray = activeItems

    // console.log(priceFilteredArray.length)

    filters.editionFilters[0] != undefined
      ? async.timesSeries(priceFilteredArray.length, (j, next) => {
        const activeItem = priceFilteredArray[j];
        const editions = activeItem.availableEditions;

        let flag = 0;

        filters.editionFilters.forEach(eachEditionFilter => {
          const [min, max] = eachEditionFilter.split("-");
          if (editions >= parseInt(min) && editions <= parseInt(max)) {
            flag = 1;
          }
        })

        if (flag) editionFilteredArray.push(activeItem);
        next();

      }, (err) => {
        if (err) return callback(err);
      })

      : editionFilteredArray = priceFilteredArray

    return callback(null, editionFilteredArray);

  })
}


activeItemSchema.statics.sortPriceAscending = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);
  ActiveItem.find(filters)
    .sort({ price: 1 }).exec((err, docs) => {
      if (err) return callback(err);
      return callback(null, docs);
    });
}

activeItemSchema.statics.sortPriceDescending = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);

  ActiveItem.find(filters)
    .sort({ price: -1 }).exec((err, docs) => {
      if (err) return callback(err);
      return callback(null, docs);
    });
}

activeItemSchema.statics.sortOldest = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);

  ActiveItem.find(filters).sort({ timestamp_created: 1 }).exec((err, docs) => {
    if (err) return callback(err);
    return callback(null, docs);
  });
}

activeItemSchema.statics.sortNewest = function (body, callback) {
  const filters = getFiltersByQueries(body.priceFilter, body.availableEditionsFilter, body.subcollectionId);

  ActiveItem.find(filters).sort({ timestamp_created: -1 }).exec((err, docs) => {
    if (err) return callback(err);
    return callback(null, docs);
  });
}

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];

const provider = new ethers.providers.WebSocketProvider(process.env.URL);
const signer = new ethers.Wallet(
  `0x${process.env.OWNER_PRIVATE_KEY}`,
  provider
)

activeItemSchema.statics.buyItem = async function (body, callback) {

  const marketplace = new ethers.Contract(marketplaceAddress, abi, signer);

  const buyItemTx = await marketplace.connect(signer).buyItem(
    body.nftAddress,
    body.tokenId,
    body.charityAddress,
    body.tokenUri,
    body.ownerAddressString,
    { value: body.price }
  )

  const buyItemTxReceipt = await buyItemTx.wait(1);

  const args = buyItemTxReceipt.events[4].args;

  ActiveItem.findOne({ itemId: getIdFromParams(body.nftAddress, body.tokenId) }, (err, activeItem) => {
    if (err) return console.log("bought_failed");
    activeItem.buyer = body.ownerAddressString.toString();
    activeItem.availableEditions = activeItem.availableEditions - 1;
    activeItem.tokenId = body.tokenId;

    const currentDate = new Date();
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
    const historyObject = {
      key: "buy",
      date: formattedDate,
      price: body.price,
      buyer: body.ownerAddressString,
      openseaTokenId: parseInt(args.openseaTokenId),
      transactionHash: buyItemTxReceipt.transactionHash
    }
    activeItem.history.push(historyObject);

    Subcollection.findOne({ subcollectionId: activeItem.subcollectionId }, (err, subcollection) => {
      if (err) return console.log("bought_failed");
      subcollection.totalRaised = (Number(subcollection.totalRaised) + Number(ethers.utils.formatEther(body.price, "ether"))).toString();

      activeItem.save();
      subcollection.save();
      return callback(null, activeItem);
    })
  })

}


activeItemSchema.statics.buyItemCreditCard = async function (body, callback) {

  // iyzico payment

  const iyzipay = new Iyzipay({
    apiKey: PAYMENT_API_KEY,
    secretKey: PAYMENT_SECRET_KEY,
    uri: 'https://sandbox-api.iyzipay.com'
  })

  const {s_tokenCounter, donorId, price, cardHolderName, cardNumber, expiryMonth, expiryYear, cvc, tokenName, subcollectionName, tokenId} = body;


  Donor.findById(donorId, (err, donor) => {

    const paymentData = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: uuidv4(),
      price: price.toString(),
      paidPrice: price.toString(),
      currency: Iyzipay.CURRENCY.TRY,
      installment: '1',
      paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      paymentCard: {
          cardHolderName: cardHolderName,
          cardNumber: cardNumber,
          expireMonth: expiryMonth,
          expireYear: expiryYear[2] + expiryYear[3],
          cvc: cvc,
          registerCard: 0
      },
      buyer: {
          id: donor._id,
          name: donor.name,
          surname: donor.surname,
          gsmNumber: donor.phone_number,
          email: donor.email,
          identityNumber: donor.national_identification_number,
          registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
          ip: '85.34.78.112',
          city: 'Istanbul',
          country: 'Turkey',
      },
      shippingAddress: {
          contactName: donor.name,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1'
      },
      billingAddress: {
          contactName: donor.name,
          city: 'Istanbul',
          country: 'Turkey',
          address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1'
      },
      basketItems: [
          {
              id: tokenId.toString(),
              name: tokenName,
              category1: subcollectionName,
              itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
              price: price
          },
      ]
    };  
    iyzipay.payment.create(paymentData, (err, result) => {
      if (err) return console.error(err);
      console.log(result);
      return callback(null, true);
    })
    // Save to blockchain
  })
}


activeItemSchema.statics.saveRealItemHistory = async function (body, callback) {


  if (body.key == "stamp" || body.key == "shipped" || body.key == "delivered") {

    if (typeof body.location.longitude == "number" && typeof body.location.latitude == "number") {
      ActiveItem.findOne({ tokenId: body.marketplaceTokenId }, async (err, activeItem) => {

        if (err) return callback(err, null);

        // Save to centralized db

        const realItemHistoryData = {
          key: body.key,
          buyer: body.buyer,
          visualVerificationTokenId: body.visualVerificationTokenId,
          openseaTokenId: body.openseaTokenId,
          date: body.date,
          location: {
            latitude: body.location.latitude,
            longitude: body.location.longitude
          },
          transactionHash: ""
        }

        // Upload to blockchain

        const realItemHistoryBlockchainData = {
          nftAddress: activeItem.nftAddress,
          marketplaceTokenId: activeItem.tokenId,
          key: body.key,
          buyer: body.buyer,
          openseaTokenId: body.openseaTokenId,
          date: body.date,
          location: {
            latitude: body.location.latitude,
            longitude: body.location.longitude,
            decimals: 3
          },
          id: activeItem._id,
          visualVerificationTokenId: body.visualVerificationTokenId
        }

        const transactionHash = await saveToBlockchain(realItemHistoryBlockchainData)

        realItemHistoryData.transactionHash = transactionHash;
        activeItem.real_item_history.push(realItemHistoryData);
        activeItem.save();

        visualVerification.findByIdAndUpdate(body.visualVerificationItemId, { isUploadedToBlockchain: true }, (err, res) => {
          return callback(null, activeItem)
        })

        return callback(null, activeItem)
      })
    } else {
      return callback("bad_request", null);
    }
  } else {
    return callback("bad_request", null);
  }
}


const ActiveItem = mongoose.model("ActiveItem", activeItemSchema);

module.exports = ActiveItem
