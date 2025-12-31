const express = require("express");
const { index, login, signup } = require("../controllers/index");
const router = express.Router();

router.get("/", index);
router.get("/login", login);
router.get("/signup", signup);

module.exports = router;
