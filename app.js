// Load environment variables
require("dotenv").config();

// Core dependencies
const express = require("express");
const session = require("express-session");
const passport = require("./config/passport");
const flash = require("connect-flash");

// Third-party dependencies
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");

// Local dependencies
const { prisma } = require("./lib/prisma.js");
const indexRoutes = require("./routes/index");

// Initialize Express app
const app = express();

// View engine configuration
app.set("view engine", "ejs");
app.set("views", "views");

// Middleware
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Flash messages
app.use(flash());

// Make flash messages available in all views
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

// Routes
app.use("/", indexRoutes);

// Start server
const port = process.env.PORT || 3000;
app.listen(port);
