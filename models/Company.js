
const mongoose = require("mongoose");
const subcollection = require("./Subcollection");
const ActiveItem = require("./ActiveItem");
const async = require("async");
const TokenUri = require("./tokenUri");

const companySchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    trim: true
  },

  image: {
    type: String,
    required: false
  },

  charityAddress: {
    type: String,
    required: true,
    trim: true
  },

  IBAN: {
    type: String,
    default: "TR"
  },

  receipientName: {
    type: String,
    default: ""
  },

  receipientDescription: {
    type: String,
    default: ""
  },

  bankName: {
    type: String,
    default: ""
  }

});

companySchema.statics.createNewCompany = function (body, callback) {
  const newCompany = new Company(body);
  if (newCompany) {
    newCompany.save();
    return callback(null, newCompany);
  }
  return callback("bad_request");
}

companySchema.statics.loginVerifier = function (body, callback) {
  Company.findOne({ code: body.code, password: body.password }, (err, company) => {
    if (err || !company) return callback("verify_error");
    return callback(null, company);
  })
}

companySchema.statics.authenticateVerifier = function (body, callback) {
  Company.findOne({ code: body.code }, (err, company) => {
    if (err || !company) return callback("auth_error");
    if (company) return callback(null, company);
  })
}

companySchema.statics.getAllItems = function (body, callback) {

  let activeItemArray = [];

  Company.findOne({ code: body.code }, (err, company) => {
    if (err || !company) return callback("auth_error");

    subcollection.findOne({ companyCode: company.code }, (err, m_subcollection) => {
      if (err || !company) return callback("collection_error");

      ActiveItem.find({ subcollectionId: m_subcollection.itemId, nftAddress: m_subcollection.nftAddress }, (err, activeItems) => {
        if (err || !company) return callback("item_error");

        async.timesSeries(activeItems.length, (i, next) => {
          const eachActiveItem = activeItems[i];

          const activeItemObject = {
            tokenUri: eachActiveItem.tokenUri,
            seller: eachActiveItem.seller, 
            history: eachActiveItem.history, 
            availableEditions: eachActiveItem.availableEditions, 
            price: eachActiveItem.price,
            collectionName: m_subcollection.name,
            subcollectionId: m_subcollection.itemId
          };
        
          activeItemArray.push(activeItemObject);
          next();
        }, (err) => {
          if (err || !company) return callback("auth_error");

          return callback(null, activeItemArray);
        })
      })
    })
  })
}

companySchema.statics.getAllCollectionsOfCompany = async function (body, callback) {

  subcollection.find({ companyCode: body.code }, (err, subcollections) => {

    let resArray = [];

    async.timesSeries(subcollections.length, (i, next) => {
      const eachSubcollection = subcollections[i];

      Company.findOne({ code: eachSubcollection.companyCode }, (err, company) => {
        if (err || !company) return callback(err);

        const data = {
          itemId: eachSubcollection.itemId,
          name: eachSubcollection.name,
          image: eachSubcollection.image,
          nftAddress: eachSubcollection.nftAddress,
          totalRaised: eachSubcollection.totalRaised,
          charityAddress: company.charityAddress,
          charityName: company.name,
          companyImage: company.image,
        }

        resArray.push(data);

        next();
      })
    }, (err) => {
      if (err) return callback(err);
      callback(null, resArray);
    })
  })
}

companySchema.statics.getAllCollections = async function (body, callback) {
  subcollection.find({}, (err, subcollections) => {

    let resArray = [];

    async.timesSeries(subcollections.length, (i, next) => {
      const eachSubcollection = subcollections[i];

      Company.findOne({ code: eachSubcollection.companyCode }, (err, company) => {
        if (err || !company) return res.json({ success: false, err: err });

        const data = {
          itemId: eachSubcollection.itemId,
          name: eachSubcollection.name,
          image: eachSubcollection.image,
          totalRaised: eachSubcollection.totalRaised,
          nftAddress: eachSubcollection.nftAddress,
          description: eachSubcollection.description,
          charityAddress: company.charityAddress,
          charityName: company.name,
          companyImage: company.image,
          companyCode: company.code
        }

        resArray.push(data);

        next();
      })
    }, (err) => {
      if (err) return callback(err);
      return callback(null, resArray);
    })
  })
}

const normalizeRouteData = (activeItem) => {

  if (activeItem.route.stampLocation && activeItem.route.shipLocation && activeItem.route.deliverLocation) {
    return {
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
    }
  } else {
    let template = {
      stampLocation: {
        latitude: "",
        longitude: "",
      },
      shipLocation: {
        latitude: "",
        longitude: "",
      },
      deliverLocation: {
        latitude: "",
        longitude: "",
      },
    };
    for (let i = 0; i < activeItem.route.length; i++) {
      const temp = activeItem.route[i];
      let latitude = (parseInt(temp[0]._hex) / (10 ** parseInt(temp[2]._hex))).toFixed(3);
      let longitude = (parseInt(temp[1]._hex) / (10 ** parseInt(temp[2]._hex))).toFixed(3);

      const tempObject = {
        latitude: latitude,
        longitude: longitude
      };

      i == 0 ? template.stampLocation = tempObject : i == 1 ? template.shipLocation = tempObject : i == 2 ? template.deliverLocation = tempObject : "";
    }

    return template;
  }
}

companySchema.statics.getCompanyPanelData = function (body, callback) {
  const code = body.code;

  let panelData = [];

  subcollection.find({ companyCode: code }, (err, subcollections) => {
    if (err) return callback("bad_request");

    async.timesSeries(subcollections.length, (i, next1) => {
      const collectionObject = { nftAddress: "", subcollectionId: "", name: "", assets: []};
      const eachSubcollection = subcollections[i];

      collectionObject.name = eachSubcollection.name;
      collectionObject.subcollectionId = eachSubcollection.itemId;
      collectionObject.marketplaceAddress = eachSubcollection.marketplaceAddress;
      collectionObject.ledgeriseLensAddress = eachSubcollection.ledgeriseLensAddress;
      collectionObject.nftAddress = eachSubcollection.nftAddress;

      ActiveItem.find({ nftAddress: eachSubcollection.nftAddress, subcollectionId: eachSubcollection.itemId }, (err, activeItems) => {
        if (err) return callback("bad_request");

        async.timesSeries(activeItems.length, (j, next2) => {
          const eachActiveItem = activeItems[j];
        
          const activeItemObject = {
            name: "",
            nftAddress: eachActiveItem.nftAddress,
            tokenId: eachActiveItem.tokenId,
            tokenUri: eachActiveItem.tokenUri,
            qrCodesArray: [],
            price: eachActiveItem.price,
            availableEditions: eachActiveItem.availableEditions,
            stampLocation: normalizeRouteData(eachActiveItem).stampLocation,
            shipLocation: normalizeRouteData(eachActiveItem).shipLocation,
            deliverLocation: normalizeRouteData(eachActiveItem).deliverLocation,
            openseaTokenIdToIsPrintedMapping: {},
            isCanceled: eachActiveItem.isCanceled,
            attributes: eachActiveItem.attributes
          }

          TokenUri.findOne({ tokenUri: eachActiveItem.tokenUri }, (err, tokenUriObject) => {
            if (err) return callback("bad_request");

            activeItemObject.name = tokenUriObject.name;
            const tokenNameArray = tokenUriObject.name.split("/");
            
            if (parseInt(tokenNameArray[0].split("(")[1]) == 1 &&
              typeof parseInt(tokenNameArray[1].split(")")[0]) == "number") {
            
              const numberOfCollaborators = parseInt(tokenNameArray[1].split(")")[0]);

              const collaboratorClustersArray = [[]];
              async.timesSeries(eachActiveItem.history.length, (i, next3) => {
                const openseaTokenId = eachActiveItem.history[i].openseaTokenId;
                
                activeItemObject.openseaTokenIdToIsPrintedMapping[openseaTokenId] = eachActiveItem.history[i].isQrCodePrinted;

                let isAdded = false;

                async.timesSeries(collaboratorClustersArray.length, (j, next4) => {
                  const eachCollaboratorSet = collaboratorClustersArray[j];

                  if (!eachCollaboratorSet.includes(openseaTokenId) && eachCollaboratorSet.length < numberOfCollaborators) {
                    eachCollaboratorSet.push(openseaTokenId);
                    isAdded = true;
                    next3();
                  }
                  next4();
                }, (err) => {
                  const tempArr = []
                  tempArr.push(openseaTokenId);
                  if (!isAdded) collaboratorClustersArray.push(tempArr);
                })
              }, (err) => {
                activeItemObject.qrCodesArray = collaboratorClustersArray;

                collectionObject.assets.push(activeItemObject);
                next2();      
              })

            } else {

              const tempQrCodesArray = [];

              async.timesSeries(eachActiveItem.history.length, (i, next5) => {
                const openseaTokenId = eachActiveItem.history[i].openseaTokenId;

                activeItemObject.openseaTokenIdToIsPrintedMapping[openseaTokenId] = eachActiveItem.history[i].isQrCodePrinted;
                tempQrCodesArray.push(openseaTokenId);
                next5();
              }, (err) => {
                activeItemObject.qrCodesArray = tempQrCodesArray;

                collectionObject.assets.push(activeItemObject);
                next2();
              })
            }
          })

        }, (err) => {
          if (err) return callback("bad_request");
          panelData.push(collectionObject);
          next1();
        })
      })
    }, (err) => {
      if (err) return callback("bad_request");
      return callback(null, panelData);
    })
  })
}


companySchema.statics.getStatistics = function (body, callback) {

  subcollection.find({ companyCode: body.code }, (err, collections) => {
    if (err) return callback("collection_not_found");

    const collectionCount = collections.length;
    let activeItemsCount = 0;
    let donationCount = 0;
    let verificationCount = 0;

    async.timesSeries(collectionCount, (i, next1) => {
      const eachCollection = collections[i];

      ActiveItem.find({ nftAddress: eachCollection.nftAddress, subcollectionId: eachCollection.itemId }, (err, activeItems) => {
        if (err) return callback("active_items_not_found");

        activeItemsCount += activeItems.length;
        async.timesSeries(activeItems.length, (j, next2) => {
          const eachActiveItem = activeItems[j];
          donationCount += eachActiveItem.history.filter(obj => obj.key === 'buy').length;
          verificationCount += eachActiveItem.real_item_history.length;
          next2();
        }, (err) => {
          if (err) return callback("bad_request");
          next1();
        })
      })
    }, (err) => {
      if (err) return callback("bad_request");
      return callback(null, {
        collectionCount,
        activeItemsCount,
        donationCount,
        verificationCount
      });
    })
  })
}


const Company = mongoose.model("company", companySchema);

module.exports = Company


