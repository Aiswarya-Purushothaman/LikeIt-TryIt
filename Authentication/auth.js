const User = require("../models/userSchema")

const isLogged = (req, res, next)=>{
    console.log("middleware caling");
    if(req.session.user){
        User.findById({_id : req.session.user}).lean()
        .then((data)=>{
            if(data.isBlocked == false){
                next()
            }else{
                res.redirect("/login")
            }
        })
    }else{
        console.log("else case ");
        res.redirect("/login")
    }
}


const isAdmin = (req, res, next) => {
        User.findOne({ isAdmin: "1" })
            .then((data) => {
                if (data) {
                    next();
                } else {
                    res.redirect("/admin/login");
                }
            })
            .catch((error) => {
                console.error("Error in isAdmin middleware:", error);
                res.status(500).send("Internal Server Error");
            });
   
};


module.exports = {
    isLogged,
    isAdmin
}