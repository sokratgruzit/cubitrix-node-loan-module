const express = require("express");
const router = express();
const loan_controller = require("../controllers/loan_controller");

router.get("/test", loan_controller.test);

router.get("/loan--market-offers", loan_controller.loanMarketOffers);
router.get("/user-created-loans/:lender", loan_controller.getUserCreatedLoans);
router.get("/user-loans/:borrower", loan_controller.getUserLoans);

router.post("/create-loan", loan_controller.createLoan);
router.post("/delete-loan-offer", loan_controller.deleteLoanOffer);

router.post("/take-loan", loan_controller.takeLoan);
router.post("/repay-loan", loan_controller.repayLoan);
router.post("/default-loan", loan_controller.defaultLoan);

module.exports = router;
