const { application } = require("express");
const nodemailer = require("nodemailer");
const User = require("../models/userSchema");
const bcrypt = require("bcryptjs");
const Brand = require("../models/brandSchema");
const Product = require("../models/productSchema");
const Category = require("../models/categorySchema");
const env = require("dotenv");
const Coupon=require("../models/couponSchema")
const Banner = require("../models/bannerSchema")
const { v4: uuidv4 } = require("uuid");
env.config();

const pageNotFound = async (req, res) => {
    res.render("page-404"); 
};

// load login page

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
    res.redirect("/pageNotFound");
  }
};

const   userLogin = async (req, res) => {
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
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
  }
}

//Generate Hashed Password

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

//Loading the Home page

const getHomePage = async (req, res) => {
  try {
    const today = new Date().toISOString();
    const user = req.session.user;
    const userData = await User.findOne({ _id: user });
    console.log(userData, "userdata");
    const findBanner = await Banner.find({
      startDate: { $lt: new Date(today) },
      endDate: { $gt: new Date(today) }
  });
    const brandData = await Brand.find({ isBlocked: false });
    const productData = await Product.find({ isBlocked: false })
      .sort({ id: -1 })
      .limit(4);

      if (user) {
        res.render("home", {
          user: userData,
          data: brandData,
          products: productData,
          banner: findBanner || [] // Ensure banner is always an array
        });
      } else {
        res.render("home", { data: brandData, products: productData, banner: findBanner || []});
      }
      
  } catch (error) {
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
  }
};

const getShopPage = async (req, res) => {
  try {
    const user = req.session.id;
    const products = await Product.find({ isBlocked: false });
    const count = await Product.find({ isBlocked: false }).count();
    const brands = await Brand.find({ isBlocked: false });
    const categories = await Category.find({ isListed: true });
    const categoriesWithIds = await Category.find(
      { isListed: true },
      { _id: 1, name: 1 }
    );

    // Create an array of category IDs
    const categoryIds = categoriesWithIds.map(category => category._id.toString());

    // Filter products based on category ID
    const newProductArrayCategoryListed = products.filter((singleProduct) => {
      return categoryIds.includes(singleProduct.category.toString());
    });

    res.render("shop", {
      user: user,
      product: newProductArrayCategoryListed,
      category: categoriesWithIds, // Passing category names and IDs
      brand: brands,
      count: count,
    });
  } catch (error) {
    res.redirect("/pageNotFound");
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
    res.redirect("/pageNotFound");
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
      res.redirect("/pageNotFound");
  }
}
const searchProducts = async (req, res) => {
  try {
      const user = req.session.user
      let search = req.body.query
      console.log(search,"search");
      const brands = await Brand.find({})
      const categories = await Category.find({ isListed: true })
      const count = await Product.find({ isBlocked: false }).count();

      const searchResult = await Product.find({
          $or: [
              {
                  productName: { $regex: ".*" + search + ".*", $options: "i" },
              }
          ],
          isBlocked: false,
      }).lean()

      let itemsPerPage = 6
      let currentPage = parseInt(req.query.page) || 1
      let startIndex = (currentPage - 1) * itemsPerPage
      let endIndex = startIndex + itemsPerPage
      let totalPages = Math.ceil(searchResult.length / 6)
      const currentProduct = searchResult.slice(startIndex, endIndex)


      res.render("shop",
          {
              user: user,
              product: currentProduct,
              category: categories,
              brand: brands,
              totalPages,
              currentPage,
              count:count
          })

  } catch (error) {
      res.redirect("/pageNotFound");
  }
}



const filterProduct = async (req, res) => {
  try {
      const user = req.session.user;
      const category = req.query.category;
      const brand = req.query.brand;
      const brands = await Brand.find({});
      const findCategory = category ? await Category.findOne({ _id: category }) : null;
      const findBrand = brand ? await Brand.findOne({ _id: brand }) : null;

      const query = {
          isBlocked: false,
      };

      if (findCategory) {
          query.category = findCategory._id;
      }

      if (findBrand) {
          query.brand = findBrand.brandName;
      }

      const findProducts = await Product.find(query);
      const categories = await Category.find({ isListed: true });

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(findProducts.length / 6);
      const currentProduct = findProducts.slice(startIndex, endIndex);

      res.render("shop", {
          user: user,
          product: currentProduct,
          category: categories,
          brand: brands,
          totalPages,
          currentPage,
          selectedCategory: category || null,
          selectedBrand: brand || null,
      });

  } catch (error) {
    console.log(error)
      res.redirect("/pageNotFound");
      //res.status(500).send("Internal Server Error");
  }
};



const filterByPrice = async (req, res) => {
  try {
      const user = req.session.user
      const brands = await Brand.find({});
      const categories = await Category.find({ isListed: true });
      console.log(req.query);
      const findProducts = await Product.find({
          $and: [
              { salePrice: { $gt: req.query.gt } },
              { salePrice: { $lt: req.query.lt } },
              { isBlocked: false }
          ]
      })

      let itemsPerPage = 6;
      let currentPage = parseInt(req.query.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let totalPages = Math.ceil(findProducts.length / 6);
      const currentProduct = findProducts.slice(startIndex, endIndex);


      res.render("shop", {
          user: user,
          product: currentProduct,
          category: categories,
          brand: brands,
          totalPages,
          currentPage,
      });


  } catch (error) {
      res.redirect("/pageNotFound");
  }
}
const getSortProducts = async (req, res) => {
  console.log("Herrer" , req.body);
  try {
      let option = req.body.option;
      let itemsPerPage = 6;
      let currentPage = parseInt(req.body.page) || 1;
      let startIndex = (currentPage - 1) * itemsPerPage;
      let endIndex = startIndex + itemsPerPage;
      let data;

      if (option == "highToLow") {
          data = await Product.find({ isBlocked: false }).sort({ salePrice: -1 });
      } else if (option == "lowToHigh") {
          data = await Product.find({ isBlocked: false }).sort({ salePrice: 1 });
      } else if (option == "releaseDate") {
          data = await Product.find({ isBlocked: false }).sort({ createdOn: 1 });
      }

      res.json({
          status: true,
          data: {
              currentProduct: data,
              count: data.length,
              totalPages: Math.ceil(data.length / itemsPerPage),
              currentPage
          }
      });

  } catch (error) {
      res.redirect("/pageNotFound");
      res.json({ status: false, error: error.message });
  }
};




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
  applyCoupon,
  getSortProducts,
  filterByPrice,
  filterProduct,
  searchProducts
};
