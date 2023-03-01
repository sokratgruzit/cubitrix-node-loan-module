const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const router = require("./routes/index");
const cors = require("cors");
const cors_options = require("./config/cors_options");
const credentials = require("./middleware/credentials");
// const Compound = require("@compound-finance/compound-js"); // in Node.js

require("dotenv").config();

process.env["NODE_CONFIG_DIR"] = __dirname + "/config";

const app = express();
app.use(express.json({ extended: true }));
app.use(credentials);
app.use(cors(cors_options));
app.use(
  bodyParser.urlencoded({
    extended: true,
  }),
);

// const cUsdtAddress = Compound.util.getAddress(Compound.cUSDT);

// (async function () {
//   let supplyRatePerBlock = await Compound.eth.read(
//     cUsdtAddress,
//     "function supplyRatePerBlock() returns (uint)",
//     [], // [optional] parameters
//     {}, // [optional] call options, provider, network, ethers.js "overrides"
//   );

//   console.log("USDT supplyRatePerBlock:", supplyRatePerBlock.toString());
// })().catch(console.error);

// console.log(Compound, cUsdtAddress);

app.use("/api/loan", router);

//static path
const root = require("path").join(__dirname, "front", "build");
app.use(express.static(root));

async function start() {
  const PORT = process.env.PORT || 5000;
  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(process.env.MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    app.listen(PORT, () => console.log(`App has been started on port ${PORT}...`));
  } catch (e) {
    console.log(`Server Error ${e.message}`);
    process.exit(1);
  }
}

start();
