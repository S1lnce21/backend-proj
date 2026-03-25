import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./api/auth";
import postsRouter from "./api/posts";
import newsRouter from "./api/news";
import productsRouter from "./api/products";

const app = express();

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/news", newsRouter);
app.use("/api/products", productsRouter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok!!!!!!" });
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Posts API: http://localhost:${PORT}/api/posts`);
  console.log(`📰 News API: http://localhost:${PORT}/api/news`);
  console.log(`🛍️ Products API: http://localhost:${PORT}/api/products`);
});