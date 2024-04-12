const express = require("express");
const http = require("http");
const mongoose = require("mongoose");
require("dotenv").config();
const app = express();
const { getIdFromParams } = require("./utils/getIdFromParams");
const updateAttributes = require("./utils/updateAttributes");
const bodyParser = require('body-parser');
const { connectRealTime } = require("./sockets");
const { receiveImage } = require("./privacy");
const verifyBlockchain = require("./utils/verifyBlockchain");
require("./utils/uploadToPinata");
const networkMapping = require("./constants/networkMapping.json");

const session = require("express-session");

const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

const { handleItemBought, handleItemListed, handleItemCanceled, handleSubcollectionCreated, handleAuctionCreated } = require("./listeners/exportListeners");

const marketplaceAddress = networkMapping["Marketplace"][process.env.ACTIVE_CHAIN_ID];
const nftAddress = networkMapping["MainCollection"][process.env.ACTIVE_CHAIN_ID];

const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nft-fundraising-api";
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', `*`); // Replace with your Next.js domain
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

const activeItemRouter = require("./routers/ActiveItemRouter");
const authRouter = require("./routers/AuthRouter");
const companyRouter = require("./routers/CompanyRouter");
const depotRouter = require("./routers/DepotRouter");
const donateRouter = require("./routers/DonateRouter");
const donorRouter = require("./routers/DonorRouter");
const needRouter = require("./routers/NeedRouter");
const reportsRouter = require("./routers/ReportsRouter");
const subcollectionRouter = require("./routers/SubcollectionRouter");
const tokenUriRouter = require("./routers/TokenUriRouter");

app.use("/active-item", activeItemRouter);
app.use("/tokenuri", tokenUriRouter);
app.use("/auth", authRouter);
app.use("/company", companyRouter);
app.use("/depot", depotRouter);
app.use("/donate", donateRouter);
app.use("/donor", donorRouter);
app.use("/need", needRouter);
app.use("/reports", reportsRouter);
app.use("/subcollection", subcollectionRouter);

server.listen(PORT, async () => {

  setInterval(() => {
    updateAttributes();
  }, 6000000);

  handleItemCanceled();
  handleAuctionCreated();

  connectRealTime(server, nftAddress);
  receiveImage(app);

  console.log("Server is listening on port", PORT);

  setInterval(() => {
    verifyBlockchain();
  }, 60000);
})

