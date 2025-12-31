module.exports = {
  index: (req, res) => {
    res.render("index", { pageTitle: "Home" });
  },
  login: (req, res) => {
    res.render("login", { pageTitle: "Login" });
  },
  signup: (req, res) => {
    res.render("signup", { pageTitle: "Signup" });
  },
};
