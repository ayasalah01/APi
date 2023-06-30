const mongoose = require("mongoose");

const naturalSchema = mongoose.Schema({
    serviceName:{
        type:String,
        required:true
    },
    Address:{
        type:String,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    About:{
        type:String,
        required:true
    },
    available_day:{
        type:String,
    },
    available_time:{
        type:String,
        required:true
    },
    category:{
        type:String,
    }
    
},
{timestamps:true}
);

module.exports= mongoose.model("natural",naturalSchema);