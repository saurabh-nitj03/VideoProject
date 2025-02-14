import mongoose from "mongoose";
import {User} from "../models/user.models.js"
import { Video } from "../models/video.models.js";
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadCloudinary} from "../utils/cloudinary.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const isOwner =  (video, userId)=>{
     return video.owner.equals(userId)
}
const publishVideo= asyncHandler(async(req,res)=>{
    const {title, description} =req.body;
    if(!title || !description) {
        throw new ApiError(400," Title and description both is required ");
    }

    const videoLocalFile=req.files?.videoFile?.[0]?.path;
    const thumbnailLocalFile=req.files?.thumbnail?.[0]?.path

    if(!videoLocalFile || !thumbnailLocalFile){
        throw new ApiError(400,"Video File and thumbnail both is required")
    }

    const videoFile = await uploadCloudinary(videoLocalFile);
    const thumbnail = await uploadCloudinary(thumbnailLocalFile);

    if(!videoFile || !thumbnail){
        throw new ApiError(500,"Inetrnal server error while uploading")
    }

    const video=await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile?.duration,
        owner:req.user._id
    })

    if(!video){
        throw new ApiError(500,"Error while uploading video")
    }

    return res.status(200).json(new ApiResponse(200,video,"video published successfully"))
})
 
const getVideoById=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!videoId){
        throw new ApiError(401,"video id is required")
    }
    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(400,"either video doesnot exist or wrong id")
    }
    return res.status(200)
    .json(new ApiResponse(200,video,"Video fetched successfully"))
})

const updateVideo = asyncHandler(async(req,res)=>{
    const {videoId} = req.params;
    if(!videoId) throw new ApiError(401,"video id is required")

    const userId=req.user._id;
    const video =await Video.findById(videoId);

    if(!video){
        throw new ApiError(400,"Video not found")
    }
    if(!isOwner(video,userId)){
        throw new ApiError(401,"You are not the owner of video")
    }
    const {title,description} =req.body;

    if(!title) throw new ApiError(400, "title is required");
    if(!description) throw new ApiError(400, "description is required");

    const thumbnailLocalFile=req.file?.path;
    if(!thumbnailLocalFile){
        throw new ApiError(400,"thhumbnail is required");
    }
    const thumbnail=await uploadCloudinary(thumbnailLocalFile);

    const videoUpdated=await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                title,
                thumbnail:thumbnail.url,
                description
            }
        },
        {new:true}
   );

   if(!video){
    throw new ApiError(500,"server error while updating video")
   }
   return res.status(200)
   .json(new ApiResponse(200,videoUpdated,"Video updated successfully"))

})

const deleteVideo=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const {userId}=req.user._id;

    if(!videoId) throw new ApiError(404, "video Id is required");

    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(!isOwner(video,userId)){
        throw new ApiError(400,"You are not the owner of video")
    }
    await Video.findByIdAndDelete(videoId);
    res.status(200).json(new ApiResponse(200,{},"Video Deleted"))
}) 

const togglePublishStatus=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    const userId=req.user._id;
    if(!videoId) throw new ApiError(404, "video Id is required");

    const video=await Video.findById(videoId);
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    if(!isOwner(video,userId)){
        throw new ApiError(400,"You are not the owner of video")
    }
    const published=video.isPublished;
     await Video.findByIdAndUpdate(
        videoId,
        {
            $set:{
                isPublished:!published
            }
        },
        {new :true}
    )
    return res.status(200)
    .json(new ApiResponse(200,{},"Published is toggled"))
    
})

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query;

    // Convert pagination values to numbers
    const pageNumber = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);
    
    // Handle invalid pagination parameters
    if (isNaN(pageNumber) || pageNumber <= 0) {
        throw new ApiError(400,"Invalid page number")
    }
    if (isNaN(pageLimit) || pageLimit <= 0) {
        throw new ApiError(400,"Invalid limit number")
    }

    // Set up the query filter object
    const filter = {};

    // If `userId` is provided, filter by the video owner
    if (userId) {
        filter.owner = userId;
    }

    // If a search query is provided, filter based on title or description
    if (query) {
        filter.$or = [
            { title: { $regex: query, $options: 'i' } }, // Case-insensitive search on title
            { description: { $regex: query, $options: 'i' } } // Case-insensitive search on description
        ];
    }

    // Build sort object
    const sort = {};
    if (sortBy) {
        sort[sortBy] = sortType === 'asc' ? 1 : -1; // 1 for ascending, -1 for descending
    }

    // Get the videos with pagination, filtering, and sorting
    // const videos = await Video.find(filter)
    //     .skip((pageNumber - 1) * pageLimit) // Pagination skip
    //     .limit(pageLimit) // Limit the number of videos per page
    //     .sort(sort); // Sorting
    const videos = await Video.find(filter)
        .sort(sort)// Sorting
        .skip((pageNumber - 1) * pageLimit) // Pagination skip
        .limit(pageLimit) // Limit the number of videos per page

    // Count total videos to calculate total pages
    const totalVideos = await Video.countDocuments(filter);
    const totalPages = Math.ceil(totalVideos / pageLimit);

    // Return the response with videos and pagination info
    res.status(200).json({
        page: pageNumber,
        totalPages,
        totalVideos,
        videos
    });
});

export {
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus,
    getAllVideos
}