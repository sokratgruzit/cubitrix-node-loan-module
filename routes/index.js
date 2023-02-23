const express = require("express");
const router = express();
const loan_controller = require("../controllers/loan_controller");

router.get("/test", loan_controller.test);

module.exports = router;
