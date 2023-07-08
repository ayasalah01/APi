
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const mongoose = require("mongoose");
const MongoClient = require('mongodb').MongoClient
const bcrypt = require('bcryptjs');
const randomstring = require("randomstring");

const sendMail = require("../utils/sendEmail")
const ServiceProvider = require('../models/spModel');
const Services = require("../models/serviceModel");
const Natural = require("../models/natural");
const Review = require("../models/reviewModel");
const createToken = require("../utils/createToken");
const ApiError = require("../utils/ApiError");
const auth = require("../middlewares/auth");
const { parse } = require('dotenv');

//bycrpt password
const securePassword = (password)=>{
    try {
        const hashedPassword = bcrypt.hash(password,10);
        return hashedPassword;
    } catch (error) {
        res.status(400).send(error.message);
    }
}
const createNewUser = async(req,res,next) =>{
    try {
        const hashPassword = await securePassword (req.body.password);
        const user = new ServiceProvider({
            _id: new mongoose.Types.ObjectId(),
            serviceName:req.body.serviceName,
            email : req.body.email,
            Address: req.body.Address,
            phoneNumber:req.body.phoneNumber,
            password : hashPassword,
            category:req.body.category,
            image: `https://api-mtgy.onrender.com/image/${req.file.filename}`
        });
        const userData = await user.save();
        if(userData){
            user.token = await createToken(userData._id);
            sendMail.sendSPVerificationMail(req.body.email,userData._id);
            res.status(200).send({success:true,data:userData,msg:"your registration has been successfully Please verify your email"});
        }
        else{
            res.status(400).send({success:false,msg:"your register has been failed"})
        }
    } catch (error) {
        console.log(error);
        // res.status(400).send({success:false},error);
    }
}
const verifyMail = async(req,res,next)=>{
    try {
        const id = req.query.user_id;
        const tokenData = await ServiceProvider.findOne({_id:id});
        const updateinfo = await ServiceProvider.findByIdAndUpdate({_id:tokenData._id},{$set:{is_varified:1}},{new:true});
        res.status(201).json({
            success:true,
            message: "Email verified"
        });
    } catch (error) {
        console.log(error.message);
        res.status(400).send({success:false},error.message);
    }
}
const postSignin = async(req,res,next)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await ServiceProvider.findOne({email:email})
        console.log(userData);
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if (passwordMatch){
                if(userData.is_varified === 0){
                    res.status(200).send({success:false,msg:"please verify your Email"});
                }
                else{
                const tokenData = await createToken(userData._id);
                    res.status(201).json({
                        success:true,
                        message: "Signin successfully",
                        userData:userData,
                        token:tokenData
                    });
                }
            }
            else{
                res.status(201).json({success:false,message: "password is incorrect"});
            }
        }
        else{
            res.status(200).send({success:false,message:"Signin details are incorrect"});
        }
    } catch (error) {
        res.status(400).send({success:false},error.message);
    }
}
// verfiy login 
const verfiyLogin = async(req,res,next) =>{
    try {
        res.setHeader('X-Foo', 'bar')
        res.status(200).send({success:true ,msg:"Authenticated"});
    } catch (error) {
        res.status(401).send({success:false},error.message);
    }
}
// signout
const logout = (req,res, next) =>{
    const id = req.userId;
    const data = ServiceProvider.findByIdAndUpdate({_id:id},{token:""},(err)=>{
        if(err) return res.status(400).send({success:false},err);
        res.status(200).send({success:true,msg:"You have been Logged Out"});
    });
    // const authHeader = req.headers["authorization"];
    // jwt.sign(authHeader, "", { expiresIn: 1 } , (logout, err) => {
    // if (logout) {
    //     res.send({msg : 'You have been Logged Out' });
    // } else {
    // res.send({msg:'Error'});
    // }
    // });
} 
// update password
const update_password = async(req,res,next)=>{
    try {
        const id = req.userId;
        const old_password = req.body.old_password
        const new_password = req.body.new_password
        const userData = await ServiceProvider.findById({_id:id})
        
        if (userData) {
            const passwordMatch = await bcrypt.compare(old_password,userData.password)
            if (passwordMatch){
                const hashedPassword = await securePassword(new_password)
                await ServiceProvider.updateOne({_id:userData._id},{$set:{password:hashedPassword}});
                const tokenData = await createToken(userData._id);
                res.status(200).send({success:true , message:"successfully user password has been updated",token:tokenData});
                
            }
            else{
                res.status(201).send({success:false ,message: "old password is incorrect"});
            }
        }
        else{
            res.status(400).send({success:false ,message: "data is incorrect"});
        }
        
    } catch (error) {
        console.log(error)
    }
}

//reset forgetten password
// const forget_password = async(req,res,next)=>{
//     try{
//         const email = req.body.email
//         const userData = await ServiceProvider.findOne({email:email})
//         console.log(userData.email);
//         if(userData){
//             const randomString = randomstring.generate();
//             const Data = await ServiceProvider.updateOne({email:email},{$set:{token:randomString}});
//             sendMail.sendSPResetPasswordMail(userData.email,randomString);
//             res.status(200).send({success:true, msg:"Please check your email inbox"})

//         }
//         else{
//             res.status(200).send({success:true, msg:"this email does not exists"})
//         }
//     }
//     catch(error)
//     {
//         res.status(400).send({success:false, msg:error.message});
//     }
// }
// const reset_password = async(req,res,next)=>{
//     try {
//         const token = req.query.token;
//         const tokenData = await ServiceProvider.findOne({token:token})
//         if(tokenData){
//             const new_password = req.body.new_password;
//             const  hashedPassword = await securePassword(new_password);
            
//             await ServiceProvider.updateOne({ _id:tokenData._id},{$set:{password:hashedPassword}})
//             res.status(200).send({success:true, msg:"password has been reseted"})
//         }
//         else{
//             res.status(201).send({success:false, msg:"This link has been expired"})
//         }
        
//     } catch (error) {
//         res.status(400).send({success:false, msg:error.message});
//     }

// }
//profile
const getUserProfile = async(req,res,next)=>{
        try {
            const id = req.userId;
            const user = await ServiceProvider.findById({_id:id});
            res.status(200).send({success:true , userData:user});
        } 
        catch (error) {
            res.status(400).send({success:false , msg:"Invalid Token"});
    }

}
const editUserProfile = async(req,res,next)=>{  
    //const email = req.body.email
    try {
        const id = req.userId;
        //const user = await ServiceProvider.findOne({email:email})
        const userData = await ServiceProvider.findById({_id:id})
        if(userData){
            const data = await ServiceProvider.findByIdAndUpdate({_id:id},{$set:{serviceName:req.body.serviceName,email:req.body.email,Address:req.body.Address,phoneNumber:req.body.phoneNumber}})
            res.status(200).send({success:true,msg:"user profile has been updated"})
        }
        else{
            res.status(500).send({success:false,msg:err.message});
        }
    } catch (error) {
        res.status(400).send({success:false, msg:error.message});
    }
}
const deleteUserAccount = async(req,res,next)=>{
    const email = req.body.email;
    if(email){
        try {
            const userData = await ServiceProvider.findOne({email:email})
            const user = await ServiceProvider.findByIdAndDelete({_id:userData._id})
            sendMail.sendMsg_deleteAccountMail(userData.email);
            res.status(200).send({success:true, msg:"Account has been deleted"});
        } catch (error) {
            res.status(400).send({success:false, msg:error.message});
        }

    }
    else{
        res.status(400).json({success:false},"your email not exit and can not delete your account")
    }
}
//reset verfiy email
const sendVerificationLink = async (req,res,next)=>{
    try {
        const email = req.body.email;
        const userData = await ServiceProvider.findOne({email:email});
        console.log(userData.email)
        if(userData){
            sendMail.sendSPVerificationMail(userData.email,userData._id);
            res.status(200).send({success:true, message:"Reset verification Mail"});
        }
        else{
            res.status(400).send({success:false,message:"this Email is not exist"})
        }
    } 
    catch (error) {
        console.log(error.message);
    }
}
//create post
const spCreatePost = async(req,res,next)=>{
    try {
        const id = req.userId;
        const userData = await ServiceProvider.findById({_id:id})
        console.log(userData.category);
            const service = new Services({
                offerTitle:req.body.offerTitle,
                postDetails:req.body.postDetails,
                price:req.body.price,
                category:userData.category,
                serviceName:userData.serviceName,
                sp_id:userData._id,
                //image: req.file.filename
                image: `https://api-mtgy.onrender.com/image/${req.file.filename}`
            });
            const post = await service.save();
            if(post){
                sendMail.sendAdminNotifyMail(post.offerTitle,post.postDetails,post.price,post.category,post.serviceName,post.image);
                res.status(200).send({success:true,data:post,msg:"your offer has been successfully posted"});
            }
            else{
                res.status(200).send({success:false,msg:"your offer has been failed"})
            }
        
    } catch (error) {
        res.status(500).send({success:false,msg:error.message})
    }
}
const getPartnerOffer = async (req,res,next)=>{
    try {
        const id = req.userId;
        const userData = await ServiceProvider.findById({_id:id})
        console.log(userData.category);
        const users = await Services.find({category:userData.category});
        //console.log("data :",users);
        res.status(200).send({success:true,data:users});

    } catch (error) {
        console.log(error.message);
    }
}
// get services
const Hotel = async(req,res,next)=>{
    try {
        const users = await Services.find({category:"Hotel"});
        res.status(200).send({success:true, data:users});
        
    } catch (error) {
        console.log(error.message);
    }
}
const Cinema = async(req,res,next)=>{
    try {
        const users = await Services.find({category:"Cinema"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
const Bazaar = async(req,res,next)=>{
    try {
        const users = await Services.find({category:"Bazaar"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
const ResortAndVillage = async(req,res,next)=>{
    try {
        const users = await Services.find({category:"Resort & Village"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
const NaturalPreserve = async(req,res,next)=>{
    try {
        const users = await Natural.find({category:"Natural Preserve"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
const TourismCompany = async(req,res,next)=>{
    try {
        const users = await Services.find({category:"Tourism Company"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
const ArchaeologicalSite = async(req,res,next)=>{
    try {
        const users = await Natural.find({category:"Archaeological Site"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
const RestaurantAndCafe = async(req,res,next)=>{
    try {
        const users = await Services.find({category:"Restaurant & Cafe"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
const TransportationCompany = async(req,res,next)=>{
    try {
        const users = await Services.find({category:"Transportation Company"});
        res.status(200).send({success:true, data:users});
    } catch (error) {
        console.log(error.message);
    }
}
//get sp profile for user
const getSPProfile_forClient = async(req,res,next)=>{
    try {
        const id = req.params.id
        const data = await ServiceProvider.findById({_id:id});
        console.log(data);
        res.status(200).send({success:true,Partner_Profile:data});
    } catch (error) {
        res.status(500).send({success:false,msg:error.message})
    }
}
//forget
const forgotPassword = async (req, res, next) => {
    // 1) Get user by email
    const user = await ServiceProvider.findOne({ email: req.body.email });
    console.log(user.email)
    if (!user) {
        res.status(400).send({success:false ,message:"user email is invaild"})
    }
    // 2) If user exist, Generate hash reset random 6 digits and save it in db
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(resetCode)
        .digest('hex');
  
    // Save hashed password reset code into db
    user.passwordResetCode = hashedResetCode;
    user.passwordResetVerified = false;
  
    await user.save();
  
    // 3) Send the reset code via email
    const message = `Hi ${user.serviceName},\n We received a request to reset the password on your MTGY Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.`;
    try {
    await sendMail.sendResetPasswordMail(user.email,message)
    } catch (err) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;
        await user.save();
        return next(new ApiError('There is an error in sending email', 500));
    }
    res.status(200).json({ status: 'Success', message: 'Reset code sent to email' });
};
// Verify password reset code

const verifyPassResetCode = async (req, res, next) => {
    // 1) Get user based on reset code
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(req.body.resetCode)
        .digest('hex');

    const user = await ServiceProvider.findOne({passwordResetCode: hashedResetCode});
    if (!user) {
        return next(new ApiError('Reset code invalid or expired'));
    }
    // 2) Reset code valid
    user.passwordResetVerified = true;
    await user.save();
    const token = await createToken(user._id);
    res.status(200).json({success:true,token:token});
};
// Reset password
const resetPassword = async (req, res, next) => {
    const id = req.userId
    //const user = await User.findOne({ email: req.body.email });
    const user = await ServiceProvider.findOne({_id:id});
    console.log(user.email)
    if (!user) {
        return next(
        new ApiError(`There is no user with email ${user.email}`,404)
    );
    }
    // 2) Check if reset code verified
    if (!user.passwordResetVerified) {
        return next(new ApiError('Reset code not verified', 400));
    }
    const new_password = req.body.new_password;
    const  hashedPassword = await securePassword(new_password)
    user.password = hashedPassword;
    user.passwordResetCode = undefined;
    user.passwordResetVerified = undefined;
    await user.save();
    // 3) if everything is ok, generate token
    //const token = createToken(user._id);
    res.status(200).send({success:true,message:"success your password has been reseted" });
};
//get reviews
const getRate = async (req,res,next)=>{
    try {
        const id = req.userId;
        const data = await Review.find({sp_id:id});
        console.log(data)
        res.status(200).send({success:true,data:data});
    } catch (error) {
        res.status(500).send({success:false,msg:error.message})
    }
}

module.exports = {
    createNewUser,
    verifyMail,
    postSignin,
    verfiyLogin,
    logout,
    update_password,
    getUserProfile,
    editUserProfile,
    deleteUserAccount,
    sendVerificationLink,
    spCreatePost,
    getPartnerOffer,
    Hotel,
    Cinema,
    Bazaar,
    ResortAndVillage,
    NaturalPreserve,
    TourismCompany,
    ArchaeologicalSite,
    RestaurantAndCafe,
    TransportationCompany,
    getSPProfile_forClient,
    forgotPassword,
    verifyPassResetCode,
    resetPassword,
    getRate
}