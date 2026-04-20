import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";
import { notificationService } from "../services/notificationService";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    const notifications = notificationService.getNotifications(req.user.userId);
    const unreadCount = notificationService.getUnreadCount(req.user.userId);
    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении уведомлений" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    const { title, message, type } = req.body;
    const notification = notificationService.addNotification(req.user.userId, title, message, type);
    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при создании уведомления" });
  }
});

router.put("/:id/read", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    const id = req.params.id as string;
    const success = notificationService.markAsRead(req.user.userId, id);
    if (success) {
      res.json({ message: "Уведомление отмечено как прочитанное" });
    } else {
      res.status(404).json({ error: "Уведомление не найдено" });
    }
  } catch (error) {
    res.status(500).json({ error: "Ошибка при обновлении уведомления" });
  }
});

router.put("/read-all", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    notificationService.markAllAsRead(req.user.userId);
    res.json({ message: "Все уведомления отмечены как прочитанные" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при обновлении уведомлений" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    const id = req.params.id as string;
    const success = notificationService.deleteNotification(req.user.userId, id);
    if (success) {
      res.json({ message: "Уведомление удалено" });
    } else {
      res.status(404).json({ error: "Уведомление не найдено" });
    }
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении уведомления" });
  }
});

router.delete("/clear-all", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    notificationService.deleteAll(req.user.userId);
    res.json({ message: "Все уведомления удалены" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении уведомлений" });
  }
});

export default router;