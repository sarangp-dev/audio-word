import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./router.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/app", router);

app.get("/", (req, res) => {
    res.json({
        message: "Backend is running",
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});