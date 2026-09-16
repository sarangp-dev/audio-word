import multer from "multer";
import path from "path";

const allowed = [
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".webm",
    ".flac",
];

const upload = multer({
    storage: multer.memoryStorage(),

    fileFilter: (req, file, cb) => {
        try {
            const ext = path.extname(file.originalname).toLowerCase();

            if (!allowed.includes(ext)) {
                return cb(new Error("Invalid audio format"));
            }

            cb(null, true);

        } catch (error) {
            cb(error);
        }
    },

    limits: {
        fileSize: 25 * 1024 * 1024,
    },
});

export default upload;