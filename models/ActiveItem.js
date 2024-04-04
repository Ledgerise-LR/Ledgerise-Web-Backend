
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const ethers = require("ethers");
const abi = require("../constants/abi.json");
const async = require("async");
const saveToBlockchain = require("../listeners/saveRealItemHistory");
const visualVerification = require("./VisualVerification");
const Subcollection = require("./Subcollection");
const Iyzipay = require("iyzipay");
const NeedDetail = require("./NeedDetail");
const { getIdFromParams } = require("../utils/getIdFromParams");
const Donor = require("./Donor");
const {v4: uuidv4} = require("uuid");
const Need = require("./Need");
const Beneficiary = require("./Beneficiary");

require("dotenv").config();

const zeroRoute = {
  stampLocation: {
    latitude: 0,
    longitude: 0,
    decimals: 0
  },

  shipLocation: {
    latitude: 0,
    longitude: 0,
    decimals: 0
  },

  deliverLocation: {
    latitude: 0,
    longitude: 0,
    decimals: 0
  }
}

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
  },

  listingType: {
    type: String,
    enum: ["ACTIVE_ITEM", "NEED_ITEM"]
  },

  needDetails: {
    type: String,
    default: ""
  },

  marketplaceAddress: {
    type: String,
    default: ""
  },

  ledgeriseLensAddress: {
    type: String,
    default: ""
  },

  listTransactionHash: {
    type: String,
    default: ""
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
    nftAddress: body.nftAddress
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

activeItemSchema.statics.listItem = async function (body, callback) {

  Subcollection.findOne({ nftAddress: body.nftAddress, itemId: body.subcollectionId }, async (err, subcollection) => {
    
    const marketplaceAddress = subcollection.marketplaceAddress;
    const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

    const provider = new ethers.providers.WebSocketProvider(subcollection.providerUrl);
    const signer = new ethers.Wallet(
      `0x${process.env.OWNER_PRIVATE_KEY}`,
      provider
    )

    const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

    const tokenCounter = await marketplace.getListTokenCounter();

    const listItemBody = {
      itemId: `${subcollection.nftAddress}-${tokenCounter}`,
      seller: "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
      charityAddress: body.charityAddress,
      buyer: "0x00000",
      nftAddress: subcollection.nftAddress,
      tokenId: tokenCounter,
      price: body.price,
      subcollectionId: subcollection.itemId,
      tokenUri: body.tokenUri,
      availableEditions: body.availableEditions,
      route: body.route,
      listingType: "ACTIVE_ITEM",
      needDetails: "",
      marketplaceAddress: subcollection.marketplaceAddress,
      ledgeriseLensAddress: subcollection.ledgeriseLensAddress
    };

    const newActiveItem = new ActiveItem(listItemBody);
    if (newActiveItem) {
      const listItemTx = await marketplace.listItem(
        subcollection.nftAddress,
        tokenCounter,
        body.price,
        body.charityAddress,
        body.tokenUri,
        subcollection.itemId,
        body.availableEditions,
        body.route
      );
    
      const listItemTxReceipt = await listItemTx.wait(1);

      newActiveItem.listTransactionHash = listItemTxReceipt.transactionHash;

      await newActiveItem.save();
      return callback(null, newActiveItem);
    }
  });
}


activeItemSchema.statics.createNeed = async function (body, callback) {

  const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];
  
  const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

  const provider = new ethers.providers.WebSocketProvider(process.env.URL);
  const signer = new ethers.Wallet(
    `0x${process.env.OWNER_PRIVATE_KEY}`,
    provider
  );

  const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

  const nftAddress = networkMapping["MainCollection"][process.env.ACTIVE_CHAIN_ID];

  const needItemObjectBlockchain = {
    nftAddress: nftAddress,
    beneficiaryPhoneNumber: body.beneficiaryPhoneNumber,
    name: body.name,
    description: body.description,
    quantity: body.quantity,
    needTokenId: "",
    transactionHash: "",
    beneficiary_id: body.beneficiary_id,
    timestamp: ""
  };

  // const createNeedTx = await marketplace.connect(signer).createNeed(
  //   needItemObjectBlockchain.nftAddress,
  //   needItemObjectBlockchain.beneficiaryPhoneNumber,
  //   needItemObjectBlockchain.name,
  //   needItemObjectBlockchain.description,
  //   needItemObjectBlockchain.quantity
  // );

  // const createNeedTxReceipt = await createNeedTx.wait(1);

  // const needArgs = createNeedTxReceipt.events[0].args;
  // const needTokenId = needArgs.needTokenId.toNumber();

  // needItemObjectBlockchain.needTokenId = needTokenId;

  // const transactionHash = createNeedTxReceipt.transactionHash;

  // needItemObjectBlockchain.transactionHash = transactionHash;
  needItemObjectBlockchain.timestamp = Date.now();

  Need.addNewNeed(needItemObjectBlockchain, (err, needItem) => {
    if (err) return console.log("create_need_failed");

    Beneficiary.findById(needItem.beneficiary_id, (err, beneficiary) => {

      if (err) return console.log("create_need_failed");
      beneficiary.needs.push(needItem._id);
      beneficiary.save();
    })
    return callback(null, needItem);
  }); 
}


activeItemSchema.statics.listNeedItem = async function (body, callback) {

  Subcollection.findOne({ nftAddress: body.nftAddress, itemId: body.subcollectionId }, async (err, subcollection) => {
    
    const marketplaceAddress = subcollection.marketplaceAddress;
    const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

    const provider = new ethers.providers.WebSocketProvider(subcollection.providerUrl);
    const signer = new ethers.Wallet(
      `0x${process.env.OWNER_PRIVATE_KEY}`,
      provider
    );

    const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

    const tokenCounter = await marketplace.getListTokenCounter();

    const needDetailsBody = {
      beneficiaryPhoneNumber: body.beneficiaryPhoneNumber,
      depotAddress: body.depotAddress,
      beneficiaryAddress: body.beneficiaryAddress,
      orderNumber: body.orderNumber,
      donorPhoneNumber: body.donorPhoneNumber,
      donateTimestamp: Date.now(),
      needTokenId: body.needTokenId,
      quantitySatisfied: body.quantitySatisfied
    };

    const newNeedDetail = new NeedDetail(needDetailsBody);

    let listItemBody = {};

    if (newNeedDetail) {

      await newNeedDetail.save();

      listItemBody = {
        itemId: `${subcollection.nftAddress}-${tokenCounter}`,
        seller: "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
        charityAddress: body.charityAddress,
        buyer: "0x00000",
        nftAddress: subcollection.nftAddress,
        tokenId: tokenCounter,
        price: body.price,
        subcollectionId: subcollection.itemId,
        tokenUri: body.tokenUri,
        availableEditions: 1,
        route: zeroRoute,
        listingType: "NEED_ITEM",
        needDetails: newNeedDetail._id,
        marketplaceAddress: subcollection.marketplaceAddress,
        ledgeriseLensAddress: subcollection.ledgeriseLensAddress
      };

      const newActiveItem = new ActiveItem(listItemBody);
      if (newActiveItem) {

        const listNeedItemTx = await marketplace.listNeedItem(
          subcollection.nftAddress,
          tokenCounter,
          body.price,
          body.charityAddress,
          body.tokenUri,
          subcollection.itemId,
          needDetailsBody        
        );
  
        const listNeedItemTxReceipt = await listNeedItemTx.wait(1);
  
        newActiveItem.listTransactionHash = listNeedItemTxReceipt.transactionHash;
  
        await newActiveItem.save();

        ActiveItem.buyItemAlreadyBought({
          nftAddress: subcollection.nftAddress,
          tokenId: tokenCounter,
          school_number: needDetailsBody.donorPhoneNumber
        }, (err, activeItem) => {

          if (err) return console.log("list_need_failed");
          return callback(null, activeItem);
        });
      }
    }
  });
}


activeItemSchema.statics.buyItem = async function (body, callback) {

  ActiveItem.findOne({ itemId: getIdFromParams(body.nftAddress, body.tokenId) }, (err, activeItem) => {
    if (err) return console.log("bought_failed");

      Subcollection.findOne({ subcollectionId: activeItem.subcollectionId }, async (err, subcollection) => {
        if (err) return console.log("bought_failed");

        const marketplaceAddress = subcollection.marketplaceAddress;
        const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);
    
        const provider = new ethers.providers.WebSocketProvider(subcollection.providerUrl);
        const signer = new ethers.Wallet(
          `0x${process.env.OWNER_PRIVATE_KEY}`,
          provider
        )
        const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

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

        subcollection.totalRaised = (Number(subcollection.totalRaised) + Number(ethers.utils.formatEther(body.price, "ether"))).toString();

        activeItem.save();
        subcollection.save();
        return callback(null, activeItem);
    })
  })
}

activeItemSchema.statics.buyItemAlreadyBought = async function (body, callback) {

  ActiveItem.findOne({ tokenId: body.tokenId, nftAddress: body.nftAddress }, (err, activeItem) => {

    Subcollection.findOne({ itemId: activeItem.subcollectionId, nftAddress: activeItem.nftAddress }, async (err, subcollection) => {

      if (err) return callback("bought_failed");

      const marketplaceAddress = subcollection.marketplaceAddress;
      const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

      const provider = new ethers.providers.WebSocketProvider(subcollection.providerUrl);
      const signer = new ethers.Wallet(
        `0x${process.env.OWNER_PRIVATE_KEY}`,
        provider
      );

      const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const buyItemTx = await marketplace.connect(signer).buyItemWithFiatCurrency(
        activeItem.nftAddress,
        activeItem.tokenId,
        activeItem.charityAddress,
        activeItem.tokenUri,
        activeItem.price,
        body.school_number
      )

      const buyItemTxReceipt = await buyItemTx.wait(1);

      const args = buyItemTxReceipt.events[2].args;

      activeItem.buyer = body.school_number;
      activeItem.availableEditions = activeItem.availableEditions - 1;

      const currentDate = new Date();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


      const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
      const historyObject = {
        key: "buy",
        date: formattedDate,
        price: activeItem.price,
        buyer: body.school_number,
        openseaTokenId: parseInt(args.openseaTokenId),
        transactionHash: buyItemTxReceipt.transactionHash
      }

      activeItem.history.push(historyObject);

      subcollection.totalRaised = (parseInt(subcollection.totalRaised) + parseInt(activeItem.price)).toString();

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

  const {tokenURI, nftAddress, donorId, cardHolderName, cardNumber, expiryMonth, expiryYear, CVV, tokenName, tokenId, charityAddress} = body;

  ActiveItem.findOne({tokenId: tokenId}, (err, activeItem) => {
    if (err || !activeItem) return callback("bought_failed");

    Donor.findById(donorId, (err, donor) => {

      if (err || !donor) return callback("bought_failed");

      var request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: uuidv4(),
        price: activeItem.price.toString(),
        paidPrice: activeItem.price.toString(),
        currency: Iyzipay.CURRENCY.TRY,
        installment: '1',
        basketId: 'B67832',
        paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        paymentCard: {
            cardHolderName: cardHolderName,
            cardNumber: cardNumber,
            expireMonth: expiryMonth,
            expireYear: expiryYear,
            cvc: CVV,
            registerCard: '0'
        },
        buyer: {
            id: 'BY789',
            name: 'John',
            surname: 'Doe',
            gsmNumber: '+905350000000',
            email: 'email@email.com',
            identityNumber: '74300864791',
            lastLoginDate: '2015-10-05 12:43:35',
            registrationDate: '2013-04-21 15:12:09',
            registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            ip: '85.34.78.112',
            city: 'Istanbul',
            country: 'Turkey',
            zipCode: '34732'
        },
        shippingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        billingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        basketItems: [
            {
                id: uuidv4(),
                name: tokenName,
                category1: 'Ledgerise',
                category2: 'Donate',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: activeItem.price.toString()
            }
          ]
      };
      
      iyzipay.payment.create(request, async function (err, result) {
          if (!err && result.status == "success") {

            Subcollection.findOne({ subcollectionId: activeItem.subcollectionId }, async (err, subcollection) => {
            
              if (err) return callback("bought_failed");

              const marketplaceAddress = subcollection.marketplaceAddress;
              const marketplaceAbi = require(`../constants/abis/${subcollection.marketplaceAddress}.json`);
              
              const provider = new ethers.providers.WebSocketProvider(subcollection.providerUrl);
              const signer = new ethers.Wallet(
                `0x${process.env.OWNER_PRIVATE_KEY}`,
                provider
              );

              const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

              const buyItemTx = await marketplace.connect(signer).buyItemWithFiatCurrency(
                nftAddress,
                tokenId,
                charityAddress,
                tokenURI,
                activeItem.price,
                donor.school_number
              )
            
              const buyItemTxReceipt = await buyItemTx.wait(1);

              const args = buyItemTxReceipt.events[2].args;

              activeItem.buyer = donor.school_number;
              activeItem.availableEditions = activeItem.availableEditions - 1;

              const currentDate = new Date();
              const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


              const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
              const historyObject = {
                key: "buy",
                date: formattedDate,
                price: activeItem.price,
                buyer: donor.school_number,
                openseaTokenId: parseInt(args.openseaTokenId),
                transactionHash: buyItemTxReceipt.transactionHash
              }

              activeItem.history.push(historyObject);

              subcollection.totalRaised = (parseInt(subcollection.totalRaised) + parseInt(activeItem.price)).toString();

              activeItem.save();
              subcollection.save();
              return callback(null, activeItem);
            })
          } else {
            return callback("bought_failed");
          }
      });
    })
  })
}


activeItemSchema.statics.saveRealItemHistory = async function (body, callback) {


  if (body.key == "stamp" || body.key == "shipped" || body.key == "delivered") {

    if (typeof body.location.longitude == "number" && typeof body.location.latitude == "number") {
      ActiveItem.findOne({ tokenId: body.marketplaceTokenId, nftAddress: body.nftAddress }, async (err, activeItem) => {

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
          subcollectionId: activeItem.subcollectionId,
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
