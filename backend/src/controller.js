const uploadAudio = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Please upload an audio file",
            });
        }

        console.log("Audio received:", req.file.originalname);

        return res.status(200).json({
            success: true,
            message: "Audio uploaded successfully",
            file: {
                name: req.file.originalname,
                type: req.file.mimetype,
                size: req.file.size,
            },
        });

    } catch (error) {
        console.error("Audio upload error:", error);

        return res.status(500).json({
            success: false,
            message: "Something went wrong while uploading audio",
        });
    }
};

export default uploadAudio;