const User = require("../models/userSchema");
const bcrypt = require("bcrypt");
const Order = require("../models/orderSchema");
const Coupon = require("../models/couponSchema.js")
const PDFDocument = require("pdfkit");
const Category = require("../models/categorySchema");
const Product = require("../models/productSchema");
const moment= require("moment")

const getDashboard = async (req, res) => {
  if (req.session.admin) {
    try {
      let order = await Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalPrice: { $sum: "$totalPrice" },
          },
        },
      ]);
      let category = await Category.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
      ]);
      let product = await Product.aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
          },
        },
      ]);

      console.log(order, "orders ");
      console.log(category, "category ");
      console.log(product, "product ");

      res.render("index", {
        product: product,
        category: category,
        order: order,
      });
    } catch (error) {
      console.log(error.message);
    }
  } else {
    res.redirect("admin-login");
  }
};

const getLoginPage = async (req, res) => {
  if (req.session.admin) {
        let order = await Order.aggregate([
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalPrice: { $sum: "$totalPrice" },
            },
          },
        ]);
        let category = await Category.aggregate([
          {
            $group: {
              _id: "$category",
              count: { $sum: 1 },
            },
          },
        ]);
        let product = await Product.aggregate([
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
            },
          },
        ]);
  res.render("index", {
        product: product,
        category: category,
        order: order,
      });
  } else {
    try {
        
      res.render("admin-login");
    } catch (error) {
      console.log(error.message);
    }
  }
};

const verifyLogin = async (req, res) => {
  console.log("is route calling");
  try {
    const { email, password } = req.body;
    console.log(email, "mail");
    console.log("pass-", password);

    const findAdmin = await User.findOne({ email, isAdmin: "1" });
    // console.log("admin data : ", findAdmin);
    console.log(findAdmin);
    if (findAdmin) {
      const passwordMatch = await bcrypt.compare(password, findAdmin.password);
      if (passwordMatch) {
        req.session.admin = true;
        console.log("Admin Logged In");
        res.redirect("/admin");
      } else {
        console.log("Password is not correct");
        res.redirect("/admin/login");
      }
    } else {
      console.log("He's not an admin");
    }
  } catch (error) {
    console.log(error.message);
  }
};

const getLogout = async (req, res) => {
  try {
    req.session.admin = null;
    res.redirect("/admin/login");
  } catch (error) {
    console.log(error.message);
  }
};
const getSalesReportPage = async (req, res) => {
  console.log("calling api");
  try {
    // const orders = await Order.find({ status: "Delivered" }).sort({ createdOn: -1 })
    // // console.log(orders);

    // res.render("salesReport", { data: currentOrder, totalPages, currentPage })

    // console.log(req.query.day);
    let filterBy = req.query.day;
    console.log(filterBy, "okoo");
    if (filterBy) {
      res.redirect(`/admin/${filterBy}`);
    } else {
      res.redirect(`/admin/salesMonthly`);
    }
  } catch (error) {
    console.log(error.message);
  }
};

const salesToday = async (req, res) => {
  try {
    let today = new Date();
    const startOfTheDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
      0,
      0
    );

    const endOfTheDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
      999
    );

    const orders = await Order.aggregate([
      {
        $match: {
          createdOn: {
            $gte: startOfTheDay,
            $lt: endOfTheDay,
          },
          status: "Delivered",
        },
      },
    ]).sort({ createdOn: -1 });
    console.log(orders, "sales today");
    let itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(orders.length / 3);
    const currentOrder = orders.slice(startIndex, endIndex);

    res.render("salesReport", {
      data: currentOrder,
      totalPages,
      currentPage,
      salesToday: true,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const salesWeekly = async (req, res) => {
  try {
    let currentDate = new Date();
    console.log(currentDate, "currrent date");
    const startOfTheWeek = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() - currentDate.getDay()
    );
    console.log(startOfTheWeek, "start of week");
    const endOfTheWeek = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      currentDate.getDate() + (6 - currentDate.getDay()),
      23,
      59,
      59,
      999
    );
    console.log(endOfTheWeek, "end of the week");
    const orders = await Order.aggregate([
      {
        $match: {
          createdOn: {
            $gte: startOfTheWeek,
            $lt: endOfTheWeek,
          },
          status: "Delivered",
        },
      },
    ]).sort({ createdOn: -1 });

    let itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(orders.length / 3);
    const currentOrder = orders.slice(startIndex, endIndex);

    res.render("salesReport", {
      data: currentOrder,
      totalPages,
      currentPage,
      salesWeekly: true,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const salesMonthly = async (req, res) => {
  try {
    let currentMonth = new Date().getMonth() + 1;
    const startOfTheMonth = new Date(
      new Date().getFullYear(),
      currentMonth - 1,
      1,
      0,
      0,
      0,
      0
    );
    console.log(currentMonth, "month");
    const endOfTheMonth = new Date(
      new Date().getFullYear(),
      currentMonth,
      0,
      23,
      59,
      59,
      999
    );
    console.log(endOfTheMonth, "month");

    const orders = await Order.aggregate([
      {
        $match: {
          createdOn: {
            $gte: startOfTheMonth,
            $lt: endOfTheMonth,
          },
          status: "Delivered",
        },
      },
    ]).sort({ createdOn: -1 });
    // .then(data=>console.log(data))
    // console.log("ethi");
    console.log(orders, "orders");
    let itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(orders.length / 3);
    const currentOrder = orders.slice(startIndex, endIndex);
    console.log(currentOrder, "current order");
    res.render("salesReport", {
      data: currentOrder,
      totalPages,
      currentPage,
      salesMonthly: true,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const salesYearly = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const startofYear = new Date(currentYear, 0, 1, 0, 0, 0, 0);
    const endofYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

    const orders = await Order.aggregate([
      {
        $match: {
          createdOn: {
            $gte: startofYear,
            $lt: endofYear,
          },
          status: "Delivered",
        },
      },
    ]);

    let itemsPerPage = 5;
    let currentPage = parseInt(req.query.page) || 1;
    let startIndex = (currentPage - 1) * itemsPerPage;
    let endIndex = startIndex + itemsPerPage;
    let totalPages = Math.ceil(orders.length / 3);
    const currentOrder = orders.slice(startIndex, endIndex);
    console.log(currentOrder, "current order");
    res.render("salesReport", {
      data: currentOrder,
      totalPages,
      currentPage,
      salesYearly: true,
    });
  } catch (error) {
    console.log(error.message);
  }
};

const generatePdf = async (req, res) => {
  try {
    const doc = new PDFDocument();
    const filename = "sales-report.pdf";
    const orders = req.body;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    doc.pipe(res);
    doc.fontSize(12);
    doc.text("Sales Report", { align: "center", fontSize: 16 });
    const margin = 5;
    doc
      .moveTo(margin, margin)
      .lineTo(600 - margin, margin)
      .lineTo(600 - margin, 842 - margin)
      .lineTo(margin, 842 - margin)
      .lineTo(margin, margin)
      .lineTo(600 - margin, margin)
      .lineWidth(3)
      .strokeColor("#000000")
      .stroke();

    doc.moveDown();

    const headers = ["Order ID", "Name", "Date", "Total"];

    let headerX = 20;
    const headerY = doc.y + 10;

    doc.text(headers[0], headerX, headerY);
    headerX += 200;

    headers.slice(1).forEach((header) => {
      doc.text(header, headerX, headerY);
      headerX += 130;
    });

    let dataY = headerY + 25;

    orders.forEach((order) => {
      doc.text(order.dataId, 20, dataY);
      doc.text(order.name, 210, dataY);
      doc.text(order.date, 350, dataY);
      doc.text(order.totalAmount, 480, dataY);
      dataY += 30;
    });

    doc.end();
  } catch (error) {
    console.log(error.message);
  }
};


const getCouponPageAdmin = async (req, res) => {
    try {
        const findCoupons = await Coupon.find({})
        res.render("coupon", { coupons: findCoupons })
    } catch (error) {
        console.log(error.message);
    }
}

const createCoupon = async (req, res) => {
    try {

        const data = {
            couponName: req.body.couponName,
            startDate: new Date(req.body.startDate + 'T00:00:00'),
            endDate: new Date(req.body.endDate + 'T00:00:00'),
            offerPrice: parseInt(req.body.offerPrice),
            minimumPrice: parseInt(req.body.minimumPrice)
        };

        const newCoupon = new Coupon({
            name: data.couponName,
            createdOn: data.startDate,
            expireOn: data.endDate,
            offerPrice: data.offerPrice,
            minimumPrice: data.minimumPrice
        })

        await newCoupon.save()
            .then(data => console.log(data))

        res.redirect("/admin/coupon")

        console.log(data);

    } catch (error) {
        console.log(error.message);
    }
}

const monthlyreport=async(req,res)=>{
    try {
        console.log("Function calleddd")
      const start = moment().subtract(30, 'days').startOf('day'); // Data for the last 30 days
      const end = moment().endOf('day');
      const orderSuccessDetails = await Order.find({
        createdOn: { $gte: start, $lte: end },
        status: 'Delivered' 
      });
      
      const monthlySales = {};
  
      orderSuccessDetails.forEach(order => {
        const monthName = moment(order.order_date).format('MMMM');
        if (!monthlySales[monthName]) {
          monthlySales[monthName] = {
            revenue: 0,
            productCount: 0,
            orderCount: 0,
            codCount: 0,
            razorpayCount: 0,
          };
        }
        console.log("ORder: ",order)
        monthlySales[monthName].revenue += order.totalPrice;
        monthlySales[monthName].productCount += order.product.length;
        monthlySales[monthName].orderCount++;

        if (order.payment=== 'cod') {
          monthlySales[monthName].codCount++;
        } else if (order.payment === 'razorpay') {
          monthlySales[monthName].razorpayCount++;
        } 
      });
  
      const monthlyData = {
        labels: [],
        revenueData: [],
        productCountData: [],
        orderCountData: [],
        codCountData: [],
        razorpayCountData: [],
      };
  
      for (const monthName in monthlySales) {
        if (monthlySales.hasOwnProperty(monthName)) {
          monthlyData.labels.push(monthName);
          monthlyData.revenueData.push(monthlySales[monthName].revenue);
          monthlyData.productCountData.push(monthlySales[monthName].productCount);
          monthlyData.orderCountData.push(monthlySales[monthName].orderCount);
          monthlyData.codCountData.push(monthlySales[monthName].codCount);
          monthlyData.razorpayCountData.push(monthlySales[monthName].razorpayCount);
        }
      }
      console.log("<=====>hi",monthlyData);
      return res.json(monthlyData);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'An error occurred while generating the monthly report.' });
    }
};
const dateWiseFilter = async (req, res)=>{
    try {
        console.log(req.query);
        const date = moment(req.query.date).startOf('day').toDate();

        const orders = await Order.aggregate([
            {
                $match: {
                    createdOn: {
                        $gte: moment(date).startOf('day').toDate(),
                        $lt: moment(date).endOf('day').toDate(),
                    },
                    status: "Delivered"
                }
            }
        ]);

        console.log(orders);

        let itemsPerPage = 5
        let currentPage = parseInt(req.query.page) || 1
        let startIndex = (currentPage - 1) * itemsPerPage
        let endIndex = startIndex + itemsPerPage
        let totalPages = Math.ceil(orders.length / 3)
        const currentOrder = orders.slice(startIndex, endIndex)

        res.render("salesReport", { data: currentOrder, totalPages, currentPage, salesMonthly: true , date})
       

    } catch (error) {
        console.log(error.message);
    }
}




module.exports = {
  getDashboard,
  getLoginPage,
  verifyLogin,
  getLogout,
  getSalesReportPage,
  salesToday,
  salesWeekly,
  salesMonthly,
  salesYearly,
  generatePdf,
  createCoupon,
  getCouponPageAdmin,
  monthlyreport,
  dateWiseFilter
};
