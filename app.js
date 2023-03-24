const ethers = require("ethers");
const express = require("express");
const http = require("http");
const abi = require("./constants/abi.json");
const ActiveItem = require("./models/ActiveItem");
const subcollection = require("./models/Subcollection");
const mongoose = require("mongoose");
require("dotenv").config()
const app = express();

const server = http.createServer(app);
const PORT = process.env.PORT || 4004;

const { handleItemBought, handleItemListed, handleItemCanceled, handleSubcollectionCreated } = require("./listeners/exportListeners");

const mongoUri = "mongodb://127.0.0.1:27017/nft-fundraising-api";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3004'); // Replace with your Next.js domain
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get("/get-asset", (req, res) => {
  ActiveItem.findOne({ tokenId: req.query.tokenId }, (err, activeItem) => {
    res.status(200).json({ activeItem });
  })
})

app.get("/get-collection", (req, res) => {
  ActiveItem.find({ subcollectionId: req.query.id }, (err, activeItems) => {
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

app.get("/get-random-featured-nft", (req, res) => {
  ActiveItem.countDocuments({}, (err, documentCount) => {
    let randomTokenId = Math.floor(Math.random() * document);
    while (true) {
      if (randomTokenId != req.previousTokenId) {
        ActiveItem.findOne({ tokenId: randomTokenId }, (err, randomAsset) => {
          if (err) return console.log("bad_request");
          subcollection.findOne({ itemId: randomAsset.subcollectionId }, (err, subcollection) => {
            if (err) return console.log("bad_request");
            const data = {
              tokenUri: randomAsset.tokenUri,
              tokenId: randomAsset.tokenId,
              totalRaised: subcollection.totalRaised,
              collectionName: subcollection.name,
              charityAddress: randomAsset.charityAddress
            }
            return res.status(200).json({ data: data });
          })
        })
      }
      randomTokenId = Math.floor(Math.random() * document);
    }
  })
})

server.listen(PORT, async () => {

  handleItemBought();
  handleItemCanceled();
  handleItemListed();
  handleSubcollectionCreated();
  console.log("Server is listening on port", PORT);
})


