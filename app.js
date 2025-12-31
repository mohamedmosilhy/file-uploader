require("dotenv").config();

const express = require("express");
const indexRoutes = require("./routes/index");
const app = express();

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.use("/", indexRoutes);

const port = process.env.PORT || 3000;

app.listen(port);
