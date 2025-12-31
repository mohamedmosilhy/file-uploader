const passport = require("../config/passport");
const bcryptjs = require("bcryptjs");
const { prisma } = require("../lib/prisma");
const { body, validationResult } = require("express-validator");

module.exports = {
  index: (req, res) => {
    res.render("index", { pageTitle: "Home" });
  },
  loginPage: (req, res) => {
    res.render("login", { pageTitle: "Login" });
  },
  loginPost: passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/login",
  }),
  signupPage: (req, res) => {
    res.render("signup", { pageTitle: "Signup" });
  },
  signupPost: async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).render("signup", {
          pageTitle: "Signup",
          errors: errors.array(),
        });
      }
      const { username, password } = req.body;
      await prisma.user.create({
        data: {
          username,
          password: await bcryptjs.hash(password, 10),
        },
      });
      res.redirect("/login");
    } catch (error) {
      return next(error);
    }
  },
  logout: (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/login");
    });
  },
};
