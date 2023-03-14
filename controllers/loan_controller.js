require("dotenv").config();
const models = require("@cubitrix/models");
const { p2p_loans, p2p_loan_offers } = require("../models/p2p-loans");
const mongoose = require("mongoose");

async function test(req, res) {
  try {
    let data = "test";

    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: e });
  }
}

async function loanMarketOffers(req, res) {
  try {
    const loans = await p2p_loans.find({ status: "Offered" });

    res.status(200).send({ result: loans });
  } catch (e) {
    res.status(400).send({ message: "something went wrong" });
  }
}

async function getUserCreatedLoans(req, res) {
  try {
    const lender = req.query.address;
    const loans = await p2p_loans.find({ lender });

    res.status(200).send({ result: loans });
  } catch (e) {
    res.status(400).send({ message: "something went wrong" });
  }
}

async function getUserLoans(req, res) {
  try {
    const borrower = req.query.address;

    const loans = await p2p_loans.find({ borrower });

    res.status(200).send({ result: loans });
  } catch (e) {
    res.status(400).send({ message: "something went wrong" });
  }
}

async function createLoan(req, res) {
  try {
    const { lender, amount, interest, duration } = req.body;

    if (!lender) {
      return res.status(400).send({ message: "lender is required" });
    }

    const result = await p2p_loans.create({
      borrower: "",
      lender,
      amount,
      interest,
      duration,
      status: "Offered",
    });

    res.status(200).send({ message: "new loan created", result });
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
}
async function deleteLoanOffer(req, res) {
  try {
    const { id, lender } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({ message: "Invalid loan ID" });
    }

    const result = await p2p_loans.findOne({ _id: id, lender });

    if (!result) {
      return res.status(400).send({ message: "no such loan offer found" });
    }

    await result.deleteOne();
    res.status(200).send({ message: "laon offer successfully deleted", deletedID: id });
  } catch (e) {
    res.status(400).send({ message: e.message });
  }
}

async function repayLoan(req, res) {
  try {
    const { id, borrower, amount } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({ message: "Invalid loan ID" });
    }

    const loan = await p2p_loans.findOne({ _id: id, borrower });

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.amount < amount) {
      return res.status(400).send({ message: "repay amount is too much" });
    }

    if (loan.status !== "Active") {
      return res.status(400).send({ message: "loan is already closed" });
    }

    if (loan.amount === amount) {
      const repaidLoan = await p2p_loans.findOneAndUpdate(
        { _id: id },
        { status: "Closed", amount: 0 },
        { new: true },
      );
      return res.status(200).send({ message: "loan repaid", result: repaidLoan });
    }

    if (loan.amount > amount) {
      const repaidLoan = await p2p_loans.findOneAndUpdate(
        { _id: id },
        { amount: loan.amount - amount },
        { new: true },
      );

      return res.status(200).send({ message: "loan repaid", result: repaidLoan });
    }
  } catch (e) {
    return res.status(400).send({ message: e });
  }
}

async function defaultLoan(req, res) {
  try {
    const { id, borrower } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({ message: "Invalid loan ID" });
    }

    const loan = await p2p_loans.findOne({ _id: id, borrower });

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.status === "Closed") {
      return res.status(400).send({ message: "loan is already closed" });
    }

    const repaidLoan = await p2p_loans.findOneAndUpdate(
      { _id: id },
      { status: "Defaulted" },
      { new: true },
    );

    return res.status(200).send({ message: "loan defaulted", result: repaidLoan });
  } catch (e) {}
}

async function sendLoanOffer(req, res) {
  try {
    const { id, borrower, collateral, offerDuration } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({ message: "Invalid loan ID" });
    }

    if (JSON.stringify(collateral) === "[]") {
      return res.status(400).send({ message: "collateral is required" });
    }

    if (!borrower) {
      return res.status(400).send({ message: "borrower is required" });
    }

    const loan = await p2p_loans.findOne({ _id: id }).populate("allOffers");

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.status !== "Offered") {
      return res.status(400).send({ message: "loan is not offered" });
    }

    if (loan.lender === borrower) {
      return res.status(400).send({ message: "you can't make offer to yourself" });
    }

    const numPreviousOffers = loan.allOffers.filter(
      (offer) => offer.borrower === borrower,
    ).length;
    if (numPreviousOffers > 2) {
      return res.status(400).send({ message: "you can't make more than 3 offers" });
    }

    const newOffer = new p2p_loan_offers({
      borrower,
      collateral,
      offerDuration,
      status: "active",
      loanId: id,
    });

    await newOffer.save();

    loan.allOffers.push(newOffer);

    const updatedLoan = await loan.save();

    res.status(200).send({ message: "offer is sent to lender", result: updatedLoan });
  } catch (e) {
    console.log(e);
    res.status(400).send({ message: "something went wrong" });
  }
}

async function rescindLoanOffer(req, res) {
  try {
    const { id, borrower, offerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({ message: "Invalid Loan ID" });
    }

    const loan = await p2p_loans.findOne({ _id: id }).populate("allOffers");

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.status !== "Offered") {
      return res.status(400).send({ message: "loan is not offered" });
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(404).send({ message: "Invalid Offer ID" });
    }

    const offer = await p2p_loan_offers.findOne({ _id: offerId });

    if (!offer) {
      return res.status(400).send({ message: "offer not found" });
    }

    if (offer.borrower !== borrower) {
      return res.status(400).send({ message: "you can't rescind other's offer" });
    }

    if (offer.status !== "active") {
      return res.status(400).send({ message: "offer isn't active" });
    }

    const updatedOfferInLoan = await p2p_loans.findOneAndUpdate(
      { _id: id, allOffers: { $elemMatch: { _id: offerId } } },
      { $set: { "allOffers.$.status": "revoked" } },
      { new: true },
    );

    res
      .status(200)
      .send({ message: "successfully rescined offer", data: updatedOfferInLoan });
  } catch (e) {
    console.log(e);
    res.status(400).send({ message: "something went wrong" });
  }
}

async function acceptOffer(req, res) {
  try {
    const { id, offerId, borrower } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({ message: "Invalid Loan ID" });
    }

    const loan = await p2p_loans.findOne({ _id: id }).populate("allOffers");

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.status !== "Offered") {
      return res.status(400).send({ message: "loan is not offered" });
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(404).send({ message: "Invalid Offer ID" });
    }

    if (loan.lender !== borrower) {
      return res.status(400).send({ message: "you can't accept offer for other's loan" });
    }

    const offer = await p2p_loan_offers.findOne({ _id: offerId });

    if (!offer) {
      return res.status(400).send({ message: "offer not found" });
    }

    if (offer.status !== "active") {
      return res.status(400).send({ message: "offer isn't active" });
    }

    const updatedOffer = await p2p_loan_offers.findOneAndUpdate(
      { _id: offerId },
      { status: "Accepted" },
      { new: true },
    );

    await p2p_loans.findOneAndUpdate(
      { _id: id, allOffers: { $elemMatch: { _id: offerId } } },
      {
        borrower,
        collateral: offer.collateral,
        status: "active",
        $set: { "allOffers.$.status": "Accepted" },
      },
      { new: true },
    );

    res.status(200).send({ message: "offer is accepted", data: updatedOffer });
  } catch (e) {
    console.log(e);
    return res.status(400).send({ message: "something went wrong" });
  }
}

async function rejectOffer(req, res) {
  try {
    const { id, offerId, borrower } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).send({ message: "Invalid Loan ID" });
    }

    const loan = await p2p_loans.findOne({ _id: id }).populate("allOffers");

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.status !== "Offered") {
      return res.status(400).send({ message: "loan is not offered" });
    }

    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(404).send({ message: "Invalid Offer ID" });
    }

    if (loan.lender !== borrower) {
      return res.status(400).send({ message: "you can't reject offer for other's loan" });
    }

    const offer = await p2p_loan_offers.findOne({ _id: offerId });

    if (!offer) {
      return res.status(400).send({ message: "offer not found" });
    }

    if (offer.status !== "active") {
      return res.status(400).send({ message: "offer isn't active" });
    }

    const updatedOffer = await p2p_loan_offers.findOneAndUpdate(
      { _id: offerId },
      { status: "Rejected" },
      { new: true },
    );

    await p2p_loans.findOneAndUpdate(
      { _id: id, allOffers: { $elemMatch: { _id: offerId } } },
      { $set: { "allOffers.$.status": "Rejected" } },
      { new: true },
    );

    res.status(200).send({ message: "offer is rejected", data: updatedOffer });
  } catch (e) {
    return res.status(400).send({ message: "something went wrong" });
  }
}

module.exports = {
  test,
  createLoan,
  loanMarketOffers,
  getUserCreatedLoans,
  getUserLoans,
  repayLoan,
  defaultLoan,
  deleteLoanOffer,
  sendLoanOffer,
  rescindLoanOffer,
  acceptOffer,
  rejectOffer,
};
