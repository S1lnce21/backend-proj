import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from 'http';
import { Server } from 'socket.io';
import authRouter from "./api/auth";
import postsRouter from "./api/posts";
import newsRouter from "./api/news";
import productsRouter from "./api/products";
import { setupChatSocket } from './socket/chatSocket';

const app = express();
const httpServer = http.createServer(app);

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json());
app.use(cookieParser());

// API routes
app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/news", newsRouter);
app.use("/api/products", productsRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ['websocket', 'polling'],
});

setupChatSocket(io);

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`📝 Posts API: http://localhost:${PORT}/api/posts`);
  console.log(`📰 News API: http://localhost:${PORT}/api/news`);
  console.log(`🛍️ Products API: http://localhost:${PORT}/api/products`);
  console.log(`💬 Chat Socket.IO ready on port ${PORT}`);
});