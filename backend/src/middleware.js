import multer from "multer";
import path from "path";

const allowedExtensions = [
    ".mp3",
    ".wav",
    ".m4a",
    ".aac",
    ".ogg",
    ".webm",
    ".flac",
];

const allowedMimePrefixes = [
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "audio/x-wav",
    "audio/x-m4a",
    "audio/aac",
    "audio/ogg",
    "audio/webm",
    "audio/flac",
];

const upload = multer({
    storage: multer.memoryStorage(),

    fileFilter: (req, file, cb) => {
        try {
            const ext = path.extname(file.originalname).toLowerCase();
            const mime = file.mimetype.toLowerCase();

            const isExtValid = allowedExtensions.includes(ext);
            const isMimeValid = allowedMimePrefixes.some((prefix) => mime.startsWith(prefix));

            if (!isExtValid && !isMimeValid) {
                return cb(new Error("Invalid audio format. Allowed: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC"));
            }

            cb(null, true);
        } catch (error) {
            cb(error);
        }
    },

    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB limit required by brief
    },
});

export default upload;