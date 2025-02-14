import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessTokenAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "something went wrong while genrating access token and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // 1. get user detail from frontend
  // 2. validation - not empty
  // 3. check if user already exists : username or email
  // 4. check for images and avatar
  // 5. upload file on cloudinary and url as response.url , avatar check upload on cloudinary
  // 6. create user object and save in db
  // 7. remove password and refresh token field from res
  // 8. check for user creation
  // 9. return res

  const { username, fullname, email, password } = req.body;
  // console.log(username);
  // console.log(email);
  // console.log(password);

  // if(fullname === ""){
  //     throw new ApiError(400, "full name is required")
  // }

  if (
    [fullname, username, email, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(400, "All feilds are required");
  }

  const existedUser = await User.findOne({ $or: [{ username }, { email }] });

  if (existedUser) {
    throw new ApiError(
      409,
      "User already existed with this username and email"
    );
  }

  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
  // console.log(avatarLocalPath)

  if (!avatarLocalPath) {
    throw new ApiError(400, " Avatar image is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);
  // console.log(avatar)
  if (!avatar) {
    throw new ApiError(400, " avatar file is not uploaded");
  }

  const user = await User.create({
    username: username.toLowerCase(),
    fullname,
    email,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });
  // console.log(user);
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!createdUser)
    throw new ApiError(500, "something went wrong while registring user");
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User  registererd Successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  console.log("Request Body:", req.body);
  /*
     1. get data from req,
     2. username or email,
     3. find user,
     4 . password check
     5. accessToken and refresh Token genretion
     6. send cokkie for user 
      */
  //  const {username,password,email} =req.body;
  const { username, email, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "username or email is required try");
  }

  const user = await User.findOne({ $or: [{ username }, { email }] });
  if (!user) {
    throw new ApiError(
      400,
      "User with this username or email is not present !pls register first"
    );
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password");
  }

  const { accessToken, refreshToken } =
    await generateAccessTokenAndRefreshToken(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in SuccessFully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  //  const user = req.user;
  //  const loggedInUser=await User.findById(user._id);
  //  loggedInUser.refreshToken="";
  //  loggedInUser.save({validateBeforeSave:false});
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged Out "));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, " NO refresh token is present");
  }

  try {
    const decodeToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodeToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid Refresh Token");
    }
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }
    const { accessToken, refreshToken } =
      await generateAccessTokenAndRefreshToken(user._id);
    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "User logged in SuccessFully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh Token");
  }
});

const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "wrong password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password change successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fecthed Successfully"));
});

// const updateAccountDetails=asyncHandler(async(req,res)=>{
//     const {fullname,avatar,coverImage}=req.body;
//     const user=await User.findById(req.user?._id);
//     if(fullname) user.fullname=fullname;

//     const avatarLocalPath=req.files?.avatar?.[0].path;
//     const coverImageLocalPath=req.files?.coverImage?.[0].path;

//     const avatarCloudinary=uploadCloudinary(avatarLocalPath);
//     const coverImageCloudinary=uploadCloudinary(coverImageLocalPath);

//     if(avatarCloudinary)  user.avatar=avatarCloudinary.url;
//     if(coverImageCloudinary)  user.coverImage=coverImageCloudinary.url;

//     await user.save({validateBeforeSave:false});

//     return res.status(200).json(new ApiResponse(200,{},"datails changed successfully"))

// })
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!fullname || !email)
    throw new ApiError(400, "fullname and email is required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullname,
        email,
      },
    },
    { new: true }
  ).select("-password");
  return res
    .status(200)
    .json(new ApiResponse(200, user, "All details updated successfully "));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const { avatarLocalPath } = req.file?.path;

  if (!avatarLocalPath) throw new ApiError(400, "avatar file is required");

  const avatar = await uploadCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "Erorr while uploading in cloudinary");
  }
  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar image is updated"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const { coverImageLocalPathLocalPath } = req.file?.path;

  if (!coverImageLocalPath) throw new ApiError(400, "avatar file is required");

  const coverImage = await uploadCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "Erorr while uploading in cloudinary");
  }
  const user = User.findByIdAndUpdate(
    req,
    user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "avatar image is updated"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username?.trim()) throw new ApiError(400, "username is required");
  // const user = await User.find({username});

  const channel = await User.aggregate([
    {
      $match: {
        username: username,
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        subscribersCount: 1,
        isSubscribed: 1,
        channelSubscribedCount: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel doesnot exist");
  }
  console.log(channel);
  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fecthed successfully")
    );
});

const getwatchHistory = asyncHandler(async (req, res) => {
  const user =
    User.aggregate[
      ({
        $match: {
          _id: new mongoose.Types.ObjectId(req.user._id),
        },
      },
      {
        $lookup: {
          from: "videos",
          localField: "watchHistory",
          foreignField: "_id",
          as: "watchHistory",
          pipeline: [
            {
              $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                  {
                    $project: {
                      fullname: 1,
                      username: 1,
                      avatar: 1,
                    },
                  },
                ],
              },
            },
            {
              $addFields: {
                $first: "$owner",
              },
            },
          ],
        },
      })
    ];
  console.log(user);
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch history fetched successfully"
      )
    );
});
export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changePassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getwatchHistory,
};
