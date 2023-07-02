const mongoose = require("mongoose");

const paySchema = mongoose.Schema({
    userId:{
        type:String,
        required:[true,'user id is required'],
        ref:"user"
    },
    image:{
        type:String,
        required:true  
    }
},
{timestamps:true}
);
module.exports = mongoose.model("pay",paySchema);

