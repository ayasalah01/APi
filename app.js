
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const dotenv = require('dotenv').config;
const mongoose = require("mongoose");

//const DB_URL = "mongodb://127.0.0.1/mydatabase";


const DB_URL = "mongodb+srv://as2461:9yOin73KLZPzRHXj@mtgy.acvqmrs.mongodb.net/mydatabase?retryWrites=true&w=majority";


const userRouter = require('./routes/userRouter')
const SPRouter = require("./routes/spRoute")



mongoose.connect(DB_URL,{useNewUrlParser:true,useUnifiedTopology: true,}).then(()=>{
    console.log("connected to database");
})  
const app = express();

app.use(morgan("dev"));
app.use(bodyParser.json());
app.use('/image', express.static('./public/userImages'));

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    );
    if (req.method === "OPTIONS") {
        res.header("Access-Control-Allow-Methods", "PUT, POST, PATCH, DELETE, GET");
        return res.status(200).json({});
    }
    next();
});



app.use("/",userRouter);
app.use("/",SPRouter);

app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
    console.log(error)
});

app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
        message: error.message
        }
    });
});

var port = process.env.PORT || 3000
app.listen(3000, ()=>{
    console.log('connected to server')
})
