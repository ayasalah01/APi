const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const randomstring = require('randomstring')

const User = require('../models/userModel');
const ServiceProvider = require("../models/spModel");
const Order = require("../models/orderModel");
const Pay = require("../models/payModel");
const Cart = require("../models/cartModel");
const Services = require("../models/serviceModel");
const Natural = require("../models/natural");
const Review = require("../models/reviewModel");


const sendMail = require("../utils/sendEmail");
const config = require("../config/config")
const createToken = require("../utils/createToken");
const ApiError = require("../utils/ApiError");
const auth = require("../middlewares/auth")
// bycrpt password
const securePassword = (password)=>{
    try {
        const hashedPassword = bcrypt.hash(password,10);
        return hashedPassword;
    } catch (error) {
        res.status(400).send(error.message);
    }
}
//create account
const createNewUser = async(req,res,next) =>{
    try {
        const hashPassword = await securePassword (req.body.password);
        const user = new User({
            _id: new mongoose.Types.ObjectId(),
            email : req.body.email,
            username:req.body.username,
            phoneNumber: req.body.phoneNumber,
            password : hashPassword,
            is_admin: 0
        });
        const userData = await user.save();
        if(userData){
            user.token = await createToken(userData._id);
            sendMail.sendVerificationMail(req.body.email,userData._id);
            res.status(200).send({success:true,data:userData,msg:"your registration has been successfully Please verify your email"});
        }
        else{
            res.status(200).send({success:false,msg:"your register has been failed"})
        }
    
    } catch (error) {
        res.status(400).send(error.message);
    }
}
//verfiy email 
const verifyMail = async(req,res,next)=>{
    try {
        const id = req.query.user_id;
        const tokenData = await User.findOne({_id:id});
        const updateinfo = await User.findByIdAndUpdate({_id:tokenData._id},{$set:{is_varified:1}},{new:true});
        res.status(201).json({
            success:true,
            message: "Email verified"
        })
    } catch (error) {
        console.log(error.message);
        res.status(400).send({success:false},error.message);
    }
}
// login
const postSignin = async(req,res,next)=>{
    try {
        const email = req.body.email;
        const password = req.body.password;

        const userData = await User.findOne({email:email})
        if(userData){
            const passwordMatch = await bcrypt.compare(password,userData.password);
            if (passwordMatch){
                if(userData.is_varified === 0){
                    res.status(200).send({success:false,msg:"please verify your Email"});
                }
                else{
                const tokenData = await createToken(userData._id);
                    res.status(201).send({
                        success:true,
                        message: "Signin successfully",
                        userData:userData,
                        token:tokenData
                    });
                }
            }
            else{
                res.status(201).send({success:false ,message: "password is incorrect"});
            }
        }
        else{
            res.status(200).send({success:false,message:"Signin details are incorrect"});
        }
    } catch (error) {
        res.status(400).send({success:false},error.message);
    }
}
// signout
const logout = async(req,res, next) =>{
    const id = req.userId;
    const data = User.findByIdAndUpdate({_id:id},{token:""},(err)=>{
        if(err) return res.status(400).send({success:false},err);
        res.status(200).send({success:true,msg:"You have been Logged Out"});
    // await User.deleteToken(data.token,(err)=>{
    //     if(err) return res.status(400).send({success:false},err);
    //     res.Status(200).send({success:true,msg:"You have been Logged Out"});
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
        //const email = req.body.email
        const old_password = req.body.old_password
        const new_password = req.body.new_password
        const userData = await User.findById({_id:id})
        if (userData) {
            const passwordMatch = await bcrypt.compare(old_password,userData.password)
            if (passwordMatch){
                console.log(new_password)
                const hashedPassword = await securePassword(new_password)
                await User.updateOne({_id:userData._id},{$set:{password:hashedPassword}});
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

// reset forgetten password
// const forget_password = async(req,res,next)=>{
//     try{
//         const email = req.body.email
//         const userData = await User.findOne({ email:email })
//         console.log(userData.email);
//         if(userData){
//             const randomString = randomstring.generate();
//             const Data = await User.updateOne({email:email},{$set:{token:randomString}});
//             sendMail.sendResetPasswordMail(userData.email,randomString);
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
// const getRest = async(req,res,next)=>{
//     try {
//         const token = req.query.token;
//         const tokenData = await User.findOne({token:token});
//         if(tokenData){
//             return res.sendFile(__dirname + '../view/resetPassword.ejs')
//         }
//         else{
//             return res.status(400).send({message: "You have provided an invalid reset link"});
//         }
//     } catch (error) {
//         console.log(error)
//     }
// }
// // const reset_password = async(req,res,next)=>{
// //     try {
// //             const token = req.query.token;
// //             const tokenData = await User.findOne({token:token});
// //             const new_password = req.body.new_password;
            
// //             const  hashedPassword = await securePassword(new_password)
// //             await User.updateOne({ _id:tokenData._id},{$set:{ password:hashedPassword,token:""}});
// //             res.status(200).json({success:true, msg:"password has been reseted"})
        
        
// //     } catch (error) {
// //         res.status(400).send({success:false, msg:error.message});
// //     }

// // }
// const reset_password = async(req,res,next)=>{
//     try {
//         const token = req.query.token;
//         const tokenData = await User.findOne({token:token});
//         if(tokenData){
//             //return res.sendFile(__dirname + "../view/resetPassword.ejs")
//             //res.render("resetPassword",{pageTitle:"ResetPassword",user_id:tokenData._id});
//             const new_password = req.body.new_password;
//             const  hashedPassword = await securePassword(new_password)
//             await User.updateOne({ _id:tokenData._id},{$set:{ password:hashedPassword,token:""}});
//             res.status(200).send({success:true, msg:"password has been reseted"})
//         }
//         else{
//             res.status(200).send({success:false, msg:"This link has been expired"})
//         }
        
//     } catch (error) {
//         res.status(400).send({success:false, msg:error.message});
//     }

// }
//profile
const getUserProfile = async(req,res,next)=>{
    // const email = req.body.email
        try {
            const id = req.userId;
            //const userData = await User.findOne({email:email})
            const user = await User.findById({_id:id});
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
       // const user = await User.findOne({email:email})
        const userData = await User.findById({_id:id})
        if(userData){
            const data = await User.findByIdAndUpdate({_id:id},{$set:req.body});
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
            const userData = await User.findOne({email:email})
            const user = await User.findByIdAndDelete({_id:userData._id})
            res.status(200).send({success:true, msg:"Account has been deleted"});
            sendMail.sendMsg_deleteAccountMail(userData.email)
        } catch (error) {
            res.status(400).send({success:false, msg:error.message});
        }

    }
    else{
        res.status(400).json("your email not exit and can not delete your account")
    }
}
// reset verfiy email
const sendVerificationLink = async (req,res,next)=>{
    try {
        const email = req.body.email;
        const userData = await User.findOne({email:email});
        console.log(userData.email)
        if(userData){
            sendMail.sendVerificationMail(userData.email,userData._id);
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
//create new order
const createOrder = async(req,res,next)=>{
    try {
        const id = req.userId;
        const sp_id= req.body.sp_id
        console.log(sp_id);
        const user = await User.findById({_id:id});
        const order = await new Order({
            service:req.body.service,
            qauntity:req.body.qauntity,
            price:req.body.price,
            category:req.body.category,
            userId:id,
            sp_id:sp_id
        })
        
        const data = await order.save();
        const sp = await ServiceProvider.findById({_id:data.sp_id});
        await sendMail.sendSPNotifyMail(sp.email,user.username);
        res.status(200).send({success:true,data:data});
    } 
    catch (error) {
        res.status(500).send({success:false, msg:error.message});
    }
}
const getPayment = async(req,res,next)=>{
    try {
        const id = req.params.id;
        const data = await Order.findById({_id:id});
        res.status(200).send({success:true,data:data});
        //res.render("pay",{data:data});
    } catch (error) {
        res.status(500).send({success:false, msg:error.message});
    }
}
//payment method
const postPayment = async(req,res,next)=>{
    try {
        const id = req.userId;
        const user = await User.findById({_id:id});
        const sp = await ServiceProvider.findById({_id:req.body.sp_id});
        const pay = new Pay({
            sp_id:req.body.sp_id,
            userId:id,
            service:req.body.service,
            price:req.body.price,
            image: `https://api-mtgy.onrender.com/image/${req.file.filename}`,
            
        });
        await sendMail.sendSPNotifyMailforPay(sp.email,user.username);
        const data = await pay.save();
        if(data){
            res.status(200).send({success:true,message:"payment process has been successfully "});
        }
        else{
            res.status(200).send({success:false,message:"payment process has been failed please try again "});
        }
    } catch (error) {
        res.status(500).send({success:false, msg:error.message});
    }
}
//cart
const addToCart = async(req,res,next)=>{
    try {
        const id = req.userId;
        const data = await new Cart({
            service:req.body.service,
            amount :req.body.amount,
            price:req.body.price,
            category:req.body.category,
            userId:id,
            image:req.body.image
        });
        const cart = await data.save();
        res.status(200).send({success:true,cart:cart});
    } catch (error) {
        res.status(500).send({success:false,msg:error.message});
    }
}
const getCart = async(req,res,next)=>{
    try {
        const id = req.userId
        console.log(id);
        const items = await Cart.find({userId:id})
        res.status(200).send({success:true,cart:items});
    } catch (error) {
        res.status(500).send({success:false,msg:error.message});
    }
}
const Search = async(req,res,next)=>{
    try {
        const service = req.body.service;
        const data = await Services.findOne({serviceName:service});
        if(data){
            res.status(200).send({success:true,data:data});
        }
        else{
            const info = await Natural.findOne({serviceName:service});
            res.status(200).send({success:true,data:info});
        }
        //const info = await Natural.findOne({serviceName:service});
        //res.status(200).send({success:true,data:data});
    } catch (error) {
        console.log(error)
    }
}
//forget
const forgotPassword = async (req, res, next) => {
    // 1) Get user by email
    const user = await User.findOne({ email: req.body.email });
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
    const message = `Hi ${user.username},\n We received a request to reset the password on your MTGY Account. \n ${resetCode} \n Enter this code to complete the reset. \n Thanks for helping us keep your account secure.`;
    try {
    await sendMail.sendResetPasswordMail(user.email,message)
    } catch (err) {
        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;

        await user.save();
        return next(new ApiError('There is an error in sending email', 500));
    }
    res
        .status(200)
        .json({ status: 'Success', message: 'Reset code sent to email' });
};
// Verify password reset code

const verifyPassResetCode = async (req, res, next) => {
    // 1) Get user based on reset code
    const hashedResetCode = crypto
        .createHash('sha256')
        .update(req.body.resetCode)
        .digest('hex');

    const user = await User.findOne({passwordResetCode: hashedResetCode});
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
    const user = await User.findOne({_id:id});
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
// get review
const getRate = async (req,res,next)=>{
    try {
        const id = req.params.id
        const user_id = req.userId
        const data = await Review.find({userId:user_id});
        res.status(200).send({success:true,sp_id:id,data:data });
    } catch (error) {
        res.status(500).send({success:false, msg:error.message});
    }
};
// add review
const review = async(req,res,next)=>{
    try {
        const id = req.userId
        const userData = await User.findOne({_id:id})
        const data = new Review({
            rate:req.body.rate,
            comment:req.body.comment,
            sp_id:req.body.sp_id,
            userId:id,
            username:userData.username
        })
        const review = await data.save();
        res.status(200).send({success:true,message:"success your review has been inserted" });
    } catch (error) {
        res.status(500).send({success:false, msg:error.message});
    }
};
module.exports = {
    createNewUser,
    verifyMail,
    postSignin,
    logout,
    update_password,
    getUserProfile,
    editUserProfile,
    deleteUserAccount,
    sendVerificationLink,
    createOrder,
    getPayment,
    postPayment,
    addToCart,
    getCart,
    Search,
    forgotPassword,
    verifyPassResetCode,
    resetPassword,
    getRate,
    review
    
}