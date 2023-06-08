const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require("mongoose");
const nodemailer = require('nodemailer');
const randomstring = require('randomstring')

const User = require('../models/userModel');
const Pay = require("../models/payModel");
const Cart = require("../models/cartModel");

const sendMail = require("../utils/sendEmail");
const config = require("../config/config")
const createToken = require("../utils/createToken");
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

// const changepassword = async(req,res,next)=>
// {
//     try {
//         const email = req.body.email;
//         const password = req.body.password;
//         const newpassword = req.body.newpassword;
//         const user = await User.findOne({email:email})
//         const data = await User.findOne({_id:user._id})
//         const passwordMatch = await bcrypt.compare(password,data.password);
//             if (passwordMatch)
//             {
//             const new_password = securePassword(newpassword);
//             const userData = await User.findByIdAndUpdate({ _id:user._id},{ $set:{password: new_password}},{new:true})
//                 res.status(200).send({success:true,msg:"password has been updated"})
                        
//     }
//         else{
//             res.status(500).send({success:false, msg:"you can not update your password"});
//         }
    
//     } catch (error) {
//         res.status(400).send({success:false},error.message);
//     }
// }
// forget password
const forget_password = async(req,res,next)=>{
    try{
        const email = req.body.email
        const userData = await User.findOne({ email:email })
        console.log(userData.email);
        if(userData){
            const randomString = randomstring.generate();
            const Data = await User.updateOne({email:email},{$set:{token:randomString}});
            sendMail.sendResetPasswordMail(userData.email,randomString);
            res.status(200).send({success:true, msg:"Please check your email inbox"})
        }
        else{
            res.status(200).send({success:true, msg:"this email does not exists"})
        }
    }
    catch(error)
    {
        res.status(400).send({success:false, msg:error.message});
    }

}
const reset_password = async(req,res,next)=>{
    try {
        const token = req.query.token;
        const tokenData = await User.findOne({token:token})
        if(tokenData){
            const new_password = req.body.new_password;
            const  hashedPassword = await securePassword(new_password)
            await User.updateOne({ _id:tokenData._id},{$set:{ password:hashedPassword,token:""}});
            res.status(200).send({success:true, msg:"password has been reseted"})
        }
        else{
            res.status(200).send({success:false, msg:"This link has been expired"})
        }
        
    } catch (error) {
        res.status(400).send({success:false, msg:error.message});
    }

}
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

//payment method
const postPayment = async(req,res,next)=>{
    try {
        const pay = new Pay({
            image:req.file.filename
        });
        const data = await pay.save();
        if(data){
            res.status(200).send({success:true,message:"payment process has been successfully "});
        }
        else{
            res.status(200).send({success:true,message:"payment process has been failed please try again "});
        }
    } catch (error) {
        console.log(error.message);
    }
}

//cart
// const cart = async(req,res,next)=>{
//     try {
//         const data = new Cart({
//             service:req.body.service,
//             price:req.body.price
//         })
//         const cart = data.save();
//         res.status(200).send({success:true,cart:cart});
//     } catch (error) {
//         res.status(500).send({success:false,msg:error.message});
//     }
// }

const addToCart = async(req,res,next)=>{
    try {
        //const id = req.userId;
        const data = await new Cart({
            service:req.body.service,
            amount :req.body.amount,
            price:req.body.price,
            category:req.body.category,
            userId:req.userId,
            image:req.body.image

        })
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
module.exports = {
    createNewUser,
    verifyMail,
    postSignin,
    logout,
    update_password,
    forget_password,
    reset_password,
    getUserProfile,
    editUserProfile,
    deleteUserAccount,
    sendVerificationLink,
    postPayment,
    addToCart,
    getCart,
    
}