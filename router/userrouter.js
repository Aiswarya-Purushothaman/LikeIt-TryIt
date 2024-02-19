const express=require("express")
const Router=express.Router()
const userController = require("../controllers/userController")
const cartController = require("../controllers/cartController")
const userProfileController = require("../controllers/userProfileController")
const productController = require('../controllers/productController')
const orderContoller=require('../controllers/orderController')
const walletController=require('../controllers/walletController')
const { isLogged } = require("../Authentication/auth") 


Router.get("/pageNotFound", userController.pageNotFound)

Router.get("/login", userController.getLoginPage)
Router.post("/login", userController.userLogin)

Router.get("/signup",userController.getSignupPage)
Router.post("/signup",userController.signupUser)
Router.post("/verify-otp", userController.verifyOtp)

Router.get("/", userController.getHomePage)

Router.get("/about",userController.aboutPage)
Router.get("/shop",userController.getShopPage)
Router.post("/search", userController.searchProducts)
Router.get("/filter", userController.filterProduct)
Router.get("/filterPrice", userController.filterByPrice)
Router.post("/sortProducts", userController.getSortProducts)


Router.get("/logout", isLogged, userController.getLogoutUser)
Router.post("/applyCoupon", isLogged, userController.applyCoupon)

Router.get("/forgotPassword", userProfileController.getForgotPassPage)
Router.post("/forgotEmailValid", userProfileController.forgotEmailValid)
Router.post("/verifyPassOtp", userProfileController.verifyForgotPassOtp)
Router.get("/resetPassword", userProfileController.getResetPassPage)
Router.post("/changePassword", userProfileController.postNewPassword)

Router.get("/userprofile",userProfileController.getUserProfile)
Router.post("/editUserDetails",userProfileController.editUserDetails)
Router.get("/addAddress",userProfileController.getAddressAddPage)
Router.post("/addAddress",userProfileController.postAddress)
Router.get("/editAddress",userProfileController.getEditAddress)
Router.post("/editAddress",userProfileController.postEditAddress)
Router.get("/deleteAddress",userProfileController.getDeleteAddress)
Router.post("/verifyReferalCode", isLogged, userProfileController.verifyReferalCode)





// Cart
Router.get("/cart", isLogged, cartController.getCartPage)
Router.post("/addToCart",isLogged, cartController.addToCart)
Router.post("/changeQuantity", isLogged,cartController.changeQuantity)
Router.get("/deleteItem", isLogged, cartController.deleteProduct)


// orders
Router.get("/checkout", isLogged,orderContoller.getCheckoutPage)
Router.post("/orderPlaced", isLogged,orderContoller.orderPlaced)
Router.get("/orderDetails", isLogged,orderContoller.getOrderDetailsPage)
Router.get("/cancelOrder",isLogged,orderContoller.cancelorder)
Router.get("/returnrequestOrder",isLogged,orderContoller.returnorder)

Router.post("/verifyPayment", isLogged, orderContoller.verify)
Router.post("/singleProductId",isLogged,orderContoller.changeSingleProductStatus)
Router.post('/paymentConfirm',isLogged,orderContoller.paymentConfirm)

// Wallet
Router.post("/addMoney", isLogged, walletController.addMoneyToWallet)
Router.post("/verify-payment", isLogged, walletController.verify_payment)




//Products based routes
Router.get("/productDetails", productController.productDetails)
module.exports = Router
