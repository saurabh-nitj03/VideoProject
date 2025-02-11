import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import { uploadCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser= asyncHandler(async(req,res)=>{

    // 1. get user detail from frontend
    // 2. validation - not empty
    // 3. check if user already exists : username or email
    // 4. check for images and avatar
    // 5. upload file on cloudinary and url as response.url , avatar check upload on cloudinary
    // 6. create user object and save in db
    // 7. remove password and refresh token field from res 
    // 8. check for user creation
    // 9. return res

    const {username,fullname,email,password}=req.body;
    // console.log(username);
    // console.log(email);
    // console.log(password);
    
    // if(fullname === ""){
        //     throw new ApiError(400, "full name is required")
        // }
        
        if(
            [fullname,username,email,password].some((field)=> field?.trim === "")
        ) {
            throw new ApiError(400,"All feilds are required")
        }
        
    const existedUser =  await User.findOne({$or: [{username},{email}]});

    if(existedUser){
        throw new ApiError(409,"User already existed with this username and email")
    }

    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    // console.log(avatarLocalPath)

    if(!avatarLocalPath){
        throw new ApiError(400, " Avatar image is required")
    }

    const avatar = await uploadCloudinary(avatarLocalPath)
    const coverImage = await uploadCloudinary(coverImageLocalPath)
    // console.log(avatar)
    if(!avatar){
        throw new ApiError(400," avatar file is not uploaded")
    }

    const user = await User.create({
        username:username.toLowerCase(),
        fullname,
        email,
        password,
        avatar:avatar.url,
        coverImage: coverImage ?.url || "",

    })
    // console.log(user);
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    if(!createdUser) throw new ApiError(500, "something went wrong while registring user")
    return res.status(201).json(new ApiResponse(200,createdUser,"User  registererd Successfully"))
})
export {registerUser}