import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";
import { io } from "../index";

interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

const getUsernameById = (userId: number): string => {
  const user = (global as any).usersForPosts?.find((u: any) => u.id === userId);
  return user?.username || `user_${userId}`;
};

const getUserRoleById = (userId: number): string => {
  const user = (global as any).usersForPosts?.find((u: any) => u.id === userId);
  return user?.role || 'user';
};

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
        username: getUsernameById(post.authorId),
        role: getUserRoleById(post.authorId)
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
          username: getUsernameById(post.authorId),
          role: getUserRoleById(post.authorId)
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
          username: getUsernameById(post.authorId),
          role: getUserRoleById(post.authorId)
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
    
    const postWithAuthor = {
      ...newPost,
      author: {
        id: req.user.userId,
        username: getUsernameById(req.user.userId),
        role: req.user.role
      }
    };
    
    io.emit('post_created', postWithAuthor);
    
    res.status(201).json({ post: postWithAuthor });
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

    const post = posts[postIndex];
    const isAuthor = post.authorId === req.user.userId;
    const isModerator = req.user.role === 'moderator';
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isModerator && !isAdmin) {
      return res.status(403).json({ error: "Нет прав на редактирование" });
    }

    const { title, content } = req.body;
    
    if (title) posts[postIndex].title = title;
    if (content) posts[postIndex].content = content;
    posts[postIndex].updatedAt = new Date();

    const updatedPost = {
      ...posts[postIndex],
      author: {
        id: posts[postIndex].authorId,
        username: getUsernameById(posts[postIndex].authorId),
        role: getUserRoleById(posts[postIndex].authorId)
      }
    };
    
    io.emit('post_updated', updatedPost);

    res.json({ post: updatedPost });
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

    const post = posts[postIndex];
    const isAuthor = post.authorId === req.user.userId;
    const isModerator = req.user.role === 'moderator';
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isModerator && !isAdmin) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    const deletedPost = posts[postIndex];
    posts.splice(postIndex, 1);
    
    io.emit('post_deleted', { id });
    
    const deletedBy = isAdmin ? 'администратором' : (isModerator ? 'модератором' : 'автором');
    console.log(`🗑️ Пост удален ${deletedBy}: ${deletedPost.title} (ID: ${id})`);
    
    res.json({ message: "Пост успешно удален" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении поста" });
  }
});

export default router;