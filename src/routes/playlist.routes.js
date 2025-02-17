import {Router} from "express"
import { verifyJwt } from "../middlewares/auth.js";
import { addVideoToPlaylist, createPlaylist, deletePlaylist, getUserPlaylists, getUserPlaylistsById, removeVideoFromPlaylist, updatePlaylist } from "../controllers/playlist.controller.js";

const router=Router();

router.use(verifyJwt);

router.route("/").post(createPlaylist)
router
     .route("/:playlistId")
     .get(getUserPlaylistsById)
     .patch(updatePlaylist)
     .delete(deletePlaylist)

router.route("/add/:videoId/:playlistId").patch(addVideoToPlaylist)
router.route("/remove/:videoId/:playlistId").patch(removeVideoFromPlaylist)

router.route("/userId/:userId").get(getUserPlaylists)

export default router