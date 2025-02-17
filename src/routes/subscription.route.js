import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router=Router();

router.use(verifyJwt);
router.route("/c/:channelId")
      .get(getUserChannelSubscribers)
      .post(toggleSubscription)
router.route("/u/:subscriberId").get(getSubscribedChannels)      

export default router
    