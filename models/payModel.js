const mongoose = require("mongoose");

const paySchema = mongoose.Schema({
    sp_id:{
        type:String,
        required:true,
        ref:"serviceProvider",
        
    },
    userId:{
        type:String,
        required:[true,'user id is required'],
        ref:"user"
    },
    service:{
        type:String,
        ref:"service"
    },
    price:{
        type:Number,
        ref:"service"
    },
    image:{
        type:String,
        required:true  
    }
},
{timestamps:true}
);
module.exports = mongoose.model("pay",paySchema);

