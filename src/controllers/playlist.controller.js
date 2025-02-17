import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Playlist } from "../models/playlist.models.js";
import { Video } from "../models/video.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPlaylist=asyncHandler(async(req,res)=>{
    const {name,description} =req.body;
    if(!name || !description){
        throw new ApiError("401","name and description is required")
    }
    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user._id
    })
    if(!playlist){
        throw new ApiError(500,"Server error while creating playlists")
    }
    return res.status(200)
    .json(new ApiResponse(200,playlist,"playlist is created"))
})

const getUserPlaylists=asyncHandler(async(req,res)=>{
    const {userId}=req.params;
    const playlists=await Playlist.aggregate([
        {
            $match:{
                owner:userId
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videoDetails",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                               { 
                                    $project:{
                                    username:1,
                                    fullname:1,
                                    avatar:1
                                    }
                               }
                            ]
                        }
                    }
                ]
            }
        },
        {
            // depends upon requirements
            // $project:{
            //     title:1,
            //     description:1,
            //     videoDetails:{
            //         title:1,
            //         description:1,
            //         thumbnail:1,
            //         "owner.username":1,
            //         "owner.fullname":1,
            //         "owner.avatar":1,
            //     }
            // }
        }
    ])

    if (playlists.length === 0) {
        return res.status(404).json({ message: "No playlists found for this user." });
      }
  
      return res.status(200)
      .json(new ApiResponse(200,playlists,"playlist is generated"));
})

const getUserPlaylistsById=asyncHandler(async(req,res)=>{
    const {playlistId}=req.params;

    if(!playlistId){
        throw new ApiError(402,"Playlist is required")
    }
    const playlists= await Playlist.aggregate([
        {
            $match:{
                _id:playlistId
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videoDetails",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                               { 
                                    $project:{
                                    username:1,
                                    fullname:1,
                                    avatar:1
                                    }
                               }
                            ]
                        }
                    }
                ]
            }
        },
        // {
            // depends upon requirements
            // $project:{
            //     title:1,
            //     description:1,
            //     videoDetails:{
            //         title:1,
            //         description:1,
            //         thumbnail:1,
            //         "owner.username":1,
            //         "owner.fullname":1,
            //         "owner.avatar":1,
            //     }
            // }
        // }
    ])
    if (playlists.length === 0) {
        return res.status(404).json({ message: "No playlists found for this user." });
      }
  
      return res.status(200)
      .json(new ApiResponse(200,playlists,"playlist is generated"));
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist doesnot exist")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"Unauthorised Access")
    }
    playlist.videos.push(videoId);
   await playlist.save({validateBeforeSave:false})
   return res.status(200)
   .json(new ApiResponse(200,{},"video is added to playlist"))
})

const removeVideoFromPlaylist=asyncHandler(async(req,res)=>{
    const {playlistId,videoId}=req.params;
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist doesnot exist")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"Unauthorised Access")
    }
    playlist.videos.pull(videoId);
   await playlist.save({validateBeforeSave:false})
   return res.status(200)
   .json(new ApiResponse(200,{},"video is deleted to playlist"))

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist doesnot exist")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"Unauthorised Access")
    }
    await Playlist.findByIdAndDelete(playlistId);
    return res.status(200)
    .json(new ApiResponse(200,{},"playlist is deleted"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const playlist=await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist doesnot exist")
    }
    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(403,"Unauthorised Access")
    }
    const {name, description} = req.body
     if(!name|| !description){
        throw new ApiError(404,"Name and description is required")
     }
     const playlistUpdated=await Playlist.findByIdAndUpdate(
        playlistId,
        {
            name,
            description
        },
        {new : true}
     )
     return res.status(200)
     .json(new ApiResponse(200,playlistUpdated,"Playlist is updated"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getUserPlaylistsById,
    deletePlaylist,
    updatePlaylist,
    removeVideoFromPlaylist,
    addVideoToPlaylist
}