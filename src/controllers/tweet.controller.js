import {Tweet} from "../models/tweet.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const addTweet=asyncHandler(async(req,res)=>{
    const {content}=req.body;
    if(!content){
        throw new ApiError(404,"content is required")
    }
    const tweet=await Tweet.create({
        content,
        owner:req.user_id
    })
    if(!tweet){
        throw new ApiError(500,"Internal Server Error");
    }
    return res.status(200)
    .json(new ApiResponse(200,tweet ,"tweet is made"))
})

const updateTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params;
    const tweets = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"Tweet does not exist")
    }
    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(400,"Unauthorisd aupdated of tweet")
    }
    const {content}=req.body;
    if(!content){
        throw new ApiError(404,"content is required")
    }
    const tweet=await Tweet.findByIdAndUpdate(
        tweetId,
        {
            content
        },
        {new :true}
    )
    if(!tweet){
        throw new ApiError(500,"Internal server error while updating tweet")
    }
    return res.status(200)
    .json(200,tweet,"tweet is updated")
})
const deleteTweet=asyncHandler(async(req,res)=>{
    const {tweetId}=req.params;
    const tweet = await Tweet.findById(tweetId);
    if(!tweet){
        throw new ApiError(404,"Tweet does not exist")
    }
    if(!tweet.owner.equals(req.user._id)){
        throw new ApiError(400,"Unauthorisd aupdated of tweet")
    }
    await Tweet.findByIdAndDelete(tweetId)
    return res.status(200)
    .json(200,{},"tweet is deleted")
})

const getUserTweets=asyncHandler(async(req,res)=>{
    const {page=1,limit=10} =req.query;
    const pageNumber=parseInt(page,10);
    const pageLimit=parseInt(limit,10);

    const userId=req.params;
    const tweets=await Tweet.aggregate([
        {
            $match:{
                owner:userId
            }
        },{
            $skip:(pageNumber-1)*pageLimit
        },
        {
            $limit:pageLimit
        }
    ]).aggregatePaginate(pageNumber,pageLimit)
    if(!tweets){
        throw new ApiError(404,"No tweets retrieved")
    }
    return res.status(200)
    .json(200,tweets,"Tweets are accessed")
})
export{
    addTweet,
    updateTweet,
    deleteTweet,
    getUserTweets
}