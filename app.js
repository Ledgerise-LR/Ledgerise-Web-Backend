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
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Replace with your Next.js domain
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

function getRandomTokenId(count, previousTokenId) {
  let randomTokenId;
  do {
    randomTokenId = Math.floor(Math.random() * count);
  } while (previousTokenId === randomTokenId);
  console.log(randomTokenId)
  return randomTokenId;
}


app.get("/get-random-featured-nft", (req, res) => {
  let previousItemTokenId = Number(req.query.previousTokenId);
  console.log("prev", req.query.previousTokenId)
  ActiveItem.countDocuments((err, count) => {

    if (err || !count || count == 0) return console.log("No activeItem count.");
    if (count) {
      let randomTokenId = getRandomTokenId(count, previousItemTokenId);
      let randomItem = 0;
      do {
        ActiveItem.findOne({ tokenId: randomTokenId }, (err, activeItem) => {
          randomItem = activeItem;
          if (err) return console.log("Cannot find the random active item.");
          if (!activeItem) {
            randomItem = null;
            let problematicTokenId = randomTokenId;
            do {
              randomTokenId = getRandomTokenId(count, previousItemTokenId);
            } while (problematicTokenId == randomTokenId);
          }
          try {
            subcollection.findOne({ itemId: activeItem.subcollectionId }, (err, collection) => {
              if (err || !collection) return console.log("Couldn't fetch collection.");
              if (collection) {
                let data = {
                  tokenUri: activeItem.tokenUri,
                  tokenId: activeItem.tokenId,
                  totalRaised: collection.totalRaised,
                  collectionName: collection.name,
                  charityAddress: collection.charityAddress,
                  nftAddress: activeItem.nftAddress
                }
                return res.status(200).json({ data: data });
              }
            })
          } catch (e) {
            ;
          }
        })
      } while (randomItem == null);


    }
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


