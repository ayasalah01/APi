
const mongoose = require("mongoose");

const serviceProviderSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    serviceName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique: true, 
        match: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/
    },
    Address:{
        type:String,
        required:true
    },
    phoneNumber:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    passwordResetCode: String,
    passwordResetVerified: Boolean,
    category:{
        type:String,
        required:true,
        enum:["Hotel","Cinema","Bazaar","Village & Resort ","Tourism Company","Restaurant & Cafe","Transport company"]
    },
    image:{
        type:String,
    },
    is_varified:{
        type:Number,
        default:0
    },
    token:{
        type:String,
        default:""
    }
},
{timestamps:true}
);

module.exports = mongoose.model("serviceProvider",serviceProviderSchema);
mongoose.set('strictQuery',false)

