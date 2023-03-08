const mongoose = require("mongoose");

const p2p_loans = new mongoose.Schema({
  borrower: String,
  lender: String,
  amount: Number,
  interest: Number,
  duration: Number,
  status: String,
  collateral: [],
  allOffers: [],
});

module.exports = mongoose.models.p2p_loans || mongoose.model("p2p_loans", p2p_loans);
