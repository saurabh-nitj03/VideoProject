import { Router } from "express";
import { publishVideo,getVideoById, updateVideo, deleteVideo, togglePublishStatus, getAllVideos } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.js";
import { verifyJwt } from "../middlewares/auth.js";

const router=Router();
router.route('/').get(getAllVideos)
router.route("/publish").post(verifyJwt,upload.fields([
    {
        name:"videoFile",
        maxCount:1
    },
    {
        name:"thumbnail",
        maxCount:1
    }
]),publishVideo)

router.route("/:videoId")
      .get(getVideoById)
      .patch(verifyJwt,upload.single("thumbnail"),updateVideo)
      .delete(verifyJwt,deleteVideo)

router.route("/toggle-publish/:videoId").patch(verifyJwt,togglePublishStatus)      
export default router