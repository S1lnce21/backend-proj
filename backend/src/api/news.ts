import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";

interface News {
  id: number;
  title: string;
  content: string;
  authorId: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Хранилище новостей в памяти
let news: News[] = [];
let nextNewsId = 1;

const router = express.Router();

// Все маршруты требуют авторизации
router.use(authenticateToken);

// GET /api/news - получить все новости
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const newsWithAuthor = news.map(item => ({
      ...item,
      author: {
        id: item.authorId,
        username: item.authorId === req.user?.userId ? "sloy" : "testuser"
      }
    }));
    res.json({ news: newsWithAuthor });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении новостей" });
  }
});

// GET /api/news/:id - получить новость по ID
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID новости" });
    }

    const newsItem = news.find(n => n.id === id);
    if (!newsItem) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    res.json({
      news: {
        ...newsItem,
        author: {
          id: newsItem.authorId,
          username: newsItem.authorId === req.user?.userId ? "sloy" : "testuser"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении новости" });
  }
});

// POST /api/news - создать новость
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const { title, content, imageUrl } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: "Заголовок и содержание обязательны" });
    }

    const newNews: News = {
      id: nextNewsId++,
      title,
      content,
      imageUrl: imageUrl || "",
      authorId: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    news.push(newNews);
    console.log(`✅ Новость создана: ${newNews.title} (ID: ${newNews.id})`);
    
    res.status(201).json({ 
      news: {
        ...newNews,
        author: {
          id: req.user.userId,
          username: "sloy"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при создании новости" });
  }
});

// PUT /api/news/:id - обновить новость
router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID новости" });
    }

    const newsIndex = news.findIndex(n => n.id === id);
    if (newsIndex === -1) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    if (news[newsIndex].authorId !== req.user.userId) {
      return res.status(403).json({ error: "Нет прав на редактирование" });
    }

    const { title, content, imageUrl } = req.body;
    
    if (title) news[newsIndex].title = title;
    if (content) news[newsIndex].content = content;
    if (imageUrl !== undefined) news[newsIndex].imageUrl = imageUrl;
    news[newsIndex].updatedAt = new Date();

    res.json({
      news: {
        ...news[newsIndex],
        author: {
          id: news[newsIndex].authorId,
          username: "sloy"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при обновлении новости" });
  }
});

// DELETE /api/news/:id - удалить новость
router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID новости" });
    }

    const newsIndex = news.findIndex(n => n.id === id);
    if (newsIndex === -1) {
      return res.status(404).json({ error: "Новость не найдена" });
    }

    if (news[newsIndex].authorId !== req.user.userId) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    news.splice(newsIndex, 1);
    console.log(`🗑️ Новость удалена (ID: ${id})`);
    
    res.json({ message: "Новость успешно удалена" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении новости" });
  }
});

export default router;