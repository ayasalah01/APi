
const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email:{
        type:String,
        required:true,
        unique: true,
    }, 
    username:{
        type:String,
        required:true,
        unique: true,
    },
    phoneNumber:{
        type:String,
        required:true,
        unique: true,
    },
    password:{
        type:String,
        required:true
    },
    passwordResetCode: String,
    passwordResetVerified: Boolean,
    location:{
        type:String,
        default:"Fayoum"
    },
    is_admin:{
        type:Number,
        required:true
    },
    is_varified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:''
    }
    
},
{timestamps:true}
);

module.exports = mongoose.model("user",userSchema);

mongoose.set('strictQuery',false)

