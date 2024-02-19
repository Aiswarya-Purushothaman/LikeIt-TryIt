const Banner = require("../models/bannerSchema")
const path = require("path")
const fs = require('fs')

const bannerManagement = async (req, res) => {
    try {
        const findBanner = await Banner.find({})
        res.render("banner", { data: findBanner })
    } catch (error) {
         res.redirect("/pageerror");
    }
}



const getAddBannerPage = async (req, res) => {
    try {
        res.render("addBanner")
    } catch (error) {
         res.redirect("/admin/pageerror");
    }
}

const postAddBanner = async (req, res) => {
    try {
        const data = req.body
        const image = req.file
        // console.log("Image >>>>>>size:", image.size);
        
        const newBanner = new Banner({
            image: image.filename,
            title: data.title,
            description: data.description,
            startDate: new Date(data.startDate + 'T00:00:00'),
            endDate: new Date(data.endDate + 'T00:00:00'),
            link: data.link
        })

        await newBanner.save()
            .then(data => console.log(data))
        res.redirect("/admin/banner")

    } catch (error) {
         res.redirect("/admin/pageerror");
    }
}


const getEditBannerPage = async (req, res) => {
    try {
        const id = req.query.id
        const findBanner = await Banner.findOne({ _id: id })
        console.log(findBanner);
        res.render("editBanner", { data: findBanner })
    } catch (error) {
         res.redirect("/pageerror");
    }
}

const postEditBanner = async (req, res) => {
    try {
        // const image = req.file.filename
        const data = req.body
        const id = req.query.id

        if (req.file) {
            
                image = req.file.filename

                await Banner.updateOne(
                    { _id: id },
                    {
                        $set: {
                            image: image,
                            title: data.title,
                            description: data.description,
                            link: data.link,
                            startDate: new Date(data.startDate + 'T00:00:00'),
                            endDate: new Date(data.endDate + 'T00:00:00'),
                        }
                    }
        
                )
                .then((data)=>console.log(data))
           
        }else{
            await Banner.updateOne(
                { _id: id },
                {
                    $set: {
                     
                        title: data.title,
                        description: data.description,
                        link: data.link,
                        startDate: new Date(data.startDate + 'T00:00:00'),
                        endDate: new Date(data.endDate + 'T00:00:00'),
                    }
                }
    
            )
            .then((data)=>console.log(data))
        }

        
        
        res.redirect("/admin/banner")

    } catch (error) {
         res.redirect("/pageerror");
    }
}

const deleteBanner = async (req, res)=>{
    try {
        const id = req.query.id
        await Banner.deleteOne(
            {_id : id}
        )
        .then((data)=>console.log(data))
        res.redirect("/admin/banner")
    } catch (error) {
         res.redirect("/pageerror");
    }
}
const deletebannerImage = async (req, res) => {
    const imageName = req.body.imageNameTOserver;
    const bannerid = req.body.bannerid;
    console.log(imageName, "imageName", bannerid, "bannerid");
    try {
        const banner = await Banner.findByIdAndUpdate(bannerid, { $unset: { image: 1 } });
        if (!banner) {
            return res.status(404).json({ status: false, error: "Banner not found" });
        }

        // Delete the image file from the filesystem
        const imagePath = path.join("public", "uploads", "re-image", imageName);
        if (fs.existsSync(imagePath)) {
            await fs.unlinkSync(imagePath);
            console.log(`Image ${imageName} deleted successfully`);
        } else {
            console.log(`Image ${imageName} not found`);
        }

        res.json({ status: true });
    } catch (error) {
        res.redirect("/pageerror");
        // res.status(500).json({ status: false, error: "Failed to delete image" });
    }
};

module.exports = {
    getAddBannerPage,
    bannerManagement,
    postAddBanner,
    getEditBannerPage,
    postEditBanner,
    deleteBanner,
    deletebannerImage
}