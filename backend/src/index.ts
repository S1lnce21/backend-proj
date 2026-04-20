import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from 'http';
import { Server } from 'socket.io';
import authRouter from "./api/auth";
import postsRouter from "./api/posts";
import newsRouter from "./api/news";
import productsRouter from "./api/products";
import notificationsRouter from "./api/notifications";
import { setupChatSocket } from './socket/chatSocket';
import { notificationService } from './services/notificationService';

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST"],
  },
  transports: ['websocket', 'polling'],
});

notificationService.setIo(io);

setupChatSocket(io);

io.on('connection', (socket) => {
  console.log('🔔 Пользователь подключен к уведомлениям:', socket.id);
  
  socket.on('join-notifications', (userId: number) => {
    socket.join(`user_${userId}`);
    console.log(`📢 Пользователь ${userId} подписан на уведомления`);
  });
  
  socket.on('disconnect', () => {
    console.log('🔔 Пользователь отключен от уведомлений:', socket.id);
  });
});

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/posts", postsRouter);
app.use("/api/news", newsRouter);
app.use("/api/products", productsRouter);
app.use("/api/notifications", notificationsRouter);

app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`💬 Chat Socket.IO ready`);
  console.log(`🔔 Notifications Socket.IO ready`);
});