
import dotenv from 'dotenv'
import { app } from './app.js';
import connectDB from "./db/index.js";

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.on("error",()=>{
        console.log("ERR:",error);
        throw error;
    })
    app.listen(process.env.PORT || 3000 ,()=>{
        console.log(`server is running at ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("MongoDb connection failed",err);
})

// app.get("/",(req,res)=>{
//     res.send("ok");
// })
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