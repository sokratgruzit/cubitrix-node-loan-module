const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const router = require("./routes/index");
const cors = require("cors");
const cors_options = require("./config/cors_options");
const credentials = require("./middleware/credentials");

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

app.use("/api", router);

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
