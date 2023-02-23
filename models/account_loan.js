const mongoose = require("mongoose");

const account_loan = new mongoose.Schema({
  address: String,
});
module.exports =
  mongoose.models.account_loan || mongoose.model("account_loan", account_loan);
