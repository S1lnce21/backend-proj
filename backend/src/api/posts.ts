import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { postService } from "../services/postService";

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const posts = await postService.getAllPosts();
    res.json({ posts });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Ошибка при получении постов",
    });
  }
});

router.get("/my", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    const posts = await postService.getUserPosts(req.user.userId);
    res.json({ posts });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Ошибка при получении постов",
    });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID поста" });
    }

    const post = await postService.getPostById(id);
    if (!post) {
      return res.status(404).json({ error: "Пост не найден" });
    }

    res.json({ post });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Ошибка при получении поста",
    });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const { title, content } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Заголовок обязателен" });
    }

    const post = await postService.createPost({
      title,
      content: content || "",
      authorId: req.user.userId,
    });

    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Ошибка при создании поста",
    });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID поста" });
    }

    const { title, content } = req.body;

    if (!title && !content) {
      return res.status(400).json({ error: "Хотя бы одно поле должно быть заполнено" });
    }

    const post = await postService.updatePost(id, { title, content }, req.user.userId);
    res.json({ post });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при обновлении поста";
    if (message === "Пост не найден") {
      return res.status(404).json({ error: message });
    }
    if (message === "У вас нет прав на редактирование этого поста") {
      return res.status(403).json({ error: message });
    }
    res.status(500).json({ error: message });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID поста" });
    }

    await postService.deletePost(id, req.user.userId);
    res.json({ message: "Пост успешно удален" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ошибка при удалении поста";
    if (message === "Пост не найден") {
      return res.status(404).json({ error: message });
    }
    if (message === "У вас нет прав на удаление этого поста") {
      return res.status(403).json({ error: message });
    }
    res.status(500).json({ error: message });
  }
});

export default router;