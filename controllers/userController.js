const { application } = require("express");
const nodemailer = require("nodemailer");
const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const Brand = require("../models/brandschema");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const env = require("dotenv");
const Coupon=require("../models/couponSchema")
const { v4: uuidv4 } = require("uuid");
env.config();

const pageNotFound = async (req, res) => {
  try {
    res.render("page-404");
  } catch (error) {
    console.log(error.message);
  }
};

// load loginpage

const getLoginPage = async (req, res) => {
  console.log("is login calling");
  try {
    if (!req.session.user) {
      console.log("is login rendering");
      res.render("login");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ isAdmin: "0", email: email });

    console.log("working");

    if (findUser) {
      const isUserNotBlocked = findUser.isBlocked === false;

      if (isUserNotBlocked) {
        const passwordMatch = await bcrypt.compare(password, findUser.password);
        if (passwordMatch) {
          req.session.user = findUser._id;
          console.log("Logged in");
          res.redirect("/");
        } else {
          console.log("Password is not matching");
          res.render("login", { message: "Password is not matching" });
        }
      } else {
        console.log("User is blocked by admin");
        res.render("login", { message: "User is blocked by admin" });
      }
    } else {
      console.log("User is not found");
      res.render("login", { message: "User is not found" });
    }
  } catch (error) {
    console.log(error.message);
    res.render("login", { message: "Login failed" });
  }
};

const getSignupPage = async (req, res) => {
  try {
    if (!req.session.user) {
      res.render("signup");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const signupUser = async (req, res) => {
  try {
    console.log(req.body);
    const { email } = req.body;

    const findUser = await User.findOne({ email });
    if (req.body.password === req.body.cPassword) {
      if (!findUser) {
        var otp = generateOtp();
        const transporter = nodemailer.createTransport({
          service: "gmail",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.NODEMAILER_EMAIL,
            pass: process.env.NODEMAILER_PASSWORD,
          },
        });

        const info = await transporter.sendMail({
          from: process.env.NODEMAILER_EMAIL,
          to: email,
          subject: "Verify Your Account ✔",
          text: `Your OTP is ${otp}`,
          html: `<b>  <h4 >Your OTP  ${otp}</h4>    <br>  <a href="">Click here</a></b>`,
        });
        console.log(otp, "otp");
        if (info) {
          req.session.userOtp = otp;
          req.session.userData = req.body;
          res.render("verify-otp");
          console.log("Email sented", info.messageId);
        } else {
          res.json("email-error");
        }
      } else {
        console.log("User already Exist");
        res.render("signup", {
          message: "User with this email already exists",
        });
      }
    } else {
      console.log("the confirm pass is not matching");
      res.render("signup", { message: "The confirm pass is not matching" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

function generateOtp() {
  const digits = "1234567890";
  var otp = "";
  for (i = 0; i < 6; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
}
// render the OTP verification page

const getOtpPage = async (req, res) => {
  try {
    res.render("verify-otp");
  } catch (error) {
    console.log(error.message);
  }
};
// Verify otp from email with generated otp and save the user data to db

const verifyOtp = async (req, res) => {
  try {

      //get otp from body
      const { otp } = req.body
      if (otp === req.session.userOtp) {
          const user = req.session.userData
          const passwordHash = await securePassword(user.password)
          const referalCode = uuidv4()
          console.log("the referralCode  hain =>" + referalCode);

          const saveUserData = new User({
              name: user.name,
              email: user.email,
              phone: user.phone,
              password: passwordHash,
              referalCode : referalCode
          })

          await saveUserData.save()

          req.session.user = saveUserData._id
          res.redirect("/login")
      } else {

          console.log("otp not matching");
          res.json({ status: false })
      }

  } catch (error) {
      console.log(error.message);
  }
}

//Generate Hashed Password

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    console.log(error.message);
  }
};

//Loading the Home page

const getHomePage = async (req, res) => {
  try {
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    console.log(userData, "userdata");
    const brandData = await Brand.find({ isBlocked: false });
    const productData = await Product.find({ isBlocked: false })
      .sort({ id: -1 })
      .limit(4);

    if (user) {
      res.render("home", {
        user: userData,
        data: brandData,
        products: productData,
      });
    } else {
      res.render("home", { data: brandData, products: productData });
    }
  } catch (error) {
    console.log(error.message);
  }
};

// about page
const aboutPage = async (req, res) => {
  try {
    if (req.session.user) {
      res.render("about");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getShopPage = async (req, res) => {
  try {
    const user = req.session.id;
    const products = await Product.find({ isBlocked: false });
    const count = await Product.find({ isBlocked: false }).count();
    const brands = await Brand.find({ isBlocked: false });
    const categories = await Category.find({ isListed: true });
    const categoriesok = await Category.find(
      { isListed: true },
      { _id: 0, name: 1 }
    );
    const categorynames = categoriesok.map((categoryObject) => {
      return categoryObject.name;
    });
    const newProductArrayCategoryListed = products.filter((singleProduct) => {
      return categorynames.includes(singleProduct.category);
    });
    // console.log(newProductArrayCategoryListed,"newProductArrayCategoryListed");
    res.render("shop", {
      user: user,
      product: newProductArrayCategoryListed,
      category: categories,
      brand: brands,
      count: count,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const getLogoutUser = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log(err.message);
      }
      console.log("Logged out");
      res.redirect("/login");
    });
  } catch (error) {
    console.log(error.message);
  }
};


const applyCoupon = async (req, res) => {
  try {
      const userId = req.session.user
      console.log(req.body,"coupon hain na?");
      const selectedCoupon = await Coupon.findOne({ name: req.body.coupon })
      // console.log(selectedCoupon);
      if (!selectedCoupon) {
          console.log("no coupon");
          res.json({ noCoupon: true })
      } else if (selectedCoupon.userId.includes(userId)) {
          console.log("already used");
          res.json({ used: true })
      } else {
          console.log("coupon exists");
          await Coupon.updateOne(
              { name: req.body.coupon },
              {
                  $addToSet: {
                      userId: userId
                  }
              }
          );
          const gt = parseInt(req.body.total) - parseInt(selectedCoupon.offerPrice);
          console.log(gt, "----");
          res.json({ gt: gt, offerPrice: parseInt(selectedCoupon.offerPrice) })
      }
  } catch (error) {
      console.log(error.message);
  }
}



module.exports = {
  pageNotFound,
  getLoginPage,
  userLogin,
  getSignupPage,
  signupUser,
  getOtpPage,
  verifyOtp,
  securePassword,
  getHomePage,
  aboutPage,
  getShopPage,
  getLogoutUser,
  applyCoupon
};
