require("dotenv").config();
const models = require("@cubitrix/models");
const account_loan = require("../models/account_loan");
const p2p_loans = require("../models/p2p-loans");

async function test(req, res) {
  try {
    let data = "Goga shitty programmer";

    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ message: e });
  }
}

async function getLoans(req, res) {
  try {
    const loans = await p2p_loans.find();

    res.status(200).send(loans);
  } catch (e) {
    res.status(400).send({ message: "something went wrong" });
  }
}

async function createLoan(req, res) {
  try {
    const { lender, amount, interest, duration, collateral } = req.body;

    await p2p_loans.create({
      borrower: "",
      lender,
      amount,
      interest,
      duration,
      status: "Offered",
      collateral,
    });

    res.status(200).send("new loan created");
  } catch (error) {
    console.error(error.message);
    res.status(500).send("Internal server error");
  }
}

async function takeLoan(req, res) {
  try {
    const { id, borrower, collateral } = req.body;

    if (JSON.stringify(collateral) === "[]") {
      return res.status(400).send({ message: "collateral is required" });
    }

    const loan = await p2p_loans.findOne({ _id: id });

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.status !== "Offered") {
      return res.status(400).send({ message: "loan is not offered" });
    }

    const updateLoan = await p2p_loans.findOneAndUpdate(
      {
        _id: id,
      },
      { borrower, collateral, status: "Active" },
      { new: true },
    );

    res.status(200).send({ message: "offer is sent to lender", result: updateLoan });
  } catch (e) {
    console.log(e);
    return res.status(400).send({ message: e });
  }
}

async function repayLoan(req, res) {
  try {
    const { id, borrower, repayAmount } = req.body;

    const loan = await p2p_loans.findOne({ _id: id });

    if (!loan) {
      return res.status(400).send({ message: "loan not found" });
    }

    if (loan.amount < repayAmount) {
      return res.status(400).send({ message: "repay amount is too much" });
    }

    if (loan.status !== "Active") {
      return res.status(400).send({ message: "loan is already closed" });
    }

    if (loan.amount === repayAmount) {
      const repaidLoan = await p2p_loans.findOneAndUpdate(
        { _id: id },
        { status: "Closed", amount: 0 },
        { new: true },
      );
      return res.status(200).send({ message: "loan repaid", result: repaidLoan });
    }

    if (loan.amount > repayAmount) {
      const repaidLoan = await p2p_loans.findOneAndUpdate(
        { _id: id },
        { amount: loan.amount - repayAmount },
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

    const loan = await p2p_loans.findOne({ _id: id });

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

module.exports = {
  test,
  createLoan,
  getLoans,
  takeLoan,
  repayLoan,
  defaultLoan,
};
