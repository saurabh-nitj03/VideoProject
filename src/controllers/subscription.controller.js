import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Subscription} from "../models/subscription.models.js"

const toggleSubscription=asyncHandler(async(req,res)=>{
    const {channelId}=req.params;
   const subs= await Subscription.findOne({
       channel: channelId,
       subscriber:req.user._id
    })
    if(!subs){
        const s=await Subscription.create({
            channel:channelId,
            subscriber:req.user._id
        })
        return res.status(200)
        .json(new ApiResponse(200,s,"user subscribed to this channnel"))
    }
    await Subscription.findByIdAndDelete(subs._id);
    return res.status(200)
    .json(new ApiResponse(200,{},"user unsubscribe the channel"))
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:channelId
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscribers",
                pipeline:[
                    {
                        $project:{
                            fullname: 1,
                            username: 1,
                            email: 1,
                        }
                    }
                ]
            }
        },

    ])
    if(!subscribers || subscribers.length === 0){
        throw new ApiError(400,"no subscribers")
    }
    return res.status(200)
    .json(new ApiResponse(200,subscribers,"lsit of subscribers is fetched"))
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const subscribedTo=await Subscription.aggregate([
        {
            $match:{
                subscriber:subscriberId
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"subscribedTo",
                pipeline:[
                    {
                        $project:{
                            fullname: 1,
                            username: 1,
                            email: 1,
                        }
                    }
                ]
            }
        },
    ])
    if(!subscribedTo || subscribedTo.length === 0){
        throw new ApiError(400,"No channels subscribed")
    }
    return res.status(200)
    .json(new ApiResponse(200,subscribedTo,"lsit of subscribed channels is fetched"))
})

export{
    toggleSubscription,
    getSubscribedChannels,
    getUserChannelSubscribers
}