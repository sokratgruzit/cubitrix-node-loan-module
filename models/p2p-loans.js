const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema({
  collateral: { type: Number, required: true },
  borrower: { type: String, required: true },
  status: { type: String, required: true },
  offerDuration: { type: Number, required: true },
  loanId: { type: String, required: true },
});

const p2p_loans = new mongoose.Schema({
  borrower: String,
  lender: String,
  amount: Number,
  interest: Number,
  duration: Number,
  status: String,
  collateral: [],
  allOffers: [OfferSchema],
});

module.exports = {
  p2p_loans: mongoose.models.p2p_loans || mongoose.model("p2p_loans", p2p_loans),
  p2p_loan_offers:
    mongoose.models.p2p_loan_offers || mongoose.model("p2p_loan_offers", OfferSchema),
};
