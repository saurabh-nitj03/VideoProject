import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Comment} from "../models/comment.models.js"
import {User} from "../models/user.models.js"


const isOwner =  (comment, userId)=>{
    return comment.owner.equals(userId)
}
const addComment=asyncHandler(async(req,res)=>{
    const {content}=req.body;
    if(!content){
        throw new ApiError(401,"content is required")
    }
    const {videoId}=req.params;
    if(!videoId){
        throw new ApiError(401,"video id is required")
    }
    const comment=await Comment.create({
        content,
        video:videoId,
        owner:req.user?._id
    })
    return res.status(200)
    .json(new ApiResponse(200,comment,"Comment is created"))
})

const updateComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    const comment = await Comment.findById(commentId);
    if(!isOwner(comment,req.user._id)){
        throw new ApiError(401,"Unauthorised access to update comment")
    }
    const {content}=req.body;
    if(!content){
        throw new ApiError(400,"content is required")
    }
    const updatedComment=await Comment.findByIdAndUpdate(
        commentId,
        {
            content
        },
        {new : true}
    )
    if(!updatedComment){
        throw new ApiError(500,"Server error while updating comment")
    }
    return res.status(200)
    .json(new ApiResponse(200,updatedComment,"Comment is updated"))
})

const deleteComment=asyncHandler(async(req,res)=>{
    const {commentId}=req.params;
    
    const comment = await Comment.findById(commentId);
    if(!isOwner(comment,req.user._id)){
        throw new ApiError(401,"Unauthorised access to delete comment")
    }

    await Comment.findByIdAndDelete(commentId);
    return res.status(200)
    .json(new ApiResponse(200,{},"Comment is deleted"))

})

const getVideoComments=asyncHandler(async(req,res)=>{
    const {videoId}=req.params;
    if(!videoId){
        throw new ApiError(401,"video id is required")
    }
    const {page=1,limit=10} =req.query;

    const pageNumber=parseInt(page,10);
    const pageLimit=parseInt(limit,10);
    // const comment=await Comment.aggregate([
    //     {
    //         $match:{
    //             video:videoId
    //         }
    //     }
    // ]).skip((pageNumber-1)*pageLimit)
    // .limit(pageLimit)

    const comment = await Comment.aggregate([
        {
            $match:{
                video:videoId
            }
        },
        {
            $skip:(pageNumber-1)*pageLimit
        },
        {
            $limit:pageLimit
        }
    ]).aggregatePaginate(pageNumber,pageLimit)
    
    // const totalCount=await Comment.countDocuments({video:videoId})
    // const pageCount=Math.ceil(totalCount/pageLimit)
    // return res.status(200)
    // .json(new ApiResponse(200,{
    //     comment,
    //     page:pageNumber,
    //     totalCount,
    //     pageCount
    // },"Comment are accessed"));
    return res.status(200)
    .json(new ApiResponse(200,
        comment
    ,"Comment are accessed"));
})

export {
    getVideoComments,
    updateComment,
    addComment,
    deleteComment
}