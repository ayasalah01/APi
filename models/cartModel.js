
const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    service:{
        type:String,
        ref:"service"
    },
    amount:{
        type:Number,
        default:1
    },
    price:{
        type:Number,
        ref:"service"
    },
    category:{
        type:String,
        ref:"service"
    },
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

module.exports= mongoose.model("cart",cartSchema);
