
import dotenv from 'dotenv'

import express from "express"
import connectDB from "./db/index.js";

dotenv.config({
    path:'./env'
})

connectDB();
const app=express();

// ( async ()=>{
//    try{
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//     app.on("error",()=>{
//         console.log("ERR:",error);
//         throw error;
//     })

//     app.listen(process.env.PORT,()=>{
//         console.log(`App is listening at ${process.env.PORT}`);
//     })
//    }catch(err){
//     console.log("ERROR",err);
//     throw err;
//    }
// })()