
const mongoose = require("mongoose");
const networkMapping = require("../constants/networkMapping.json");
const ethers = require("ethers");
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
const { checkForBuyerPresence } = require("../utils/checkForBuyerPresence");
const TokenUri = require("./tokenUri");
const { sendDonationEmail, sendVerificationEmail } = require("../utils/sendMail");

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
  },

  isCanceled: {
    type: Boolean,
    default: false
  },

  cancelItemTransactionHash: {
    type: String,
    default: ""
  },

  blockExplorerUrl: {
    type: String
  }, 

  chainId: {
    type: String
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
      charityAddress: "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
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
      ledgeriseLensAddress: subcollection.ledgeriseLensAddress,
      blockExplorerUrl: subcollection.blockExplorerUrl,
      chainId: subcollection.chainId
    };

    const newActiveItem = new ActiveItem(listItemBody);
    if (newActiveItem) {
      const listItemTx = await marketplace.listItem(
        subcollection.nftAddress,
        tokenCounter,
        body.price,
        "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
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


activeItemSchema.statics.updateItem = function (body, callback) {
  ActiveItem.findOne({ nftAddress: body.nftAddress, tokenId: body.tokenId }, async (err, activeItem) => {
    if (err || !activeItem) return callback("cannot_found");
    if (!err && activeItem) {

      activeItem.price = body.price;
      activeItem.tokenUri = body.tokenUri;

      const marketplaceAddress = activeItem.marketplaceAddress;
      
      const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

      const provider = new ethers.providers.WebSocketProvider(activeItem.providerUrl);
      const signer = new ethers.Wallet(
        `0x${process.env.OWNER_PRIVATE_KEY}`,
        provider
      );

      const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const updateListingTx = await marketplace.updateListing(
        activeItem.nftAddress,
        activeItem.tokenId,
        body.price,
        activeItem.charityAddress,
        body.tokenUri
      );

      const updateListingTxReceipt = await updateListingTx.wait(1);

      const currentDate = new Date();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

      const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;

      const updateTransactionHash = updateListingTxReceipt.transactionHash;

      activeItem.history.push({
        key: "update",
        date: formattedDate,
        price: body.price,
        transactionHash: updateTransactionHash
      });

      await activeItem.save();
      return callback(null, activeItem);
    }
  })
}


activeItemSchema.statics.cancelItem = function (body, callback) {

  ActiveItem.findOne({ nftAddress: body.nftAddress, tokenId: body.tokenId }, async (err, activeItem) => {

    if (err || !activeItem) return callback("cannot_found");
    if (activeItem) {
      activeItem.isCanceled = true;

      const marketplaceAddress = activeItem.marketplaceAddress;
      
      const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

      const provider = new ethers.providers.WebSocketProvider(activeItem.providerUrl);
      const signer = new ethers.Wallet(
        `0x${process.env.OWNER_PRIVATE_KEY}`,
        provider
      );

      const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const cancelItemTx = await marketplace.cancelItem(
        activeItem.nftAddress,
        activeItem.tokenId
      );

      const cancelItemTxReceipt = await cancelItemTx.wait(1);

      activeItem.cancelItemTransactionHash = cancelItemTxReceipt.transactionHash;

      await activeItem.save()
      return callback(null, activeItem);
    }
  })
}


activeItemSchema.statics.createNeed = async function (body, callback) {


    Beneficiary.findById(body.beneficiary_id, async (err, beneficiary) => {
        
      const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];
      
      const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

      const provider = new ethers.providers.WebSocketProvider(process.env.URL);
      const signer = new ethers.Wallet(
        `0x${process.env.OWNER_PRIVATE_KEY}`,
        provider
      );

      const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

      const nftAddress = beneficiary.nftAddress;

      const needItemObjectBlockchain = {
        nftAddress: nftAddress,
        beneficiaryPhoneNumber: body.beneficiaryPhoneNumber,
        name: body.name,
        description: body.description,
        quantity: body.quantity,
        needTokenId: "",
        transactionHash: "",
        beneficiary_id: body.beneficiary_id,
        timestamp: "",
        location: {
          latitude: body.latitude,
          longitude: body.longitude
        },
        marketplaceAddress: marketplaceAddress,
        ledgeriseLensAddress: networkMapping["LedgeriseLens"][process.env.ACTIVE_CHAIN_ID],
        providerUrl: process.env.URL,
        nftAddress: beneficiary.nftAddress,
        subcollectionId: beneficiary.subcollectionId
      };

      const createNeedTx = await marketplace.connect(signer).createNeed(
        needItemObjectBlockchain.nftAddress,
        needItemObjectBlockchain.beneficiaryPhoneNumber,
        needItemObjectBlockchain.name,
        needItemObjectBlockchain.description,
        needItemObjectBlockchain.quantity,
        needItemObjectBlockchain.location.latitude,
        needItemObjectBlockchain.location.longitude
      );

      const createNeedTxReceipt = await createNeedTx.wait(1);

      const needArgs = createNeedTxReceipt.events[0].args;
      const needTokenId = needArgs.needTokenId.toNumber();

      needItemObjectBlockchain.needTokenId = needTokenId;

      const transactionHash = createNeedTxReceipt.transactionHash;

      needItemObjectBlockchain.transactionHash = transactionHash;
      needItemObjectBlockchain.timestamp = Date.now();

      Need.addNewNeed(needItemObjectBlockchain, (err, needItem) => {

        if (err) return console.log("create_need_failed");
        beneficiary.needs.push(needItem._id);
        beneficiary.save();
        return callback(null, needItem);
      })
  }); 
}


activeItemSchema.statics.listNeedItem = async function (body, callback) {

  Need.findById(body.needId, async (err, need) => {
    
    if (err) return callback(err);

    const marketplaceAddress = need.marketplaceAddress;
    const marketplaceAbi = require(`../constants/abis/${marketplaceAddress}.json`);

    const provider = new ethers.providers.WebSocketProvider(need.providerUrl);
    const signer = new ethers.Wallet(
      `0x${process.env.OWNER_PRIVATE_KEY}`,
      provider
    );

    const marketplace = new ethers.Contract(marketplaceAddress, marketplaceAbi, signer);

    const tokenCounter = await marketplace.getListTokenCounter();

    const needDetailsBody = {
      beneficiaryPhoneNumber: need.beneficiaryPhoneNumber,
      depotAddress: body.depotAddress,
      beneficiaryAddress: body.beneficiaryAddress,
      orderNumber: body.orderNumber,
      donorPhoneNumber: body.donorPhoneNumber,
      donateTimestamp: Date.now(),
      needTokenId: need.needTokenId,
      quantitySatisfied: body.quantitySatisfied
    };

    const newNeedDetail = new NeedDetail(needDetailsBody);

    let listItemBody = {};

    if (newNeedDetail) {

      await newNeedDetail.save();

      listItemBody = {
        itemId: `${need.nftAddress}-${tokenCounter}`,
        seller: "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
        charityAddress: "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
        buyer: "0x0000000000000000000000000000000000000000",
        nftAddress: need.nftAddress,
        tokenId: tokenCounter,
        price: body.price,
        subcollectionId: need.subcollectionId,
        tokenUri: body.tokenUri,
        availableEditions: 1,
        route: zeroRoute,
        listingType: "NEED_ITEM",
        needDetails: newNeedDetail._id,
        marketplaceAddress: need.marketplaceAddress,
        ledgeriseLensAddress: need.ledgeriseLensAddress
      };

      const newActiveItem = new ActiveItem(listItemBody);
      if (newActiveItem) {

        // console.log([need.nftAddress,
        //   tokenCounter,
        //   body.price,
        //   "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
        //   body.tokenUri,
        //   needDetailsBody])

        const listNeedItemTx = await marketplace.listNeedItem(
          need.nftAddress,
          tokenCounter,
          body.price,
          "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
          body.tokenUri,
          needDetailsBody
        );
  
        const listNeedItemTxReceipt = await listNeedItemTx.wait(1);
  
        newActiveItem.listTransactionHash = listNeedItemTxReceipt.transactionHash;
  
        await newActiveItem.save();

        ActiveItem.buyItemAlreadyBought({
          nftAddress: need.nftAddress,
          tokenId: tokenCounter,
          phone_number: needDetailsBody.donorPhoneNumber
        }, (err, activeItem) => {

          need.currentSatisfiedNeedQuantity += 1;
          need.save()

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
          activeItem.charityAddress,
          activeItem.tokenUri,
          body.ownerAddressString,
          { value: activeItem.price }
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
          price: activeItem.price,
          buyer: body.ownerAddressString,
          openseaTokenId: parseInt(args.openseaTokenId),
          transactionHash: buyItemTxReceipt.transactionHash
        }
        activeItem.history.push(historyObject);

        subcollection.totalRaised = (Number(subcollection.totalRaised) + Number(ethers.utils.formatEther(activeItem.price, "ether"))).toString();

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
        body.phone_number
      )

      const buyItemTxReceipt = await buyItemTx.wait(1);

      const args = buyItemTxReceipt.events[2].args;

      activeItem.buyer = body.phone_number;
      activeItem.availableEditions = activeItem.availableEditions - 1;

      const currentDate = new Date();
      const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


      const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
      const historyObject = {
        key: "buy",
        date: formattedDate,
        price: activeItem.price,
        buyer: body.phone_number,
        openseaTokenId: parseInt(args.openseaTokenId),
        transactionHash: buyItemTxReceipt.transactionHash
      }

      activeItem.history.push(historyObject);

      subcollection.totalRaised = (parseInt(subcollection.totalRaised) + parseInt(activeItem.price)).toString();

      activeItem.save();
      subcollection.save();

      sendDonationEmail({
        donor: body.phone_number,
        tokenId: activeItem.tokenId,
        subcollectionId: activeItem.subcollectionId,
        nftAddress: activeItem.nftAddress,
        collectionName: subcollection.name
      }, (err, data) => {
        if (err) return console.log("Couldn't send email, please compensate it manually.")
        return callback(null, activeItem);
      })
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

  const {nftAddress, donorId, cardHolderName, cardNumber, expiryMonth, expiryYear, CVV, tokenName, tokenId} = body;

  ActiveItem.findOne({tokenId: tokenId, nftAdress: nftAddress}, (err, activeItem) => {
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
                activeItem.charityAddress,
                activeItem.tokenUri,
                activeItem.price,
                donor.phone_number
              )
            
              const buyItemTxReceipt = await buyItemTx.wait(1);

              const args = buyItemTxReceipt.events[2].args;

              activeItem.buyer = donor.phone_number;
              activeItem.availableEditions = activeItem.availableEditions - 1;

              const currentDate = new Date();
              const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];


              const formattedDate = `${currentDate.getDate()} ${months[currentDate.getMonth()]} ${currentDate.getFullYear().toString()}`;
              const historyObject = {
                key: "buy",
                date: formattedDate,
                price: activeItem.price,
                buyer: donor.phone_number,
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

        saveToBlockchain(realItemHistoryBlockchainData, (err, transactionHash) => {

          realItemHistoryData.transactionHash = transactionHash;
          activeItem.real_item_history.push(realItemHistoryData);
          activeItem.save();

          visualVerification.findByIdAndUpdate(body.visualVerificationItemId, { isUploadedToBlockchain: true }, (err, res) => {
            
            TokenUri.findOne({ tokenUri: activeItem.tokenUri }, (err, tokenUriObject) => {
              const tokenName = tokenUriObject.name;

              sendVerificationEmail({
                tokenName: tokenName,
                subcollectionId: activeItem.subcollectionId,
                tokenId: activeItem.tokenId,
                key: body.key,
                donor: body.buyer,
                nftAddress: activeItem.nftAddress
              }, (err, data) => {
                return callback(null, activeItem);
              })
            })
          })

          return callback(null, activeItem)
        })
      })
    } else {
      return callback("bad_request", null);
    }
  } else {
    return callback("bad_request", null);
  }
}


activeItemSchema.statics.createSubcollection = async function (body, callback) {

  const mainCollectionAddress = networkMapping["MainCollection"][process.env.ACTIVE_CHAIN_ID];


  const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];
  const ledgeriseLensAddress = networkMapping["LedgeriseLens"][process.env.ACTIVE_CHAIN_ID];


  const provider = new ethers.providers.WebSocketProvider(process.env.URL);
  const signer = new ethers.Wallet(
    `0x${process.env.OWNER_PRIVATE_KEY}`,
    provider
  )

  const mainCollectionAbi = require(`../constants/abis/${mainCollectionAddress}.json`);

  const mainCollection = new ethers.Contract(mainCollectionAddress, mainCollectionAbi, signer);

  const id = await mainCollection.getSubcollectionCounter();

  const createSubcollectionBlockchain = {
    itemId: id.toString(),
    name: body.name.toString(),
    charityAddress: "0x6FaEbbE2b593B5577E349dc37A0f97cD212238D2",
    nftAddress: mainCollectionAddress,
    marketplaceAddress: marketplaceAddress,
    ledgeriseLensAddress: ledgeriseLensAddress,
    providerUrl: process.env.URL,
    image: body.image,
    companyCode: body.companyCode,
    blockExplorerUrl: process.env.BLOCK_EXPLORER_URL,
    chainId: process.env.ACTIVE_CHAIN_ID
  }

  const newSubcollection = new Subcollection(createSubcollectionBlockchain);
  if (newSubcollection) {

    const createSubcollectionTx = await mainCollection.createSubcollection(
      createSubcollectionBlockchain.name,
      createSubcollectionBlockchain.charityAddress,
      []
    );

    const createSubcollectionTxReceipt = await createSubcollectionTx.wait(1);

    newSubcollection.transactionHash = createSubcollectionTxReceipt.transactionHash;

    newSubcollection.save();
    return callback(null, newSubcollection);
  }
  return callback("bad_request");
}

activeItemSchema.statics.getSatisfiedDonationsOfDonor = async function (body, callback) {
  let needItemsArray = [];

  ActiveItem.find({ listingType: "NEED_ITEM", buyer: body.buyer }, (err, needItems) => {
    if (err) return callback(err);

    async.timesSeries(needItems.length, (i, next) => {
      const needItem = needItems[i];

      NeedDetail.findById(needItem.needDetails, (err, needDetails) => {
        if (err) return callback(err);

        Need.findOne({ nftAddress: needItem.nftAddress, needTokenId: needDetails.needTokenId }, (err, need) => {

          if (err) return callback(err);

          needItemsArray.push({
            needItem: needItem,
            needDetails: needDetails,
            need: need
          });
          next();
        })
      })
    }, (err) => {
      if (err) return callback(err);

      return callback(null, needItemsArray);
    })
  })
}


activeItemSchema.statics.getAsset = async function (body, callback) {
  ActiveItem.findOne({ tokenId: body.tokenId, subcollectionId: body.subcollectionId, nftAddress: body.nftAddress }, async (err, activeItem) => {
    const groupedObjects = {};

    const subcollection = await Subcollection.findOne({ nftAddress: body.nftAddress, itemId: body.subcollectionId });
    let chainId = process.env.ACTIVE_CHAIN_ID;
    if (subcollection) chainId = subcollection.chainId;

    if (err || !activeItem) return callback("bad_request")
    if (!err && activeItem) {
      async.timesSeries(activeItem.real_item_history.length, (i, next) => {
        const obj = activeItem.real_item_history[i];

        const tokenId = obj.openseaTokenId;
        if (!groupedObjects[tokenId]) {
          groupedObjects[tokenId] = [];
        }

        groupedObjects[tokenId].push(obj);
        next()
      }, async (err) => {

        const groupedArray = Object.values(groupedObjects);

        TokenUri.findOne({ tokenUri: activeItem.tokenUri }, (err, tokenUriObject) => {
          const tokenName = tokenUriObject.name.trim();
          const tokenNameArray = tokenName.split("/");


          if (parseInt(tokenNameArray[0].split("(")[1]) == 1 &&
            typeof parseInt(tokenNameArray[1].split(")")[0]) == "number") {

            const numberOfCollaborators = parseInt(tokenNameArray[1].split(")")[0]);
            const collaboratorClustersSet = [];
            const priorityList = [];
            let eachCollaboratorSet = [];
            async.timesSeries(activeItem.history.length, (j, next) => {

              if (eachCollaboratorSet.length == numberOfCollaborators) {
                collaboratorClustersSet.push(eachCollaboratorSet);
                eachCollaboratorSet = [];
              }

              if (activeItem.history[j].key == "buy") {

                let flag = checkForBuyerPresence(activeItem.history[j].buyer, eachCollaboratorSet);

                if (flag) {
                  eachCollaboratorSet.push(`${activeItem.history[j].openseaTokenId}_${activeItem.history[j].buyer}`);
                }
                else if (!flag) priorityList.push(`${activeItem.history[j].openseaTokenId}_${activeItem.history[j].buyer}`);
              }

              next();
            }, (err) => {
              if (eachCollaboratorSet.length) {
                collaboratorClustersSet.push(eachCollaboratorSet);
              }

              async.timesSeries(collaboratorClustersSet.length, (k, nextK) => {
                const eachCollaboratorSet = collaboratorClustersSet[k];
                if (eachCollaboratorSet.length == numberOfCollaborators) {
                  return nextK();
                } else {
                  if (priorityList.length) {
                    async.timesSeries(priorityList.length, (l, nextL) => {
                      if (priorityList[l]) {
                        let flagL = checkForBuyerPresence(priorityList[l].split("_")[1], eachCollaboratorSet);
                        if (eachCollaboratorSet.length == numberOfCollaborators) return nextK();
                        else if (flagL) {
                          eachCollaboratorSet.push(priorityList[l]);
                          priorityList.splice(l, 1);
                          return nextL();
                        } else {
                          return nextL();
                        }
                      } else {
                        nextL();
                      }
                    }, (err) => {
                      nextK();
                    })
                  } else {
                    nextK();
                  }
                }
              }, (err) => {
                if (priorityList.length) {
                  async.timesSeries(priorityList.length, (m, nextM) => {
                    const arr = [priorityList[m]];
                    collaboratorClustersSet.push(arr);
                    nextM();
                  }, (err) => {
                    return callback(
                      null,
                      {
                        seller: activeItem.seller,
                        nftAddress: activeItem.nftAddress,
                        tokenId: activeItem.tokenId,
                        charityAddress: activeItem.charityAddress,
                        tokenUri: activeItem.tokenUri,
                        price: activeItem.price,
                        availableEditions: activeItem.availableEditions,
                        subcollectionId: activeItem.subcollectionId,
                        history: activeItem.history,
                        attributes: activeItem.attributes,
                        real_item_history: groupedArray,
                        route: activeItem.route,
                        listTransactionHash: activeItem.transactionHash,
                        collaborators: collaboratorClustersSet,
                        chainId: chainId || process.env.ACTIVE_CHAIN_ID,
                        ledgeriseLensAddress: activeItem.ledgeriseLensAddress
                      }
                    );
                  })
                } else {
                  return callback(
                    null,
                    {
                      seller: activeItem.seller,
                      nftAddress: activeItem.nftAddress,
                      tokenId: activeItem.tokenId,
                      charityAddress: activeItem.charityAddress,
                      tokenUri: activeItem.tokenUri,
                      price: activeItem.price,
                      availableEditions: activeItem.availableEditions,
                      subcollectionId: activeItem.subcollectionId,
                      history: activeItem.history,
                      attributes: activeItem.attributes,
                      real_item_history: groupedArray,
                      route: activeItem.route,
                      listTransactionHash: activeItem.transactionHash,
                      collaborators: collaboratorClustersSet,
                      chainId: chainId || process.env.ACTIVE_CHAIN_ID,
                      ledgeriseLensAddress: activeItem.ledgeriseLensAddress
                    }
                  );
                }
              })
            })
          } else {
            return callback(
              null,
              {
                seller: activeItem.seller,
                nftAddress: activeItem.nftAddress,
                tokenId: activeItem.tokenId,
                charityAddress: activeItem.charityAddress,
                tokenUri: activeItem.tokenUri,
                price: activeItem.price,
                availableEditions: activeItem.availableEditions,
                subcollectionId: activeItem.subcollectionId,
                history: activeItem.history,
                attributes: activeItem.attributes,
                real_item_history: groupedArray,
                route: activeItem.route,
                listTransactionHash: activeItem.transactionHash,
                collaborators: [],
                chainId: chainId || process.env.ACTIVE_CHAIN_ID,
                ledgeriseLensAddress: activeItem.ledgeriseLensAddress
              }
            );
          }
        })
      })
    }
  })
}


let randomIndexPrev = 1;

activeItemSchema.statics.getRandomFeaturedAsset = async function (body, callback) {
  ActiveItem.find({ listingType: "ACTIVE_ITEM" }, (err, activeItems) => {
    if (err) return callback("bad_request");
    let randomIndex;
    if (activeItems.length == 1) {
      randomIndex = 0;
    } else {
      do {
        randomIndex = Math.floor(Math.random() * activeItems.length);
      } while (randomIndex == randomIndexPrev);
    }
    if (activeItems.length <= 0) {
      return callback("no_assets_found");
    }
    Subcollection.findOne({ itemId: activeItems[randomIndex].subcollectionId, nftAddress: activeItems[randomIndex].nftAddress }, (err, collection) => {
      randomIndexPrev = randomIndex;

      return callback(
        null,
        {
          tokenId: activeItems[randomIndex].tokenId,
          tokenUri: activeItems[randomIndex].tokenUri,
          price: activeItems[randomIndex].price,
          totalRaised: collection.totalRaised,
          collectionName: collection.name,
          charityAddress: collection.charityAddress,
          nftAddress: activeItems[randomIndex].nftAddress,
          totalDonated: activeItems[randomIndex].history.filter(historyEvent => historyEvent.key == "buy").length,
          subcollectionId: activeItems[randomIndex].subcollectionId
        }
      );
    })
  })
}


activeItemSchema.statics.getReceiptData = async function (body, callback) {
  ActiveItem.findOne({ tokenId: body.tokenId, nftAddress: body.nftAddress /*, listingType: "ACTIVE_ITEM"*/ }, (err, activeItem) => {
    if (err) return callback("cannot_get_active_item");
    async.timesSeries(activeItem.history.length, (i, next) => {
      let eachHistory = activeItem.history[i];

      const history = {
        key: eachHistory.key,
        date: eachHistory.date,
        price: eachHistory.price,
        openseaTokenId: eachHistory.openseaTokenId,
        subcollectionId: activeItem.subcollectionId
      }

      if (body.buyer && body.openseaTokenId && eachHistory.buyer == body.buyer && eachHistory.openseaTokenId == body.openseaTokenId) return callback(null, history);
      else return next();
    }, (err) => {
      if (err) return callback("fetch_error");
      return callback("verify_failed");
    })
  })
}


activeItemSchema.statics.markQrCodeAsPrinted = async function (body, callback) {
  const tokenId = body.tokenId;
  const nftAddress = body.nftAddress;
  const openseaTokenIdArray = body.openseaTokenIdArray;

  ActiveItem.findOne({ tokenId: tokenId, nftAddress: nftAddress }, (err, activeItem) => {
    async.timesSeries(openseaTokenIdArray.length, (i, next1) => {
    
      const eachOpenseaTokenId = openseaTokenIdArray[i];

      async.timesSeries(activeItem.history, (j, next2) => {
        const eachHistoryItem = activeItem.history[j];
        if (eachHistoryItem.key == "buy" && eachHistoryItem.openseaTokenId == eachOpenseaTokenId) {
          activeItem.history[j].isQrCodePrinted = true;
          next1();
        }
        next2();
      }, (err) => {
        if (err) return callback("bad_request");
        next1();
      })
    }, (err) => {
      if (err) return callback("bad_request");

      activeItem.save();
      return callback(null, activeItem.history)
    })
  })
}


activeItemSchema.statics.getGeneralQrData = function (body, callback) {

  ActiveItem.findOne({ nftAddress: body.nftAddress, tokenId: parseInt(body.tokenId) }, (err, activeItem) => {

    Subcollection.findOne({ nftAddress: activeItem.nftAddress, itemId: activeItem.subcollectionId }, (err, subcollection) => {

      TokenUri.findOne({ tokenUri: activeItem.tokenUri }, (err, tokenUri) => {

        const generalQrData = {
          campaignName: subcollection.name,
          assetName: tokenUri.name,
          stampLocation: {
            latitude: (parseInt(activeItem.route.stampLocation.latitude) / (10 ** parseInt(activeItem.route.stampLocation.decimals))).toFixed(3),
            longitude: (parseInt(activeItem.route.stampLocation.longitude) / (10 ** parseInt(activeItem.route.stampLocation.decimals))).toFixed(3)
          },
          shipLocation: {
            latitude: (parseInt(activeItem.route.shipLocation.latitude) / (10 ** parseInt(activeItem.route.shipLocation.decimals))).toFixed(3),
            longitude: (parseInt(activeItem.route.shipLocation.longitude) / (10 ** parseInt(activeItem.route.shipLocation.decimals))).toFixed(3)
          },
          deliverLocation: {
            latitude: (parseInt(activeItem.route.deliverLocation.latitude) / (10 ** parseInt(activeItem.route.deliverLocation.decimals))).toFixed(3),
            longitude: (parseInt(activeItem.route.deliverLocation.longitude) / (10 ** parseInt(activeItem.route.deliverLocation.decimals))).toFixed(3)
          },
          nftAddress: activeItem.nftAddress,
          marketplaceAddress: activeItem.marketplaceAddress,
          ledgeriseLensAddress: activeItem.ledgeriseLensAddress
        }

        return callback(null, generalQrData);
      })
    })
  })
}


const ActiveItem = mongoose.model("ActiveItem", activeItemSchema);

module.exports = ActiveItem
