const mongoose = require("mongoose");

const serviceSchema = mongoose.Schema({
    serviceName:{
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
    available_time:{
        type:Time,
    }
    
},
{timestamps:true}
);

module.exports= mongoose.model("service",serviceSchema);