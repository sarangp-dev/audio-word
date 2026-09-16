import express from "express";
import upload from "./middleware.js";
import uploadAudio from "./controller.js";

const router = express.Router();

router.post(
    "/upload",
    upload.single("audio"),
    uploadAudio
);

export default router;