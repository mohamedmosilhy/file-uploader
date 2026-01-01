const express = require("express");
const { body } = require("express-validator");
const { prisma } = require("../lib/prisma");
const {
  index,
  loginPage,
  loginPost,
  signupPage,
  signupPost,
  logout,
  getFolders,
  postFolders,
} = require("../controllers/index");
const { ensureAuthenticated } = require("../middlewares/auth");
const router = express.Router();

router.get("/", ensureAuthenticated, index);
router.get("/login", loginPage);
router.post("/login", loginPost);
router.get("/signup", signupPage);
router.post(
  "/signup",
  [
    body("username")
      .notEmpty()
      .withMessage("Username is required")
      .custom(async (value) => {
        const existingUser = await prisma.user.findUnique({
          where: { username: value },
        });
        if (existingUser) {
          throw new Error("Username already exists");
        }
        return true;
      }),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  signupPost
);

router.get("/logout", logout);
router.get("/folders", getFolders);
router.post("/folders", postFolders);

module.exports = router;
