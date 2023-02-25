const express = require("express");
const router = express();
const loan_controller = require("../controllers/loan_controller");

router.get("/loans", loan_controller.getLoans);
router.post("/create-loan", loan_controller.createLoan);
router.post("/take-loan", loan_controller.takeLoan);
router.post("/repay-loan", loan_controller.repayLoan);
router.post("/default-loan", loan_controller.repayLoan);

module.exports = router;
