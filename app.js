const express = require("express");
const session = require("express-session");
const env = require("dotenv");
const path = require("path");
const morgan = require("morgan")
require("./DB/database");
env.config();

const app = express();

// app.use(morgan("dev"))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views/user"),
  path.join(__dirname, "views/admin"),
]);
app.use(express.static(path.join(__dirname, "public")));


app.use(
  session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 72 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);

const userrouter = require("./router/userrouter");
const adminrouter = require("./router/adminrouter");

app.use("/", userrouter);
app.use("/admin", adminrouter);

app.use("/admin/*" , (req,res)=>{
  res.render('error')
})

app.use("/*", function (req, res) {
  res.redirect("/pageNotFound");
});




app.listen(5000, () => {
  console.log("Port has started at 5000");
});
