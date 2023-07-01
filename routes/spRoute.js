const express = require('express')
const router = require('express').Router();
const multer = require("multer");
const path = require('path');


const storage = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,path.join(__dirname,"../public/userImages"));
    },
    filename:(req,file,cb)=>{
        cb(null, file.originalname + '-' + Date.now()) 
        
    }
})
const upload = multer({storage:storage});


const spController = require('../controller/spController');
const {
    signupValidator,
    loginValidator,
    changePassword,
    resetValidator
} = require('../utils/validators/authSPValidator');
const auth = require("../middlewares/auth");

router.post("/SPsignup",upload.single("image"),signupValidator,spController.createNewUser);
router.get("/SPverify",spController.verifyMail);
router.post("/SPsignin",loginValidator,spController.postSignin);
router.get("/SPlogout",auth,spController.logout);
router.post("/SPupdatePassword",auth,changePassword,spController.update_password);
router.post("/SPforgetPassword",spController.forget_password);
router.post("/reset-password",resetValidator,spController.reset_password);
router.get("/SPProfile",auth,spController.getUserProfile);
router.put("/updateSPProfile",auth,spController.editUserProfile);
router.delete("/SPdelete",spController.deleteUserAccount);
router.post("/SPemailVerification",spController.sendVerificationLink);
router.post("/createPost",auth,upload.single('image'),spController.spCreatePost);
router.get("/partnerOffer",auth,spController.getPartnerOffer);
router.get("/Hotel",spController.Hotel);
router.get("/Cinema",spController.Cinema);
router.get("/Bazaar",spController.Bazaar);
router.get("/ResortAndVillage",spController.ResortAndVillage);
router.get("/NaturalPreserve",spController.NaturalPreserve);
router.get("/TourismCompany",spController.TourismCompany);
router.get("/ArchaeologicalSite",spController.ArchaeologicalSite);
router.get("/RestaurantAndCafe",spController.RestaurantAndCafe);
router.get("/TransportationCompany",spController.TransportationCompany);
router.get("/spProfile",spController.getSPProfile_forClient);



module.exports = router;


