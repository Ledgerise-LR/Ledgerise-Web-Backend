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
const verifyBlockchain = require("./utils/verifyBlockchain");
const formidable = require("formidable");
const { storeImages, storeUriMetadata } = require("./utils/uploadToPinata");
const TokenUri = require("./models/tokenUri");

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

connectRealTime(server);

const { handleItemBought, handleItemListed, handleItemCanceled, handleSubcollectionCreated, handleAuctionCreated } = require("./listeners/exportListeners");
const AuctionItem = require("./models/AuctionItem");
const visualVerification = require("./models/VisualVerification");

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

app.get("/get-asset", (req, res) => {
  ActiveItem.findOne({ tokenId: req.query.tokenId }, (err, activeItem) => {
    res.status(200).json({ activeItem });
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
          nftAddress: activeItems[randomIndex].nftAddress
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

server.listen(PORT, async () => {

  updateAttributes();
  handleItemBought();
  handleItemCanceled();
  handleItemListed();
  handleSubcollectionCreated();

  handleAuctionCreated();

  verifyBlockchain();

  console.log("Server is listening on port", PORT);
})


