const ethers = require("ethers");
const express = require("express");
const http = require("http");
const abi = require("./constants/abi.json");
const ActiveItem = require("./models/ActiveItem");
const subcollection = require("./models/Subcollection");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const { getIdFromParams } = require("./utils/getIdFromParams");
const updateAttributes = require("./utils/updateAttributes");
const bodyParser = require('body-parser');
const { connectRealTime } = require("./sockets");
const { receiveImage } = require("./privacy");
const verifyBlockchain = require("./utils/verifyBlockchain");
const formidable = require("formidable");
const { storeImages, storeUriMetadata } = require("./utils/uploadToPinata");
const TokenUri = require("./models/tokenUri");
const async = require("async");
const networkMapping = require("./constants/networkMapping.json");
const { AES, enc } = require("crypto-js");

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

const { handleItemBought, handleItemListed, handleItemCanceled, handleSubcollectionCreated, handleAuctionCreated } = require("./listeners/exportListeners");
const AuctionItem = require("./models/AuctionItem");
const visualVerification = require("./models/VisualVerification");
const Report = require("./models/Report");
const Donor = require("./models/Donor");
const Company = require("./models/Company");

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];
const nftAddress = networkMapping["MainCollection"][process.env.ACTIVE_CHAIN_ID];
const provider = new ethers.providers.JsonRpcProvider(process.env.URL);
const marketplace = new ethers.Contract(marketplaceAddress, abi, provider);
const donateFiatToken = process.env.DONATE_FIAT_TOKEN;
const donateFiatTokenAesHashKey = process.env.DONATE_FIAT_TOKEN_HASH_SECRET_KEY;
const authenticationKey = process.env.AUTHENTICATION_KEY;

const mongoUri = "mongodb://127.0.0.1:27017/nft-fundraising-api";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Replace with your Next.js domain
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

function checkForBuyerPresence(buyerAddress, eachCollaboratorSet) {
  let flag = 1;
  eachCollaboratorSet.forEach(eachCollaborator => {
    if (eachCollaborator.split("_")[1] == buyerAddress) {
      flag = 0;
    }
  })

  return flag;
}

app.get("/get-asset", (req, res) => {
  ActiveItem.findOne({ tokenId: req.query.tokenId }, (err, activeItem) => {
    const groupedObjects = {};

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
            collaboratorClustersSet.push(eachCollaboratorSet);

            async.timesSeries(collaboratorClustersSet.length, (k, nextK) => {
              const eachCollaboratorSet = collaboratorClustersSet[k];
              if (eachCollaboratorSet.length == numberOfCollaborators) {
                return nextK();
              } else {
                async.timesSeries(priorityList.length, (l, nextL) => {
                  let flagL = checkForBuyerPresence(priorityList[l].split("_")[1], eachCollaboratorSet);
                  if (eachCollaboratorSet.length == numberOfCollaborators) return nextK();
                  else if (flagL) {
                    eachCollaboratorSet.push(priorityList[l]);
                    priorityList.splice(l, 1);
                    return nextL();
                  } else {
                    return nextL();
                  }
                }, (err) => {
                  nextK();
                })
              }
            }, (err) => {
              // console.log(collaboratorClustersSet);
              // console.log(priorityList)
              if (priorityList.length) {
                async.timesSeries(priorityList.length, (m, nextM) => {
                  const arr = [priorityList[m]];
                  collaboratorClustersSet.push(arr);
                  nextM();
                }, (err) => {
                  return res.status(200).json({
                    activeItem: {
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
                      collaborators: collaboratorClustersSet
                    }
                  });
                })
              } else {
                return res.status(200).json({
                  activeItem: {
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
                    collaborators: collaboratorClustersSet
                  }
                });
              }
            })
          })
        } else {
          return res.status(200).json({
            activeItem: {
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
              collaborators: []
            }
          });
        }
      })
    })
  })
})

app.get("/get-auction", (req, res) => {
  AuctionItem.findOne({ tokenId: req.query.tokenId }, (err, activeItem) => {
    res.status(200).json({ activeItem });
  })
})

app.get("/get-collection", (req, res) => {
  ActiveItem.sortDefault(req.query, (err, activeItems) => {
    res.status(200).json({ activeItems: activeItems });
  })
})

app.get("/get-all-collections", (req, res) => {
  subcollection.find({}, (err, subcollections) => {
    res.status(200).json({ subcollections: subcollections });
  })
})

app.get("/get-single-collection", (req, res) => {
  subcollection.findOne({ itemId: req.query.id }, (err, subcollection) => {
    res.status(200).json({ subcollection: subcollection });
  })
})

let randomIndexPrev = 0;
app.get("/get-random-featured-nft", (req, res) => {
  ActiveItem.find({}, (err, activeItems) => {
    if (err) return console.log("bad_request");
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * activeItems.length);
    } while (randomIndex == randomIndexPrev);
    if (activeItems.length <= 0) {
      return res.json({ data: {} });
    }
    subcollection.findOne({ itemId: activeItems[randomIndex].subcollectionId }, (err, collection) => {
      randomIndexPrev = randomIndex;
      return res.json({
        data: asset = {
          tokenId: activeItems[randomIndex].tokenId,
          tokenUri: activeItems[randomIndex].tokenUri,
          totalRaised: collection.totalRaised,
          collectionName: collection.collectionName,
          charityAddress: collection.charityAddress,
          nftAddress: activeItems[randomIndex].nftAddress,
          totalDonated: activeItems[randomIndex].history.filter(historyEvent => historyEvent.key == "buy").length
        }
      });
    })

  })
})

app.get("/sort/price-ascending", (req, res) => {
  ActiveItem.sortPriceAscending(req.query, (err, docs) => {
    if (err) return console.log("bad_request");
    return res.status(200).json({ activeItems: docs });
  })
})

app.get("/sort/price-descending", (req, res) => {
  ActiveItem.sortPriceDescending(req.query, (err, docs) => {
    if (err) return console.log("bad_request");
    return res.status(200).json({ activeItems: docs });
  })
})

app.get("/sort/oldest", (req, res) => {
  ActiveItem.sortOldest(req.query, (err, docs) => {
    if (err) return console.log("bad_request");
    return res.status(200).json({ activeItems: docs });
  })
})

app.get("/sort/newest", (req, res) => {
  ActiveItem.sortNewest(req.query, (err, docs) => {
    if (err) return console.log("bad_request");
    return res.status(200).json({ activeItems: docs });
  })
})

app.get("/get-all-items-collection", (req, res) => {
  ActiveItem.find({ subcollectionId: req.query.subcollectionId }, (err, docs) => {
    if (err) return console.log("bad_request");
    return res.status(200).json({ activeItems: docs });
  })
})


app.get("/get-all-auction-items", (req, res) => {
  AuctionItem.find({}, (err, auctionItems) => {
    if (err) return console.log("bad_request");
    if (auctionItems) return res.status(200).json({ auctionItems })
  })
})

app.post("/save-real-item-history", (req, res) => {
  ActiveItem.saveRealItemHistory(req.body.data, (err, activeItem) => {
    if (err) return res.status(200).json({ err: "QR code doesn't met requirements." });
    return res.status(200).json({ activeItem });
  });
})

app.get("/get-all-active-items", (req, res) => {
  ActiveItem.find({}, (err, activeItems) => {
    if (err) return res.status(200).json({ err: "bad_request" });
    return res.status(200).json({ activeItems });
  })
})

app.get("/admin/pinata/tokenuri", (req, res) => {
  TokenUri.find({}, (err, tokenUris) => {
    if (err) return res.status(200).json({ success: false, data: "bad_request" });
    return res.status(200).json({ success: true, data: tokenUris });
  })
})

app.post("/admin/pinata/upload", (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Error uploading file' });
    }

    const imageData = fields.image[0];
    const imageName = fields.name[0];
    const description = fields.description[0];
    const attributesString = fields.attributes[0];

    const metadataTemplate = {
      "name": imageName,
      "description": description,
      "image": "",
      "attributes": []
    }

    for (let i = 0; i < attributesString.split(",").length; i++) {
      const array = attributesString.split(",");
      const key = array[i].split(":")[0];
      const value = parseInt(array[i].split(":")[1]);

      const tempAttributeObject = {
        trait_type: key,
        value: value
      };

      metadataTemplate["attributes"].push(
        tempAttributeObject
      );
    }

    const tokenUris = [];

    const body = {
      name: imageName,
      data: imageData.split(",")[1]
    }

    const { responses: imageUploadResponses } = await storeImages(body);

    for (const imageUploadResponsesIndex in imageUploadResponses) {
      // create metadata
      // uploadMetadata
      let tokenUriMetadata = { ...metadataTemplate };
      tokenUriMetadata["image"] = `ipfs://${imageUploadResponses[imageUploadResponsesIndex].IpfsHash}`;
      console.log(`Uploading ${tokenUriMetadata.name}`);

      const metaDataUploadResponse = await storeUriMetadata(tokenUriMetadata);
      tokenUris.push(`ipfs://${metaDataUploadResponse.IpfsHash}`);
    }

    TokenUri.addNewTokenUri({ name: imageName, tokenUri: tokenUris[0] }, (err, newTokenUri) => {
      if (err) return res.status(200).json({ success: false, data: "bad_request" });
      return res.status(200).json({ success: true, data: newTokenUri });
    })

  });

})

app.get("/get-all-visual-verifications", (req, res) => {
  visualVerification.find({}, (err, visualVerifications) => {
    if (err) return res.status(400).send(err);

    if (visualVerifications.length) return res.status(200).json({ data: visualVerifications });
  })
})


app.post("/donate/payment/usd", async (req, res) => {

  req.body.donateFiatToken = AES.decrypt(req.body.donateFiatToken, donateFiatTokenAesHashKey);
  req.body.cardOwner = AES.decrypt(req.body.cardOwner, donateFiatTokenAesHashKey);
  req.body.PAN = AES.decrypt(req.body.PAN, donateFiatTokenAesHashKey);
  req.body.expiryMonth = AES.decrypt(req.body.expiryMonth, donateFiatTokenAesHashKey);
  req.body.expiryYear = AES.decrypt(req.body.expiryYear, donateFiatTokenAesHashKey);
  req.body.CVV = AES.decrypt(req.body.CVV, donateFiatTokenAesHashKey);

  // send transaction through papara

  // when success run below

  if (req.body.donateFiatToken == donateFiatToken) {
    if (typeof req.body.tokenId == "number" && req.body.charityAddress.split("x")[0] == "0" && req.body.fiatAmount > 0) {
      const buyWithFiatTx = await marketplace.buyItemWithFiatCurrency(
        nftAddress,
        req.body.tokenId,
        req.body.charityAddress,
        req.body.tokenUri,
        req.body.priceFeed,
        req.body.fiatAmount,
        `0x${req.body.buyerTelephoneNumber}`
      );

      const buyWithFiatTxReceipt = await buyWithFiatTx.wait(1);

      const eventRes = buyWithFiatTxReceipt.events[2].args;

      if (eventRes) return res.status(200).json({ success: true, data: eventRes });
      return res.status(400).json({ err: "item_not_emitted" });
    }
  } else {
    res.status(400).json({ err: "bad_request" });
  }
})


app.get("/reports/get-past", (req, res) => {
  Report.find({ reporter: req.query.reporter }, (err, reports) => {
    if (err) return res.status(400).json({ err: "bad_request" });
    return res.status(200).json({ success: true, data: reports });
  })
})


app.post("/auth/login", (req, res) => {
  Donor.loginDonor(req.body, (err, donor) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, donor: donor });
  })
})

app.post("/auth/authenticate", (req, res) => {
  const id = req.body._id

  Donor.findById(id, (err, donor) => {
    if (err || !donor) return res.json({ success: false, err: "authentication_failed" });
    if (!err || donor) return res.status(200).json({ success: true, username: donor.email.split("@")[0] });
  })
})

app.post("/auth/register", (req, res) => {
  Donor.createNewDonor(req.body, (err, donor) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, donor: donor });
  })
})

app.post("/auth/login-verifier", (req, res) => {
  Company.loginVerifier(req.body, (err, company) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, company: company });
  })
})


app.post("/auth/authenticate-verifier", (req, res) => {
  Company.authenticateVerifier(req.body, (err, company) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(200).json({ success: true, company: company });
  })
})

app.post("/auth/company/create", (req, res) => {
  Company.createNewCompany(req.body, (err, company) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(201).json({ success: true, company: company });
  })
})

app.get("/company/get-all", (req, res) => {
  Company.find({}, (err, companyArray) => {
    if (err) return res.json({ success: false, err: err });
    return res.status(201).json({ success: true, companies: companyArray });
  })
})


server.listen(PORT, async () => {

  // updateAttributes();
  handleItemBought();
  handleItemCanceled();
  handleItemListed();
  handleSubcollectionCreated();

  handleAuctionCreated();

  verifyBlockchain();

  connectRealTime(server);
  receiveImage(app);

  console.log("Server is listening on port", PORT);
})


