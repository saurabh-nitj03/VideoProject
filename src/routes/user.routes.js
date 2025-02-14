import { Router } from "express";
import { changePassword, getCurrentUser, getUserChannelProfile, getwatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJwt } from "../middlewares/auth.js";

const router=Router()
router.route('/register').post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
]),registerUser)
// router.route("/login",)
router.route('/login').post(loginUser);

router.route("/logout").post(verifyJwt,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJwt,changePassword)
router.route("/current-user").post(verifyJwt,getCurrentUser)
router.route("/update-account").patch(verifyJwt,updateAccountDetails)
router.route("/avatar").patch(verifyJwt,upload.single("avatar"),updateUserAvatar)
router.route("/cover-image").patch(verifyJwt,upload.single("coverImage"),updateUserCoverImage)

router.route("/c/:username").get(verifyJwt,getUserChannelProfile)
router.route("/history").get(verifyJwt,getwatchHistory)


export default router