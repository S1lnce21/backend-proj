import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

let posts: Post[] = [];
let nextPostId = 1;

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const postsWithAuthor = posts.map(post => ({
      ...post,
      author: {
        id: post.authorId,
        username: post.authorId === req.user?.userId ? "testuser" : "user"
      }
    }));
    res.json({ posts: postsWithAuthor });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении постов" });
  }
});

router.get("/my", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const userPosts = posts
      .filter(post => post.authorId === req.user!.userId)
      .map(post => ({
        ...post,
        author: {
          id: post.authorId,
          username: "testuser"
        }
      }));
    
    res.json({ posts: userPosts });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении постов" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID поста" });
    }

    const post = posts.find(p => p.id === id);
    if (!post) {
      return res.status(404).json({ error: "Пост не найден" });
    }

    res.json({
      post: {
        ...post,
        author: {
          id: post.authorId,
          username: post.authorId === req.user?.userId ? "testuser" : "user"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении поста" });
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

    const newPost: Post = {
      id: nextPostId++,
      title,
      content: content || "",
      authorId: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    posts.push(newPost);
    console.log(`✅ Пост создан: ${newPost.title} (ID: ${newPost.id})`);
    
    res.status(201).json({ 
      post: {
        ...newPost,
        author: {
          id: req.user.userId,
          username: "testuser"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при создании поста" });
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

    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Пост не найден" });
    }

    if (posts[postIndex].authorId !== req.user.userId) {
      return res.status(403).json({ error: "Нет прав на редактирование" });
    }

    const { title, content } = req.body;
    
    if (title) posts[postIndex].title = title;
    if (content) posts[postIndex].content = content;
    posts[postIndex].updatedAt = new Date();

    res.json({
      post: {
        ...posts[postIndex],
        author: {
          id: posts[postIndex].authorId,
          username: "testuser"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при обновлении поста" });
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

    const postIndex = posts.findIndex(p => p.id === id);
    if (postIndex === -1) {
      return res.status(404).json({ error: "Пост не найден" });
    }

    if (posts[postIndex].authorId !== req.user.userId) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    posts.splice(postIndex, 1);
    console.log(`🗑️ Пост удален (ID: ${id})`);
    
    res.json({ message: "Пост успешно удален" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении поста" });
  }
});

export default router;