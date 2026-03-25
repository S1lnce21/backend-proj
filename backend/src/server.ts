import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./api/auth";
import postsRouter from "./api/posts";

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ 
  origin: "http://localhost:5173", 
  credentials: true
}));

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok!!!!!!" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});