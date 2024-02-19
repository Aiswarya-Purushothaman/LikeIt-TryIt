const express=require("express")

const Router=express.Router()
const customerController = require("../controllers/customerController")
const adminController = require("../controllers/adminController")
const categoryController = require("../controllers/categoryController")
const productController = require("../controllers/productController")
const brandController = require("../controllers/brandController")
const orderContoller=require("../controllers/orderController")
const bannerController=require('../controllers/bannerController')


const { isAdmin } = require("../Authentication/auth")  

Router.get("/pageerror", adminController.pageNotFound1)

// Multer Settings
const multer = require("multer")
const storage = require("../helpers/multer")
const upload = multer({ storage: storage })
Router.use("/public/uploads", express.static("/public/uploads"))


// admin Actions

Router.get("/login", adminController.getLoginPage)
Router.post("/login", adminController.verifyLogin)
Router.get("/logout", isAdmin, adminController.getLogout)
Router.get("/", isAdmin, adminController.getDashboard)


//Category Management
Router.get("/category", isAdmin, categoryController.getCategoryInfo)
Router.post("/addCategory", isAdmin, categoryController.addCategory)
Router.get("/allCategory", isAdmin, categoryController.getAllCategories)
Router.get("/listCategory", isAdmin, categoryController.getListCategory)
Router.get("/unListCategory", isAdmin, categoryController.getUnlistCategory)
Router.get("/editCategory", isAdmin, categoryController.getEditCategory)
Router.post("/editCategory/:id", isAdmin, categoryController.editCategory)
Router.post("/addCategoryOffer", isAdmin, categoryController.addCategoryOffer)
Router.post("/removeCategoryOffer", isAdmin, categoryController.removerCategoryOffer)


//Product Management
Router.get("/addProducts", isAdmin, productController.getProductAddPage)
Router.post("/addProductsm", isAdmin, upload.array("images", 5), productController.addProducts)
Router.get("/products", isAdmin, productController.getAllProducts)
Router.get("/editProduct", isAdmin, productController.getEditProduct)
Router.post("/editProduct/:id", isAdmin, upload.array("images", 5), productController.editProduct)
Router.post("/deleteImage", isAdmin, productController.deleteSingleImage)
Router.get("/blockProduct", isAdmin, productController.getBlockProduct)
Router.get("/unBlockProduct", isAdmin, productController.getUnblockProduct)
Router.post("/addProductOffer", isAdmin, productController.addProductOffer)
Router.post("/removeProductOffer", isAdmin, productController.removeProductOffer)



//Customer Management
Router.get("/users", isAdmin, customerController.getCustomersInfo)
Router.get("/blockCustomer", isAdmin, customerController.getCustomerBlocked)
Router.get("/unblockCustomer", isAdmin, customerController.getCustomerUnblocked)

//Brand Management
Router.get("/brands", isAdmin, brandController.getBrandPage)
Router.post("/addBrand", isAdmin, upload.single('image'), brandController.addBrand)
Router.get("/allBrands", isAdmin, brandController.getAllBrands)
Router.get("/blockBrand", isAdmin, brandController.blockBrand)
Router.get("/unBlockBrand", isAdmin, brandController.unBlockBrand)
Router.get("/deletebrand",isAdmin,brandController.deletebrand)

// Banner Management
Router.get("/banner", isAdmin, bannerController.bannerManagement)
Router.get("/addBanner", isAdmin, bannerController.getAddBannerPage)
Router.post("/addBanner", isAdmin,upload.single("images"), bannerController.postAddBanner)
Router.get("/editBanner", isAdmin, bannerController.getEditBannerPage)
Router.post("/editBanner", isAdmin,upload.single("images"), bannerController.postEditBanner)
Router.get("/deleteBanner", isAdmin, bannerController.deleteBanner)
Router.post("/deletebannerImage",isAdmin,bannerController.deletebannerImage)



// Order Management
Router.get("/orderList", isAdmin, orderContoller.getOrderListPageAdmin)
Router.get("/orderDetailsAdmin", isAdmin, orderContoller.getOrderDetailsPageAdmin)
Router.get("/changeStatus", isAdmin, orderContoller.changeOrderStatus)

// Coupon Management
Router.get("/coupon", isAdmin, adminController.getCouponPageAdmin)
Router.post("/createCoupon", isAdmin, adminController.createCoupon)
Router.get("/editCoupon",isAdmin,adminController.editCoupon)
Router.get("/deleteCoupon",isAdmin,adminController.deletecoupon)
Router.post("/updatecoupon",isAdmin,adminController.updatecoupon)

// Sales Report
Router.get("/salesReport", isAdmin, adminController.getSalesReportPage)
Router.get("/salesToday", isAdmin, adminController.salesToday)
Router.get("/salesWeekly", isAdmin, adminController.salesWeekly)
Router.get("/salesMonthly", isAdmin, adminController.salesMonthly)
Router.get("/salesYearly", isAdmin, adminController.salesYearly)
Router.post("/generatePdf", isAdmin, adminController.generatePdf)
Router.post("/downloadExcel", isAdmin, adminController.downloadExcel)
Router.get("/monthly-report",adminController.monthlyreport)
Router.get("/dateWiseFilter", isAdmin, adminController.dateWiseFilter)



module.exports = Router