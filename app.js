const ethers = require("ethers");
const express = require("express");
const http = require("http");
const abi = require("./constants/abi.json");
const ActiveItem = require("./models/ActiveItem");
const subcollection = require("./models/Subcollection");
const mongoose = require("mongoose");
require("dotenv").config()
const app = express();
const { getIdFromParams } = require("./utils/getIdFromParams")

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

const { handleItemBought, handleItemListed, handleItemCanceled, handleSubcollectionCreated } = require("./listeners/exportListeners");

const mongoUri = "mongodb://127.0.0.1:27017/nft-fundraising-api";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3001'); // Replace with your Next.js domain
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.get("/get-asset", (req, res) => {
  ActiveItem.findOne({ tokenId: req.query.tokenId }, (err, activeItem) => {
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

app.get("/get-random-featured-nft", (req, res) => {
  ActiveItem.countDocuments({}, (err, documentCount) => {
    const previousTokenId = req.query.previousTokenId;
    let randomTokenId = Math.floor(Math.random() * documentCount);
    ActiveItem.findOne({ tokenId: randomTokenId }, (err, randomAsset) => {
      if (err) return console.log("bad_request");
      subcollection.findOne({ itemId: randomAsset.subcollectionId.toString() }, (err, subcollection) => {
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
  })
})

app.get("/sort/price-ascending", (req, res) => {
  ActiveItem.sortPriceAscending(req.query, (err, docs) => {
    if (err) return console.log("bad_request");
    console.log(docs)
    return res.status(200).json({ activeItems: docs });
  })
})

app.get("/sort/price-descending", (req, res) => {
  ActiveItem.sortPriceDescending(req.query, (err, docs) => {
    if (err) return console.log("bad_request");
    console.log(docs)
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

server.listen(PORT, async () => {

  handleItemBought();
  handleItemCanceled();
  handleItemListed();
  handleSubcollectionCreated();
  console.log("Server is listening on port", PORT);
})


