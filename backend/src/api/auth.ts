import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'moderator' | 'user';
  isBanned: boolean;
  createdAt: Date;
}

export let users: User[] = [];
let nextId = 1;

const initTestUsers = async () => {
  if (users.length === 0) {
    const hashedPassword1 = await bcrypt.hash("TestPass123!", 10);
    users.push({
      id: nextId++,
      username: "testuser",
      email: "test@test.com",
      password: hashedPassword1,
      role: 'user',
      isBanned: false,
      createdAt: new Date()
    });
    
    const hashedPassword2 = await bcrypt.hash("AdminPass123!", 10);
    users.push({
      id: nextId++,
      username: "admin",
      email: "admin@test.com",
      password: hashedPassword2,
      role: 'admin',
      isBanned: false,
      createdAt: new Date()
    });
    
    console.log("✅ Тестовые пользователи созданы:");
    console.log("   user: test@test.com / TestPass123! (role: user)");
    console.log("   admin: admin@test.com / AdminPass123! (role: admin)");
  }
};

initTestUsers();

const updateGlobalUsers = () => {
  (global as any).usersForPosts = users;
};

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "Пользователь уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser: User = {
      id: nextId++,
      username,
      email,
      password: hashedPassword,
      role: 'user',
      isBanned: false,
      createdAt: new Date()
    };
    
    users.push(newUser);
    updateGlobalUsers();
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email, role: newUser.role, isBanned: newUser.isBanned, username: newUser.username },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(200).json({ user: userWithoutPassword, token });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Ошибка регистрации" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: "Пользователь не найден" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "Ваш аккаунт заблокирован. Обратитесь к администратору." });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Неверный пароль" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, isBanned: user.isBanned, username: user.username },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword, token });
  } catch (e) {
    res.status(400).json({ error: e instanceof Error ? e.message : "Ошибка входа" });
  }
});

router.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key") as {
      userId: number;
      email: string;
      role: string;
      isBanned: boolean;
      username: string;
    };
    
    const user = users.find(u => u.id === decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "Пользователь не найден" });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch (error) {
    res.status(401).json({ error: "Недействительный токен" });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  res.clearCookie('token');
  res.status(200).json({ message: "Успешный выход" });
});

router.put("/profile", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    
    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key") as {
      userId: number;
      email: string;
      role: string;
    };
    
    const userIndex = users.findIndex(u => u.id === decoded.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    const { username, currentPassword, newPassword } = req.body;
    
    if (username && username.trim() && username !== users[userIndex].username) {
      const existingUser = users.find(u => u.username === username && u.id !== decoded.userId);
      if (existingUser) {
        return res.status(400).json({ error: "Имя пользователя уже занято" });
      }
      users[userIndex].username = username;
      updateGlobalUsers();
    }
    
    if (currentPassword && newPassword) {
      const isValid = await bcrypt.compare(currentPassword, users[userIndex].password);
      if (!isValid) {
        return res.status(400).json({ error: "Неверный текущий пароль" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "Новый пароль должен быть не менее 6 символов" });
      }
      
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      users[userIndex].password = hashedNewPassword;
    }
    
    const newToken = jwt.sign(
      { userId: users[userIndex].id, email: users[userIndex].email, role: users[userIndex].role, isBanned: users[userIndex].isBanned, username: users[userIndex].username },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: '7d' }
    );
    
    res.cookie('token', newToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ user: userWithoutPassword, token: newToken, message: "Профиль успешно обновлен" });
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

router.get("/users", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key") as {
      userId: number;
      role: string;
    };
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const usersList = users.map(u => {
      const { password, ...userWithoutPassword } = u;
      return userWithoutPassword;
    });
    
    res.json({ users: usersList });
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения пользователей" });
  }
});

router.put("/users/:id/role", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key") as {
      userId: number;
      role: string;
    };
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const userId = parseInt(req.params.id as string);
    const { role } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Неверный ID пользователя" });
    }
    
    if (!['admin', 'moderator', 'user'].includes(role)) {
      return res.status(400).json({ error: "Некорректная роль" });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    if (users[userIndex].id === decoded.userId) {
      return res.status(400).json({ error: "Нельзя изменить свою роль" });
    }
    
    users[userIndex].role = role as 'admin' | 'moderator' | 'user';
    updateGlobalUsers();
    
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json({ message: "Роль успешно обновлена", user: userWithoutPassword });
  } catch (error) {
    console.error("Ошибка обновления роли:", error);
    res.status(500).json({ error: "Ошибка обновления роли" });
  }
});

router.put("/users/:id/ban", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key") as {
      userId: number;
      role: string;
    };
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const userId = parseInt(req.params.id as string);
    const { isBanned } = req.body;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Неверный ID пользователя" });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    if (users[userIndex].id === decoded.userId) {
      return res.status(400).json({ error: "Нельзя забанить самого себя" });
    }
    
    users[userIndex].isBanned = isBanned;
    updateGlobalUsers();
    
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json({ message: isBanned ? "Пользователь забанен" : "Пользователь разбанен", user: userWithoutPassword });
  } catch (error) {
    console.error("Ошибка бана пользователя:", error);
    res.status(500).json({ error: "Ошибка изменения статуса пользователя" });
  }
});

router.delete("/users/:id", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret_key") as {
      userId: number;
      role: string;
    };
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: "Доступ запрещен" });
    }
    
    const userId = parseInt(req.params.id as string);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Неверный ID пользователя" });
    }
    
    if (userId === decoded.userId) {
      return res.status(400).json({ error: "Нельзя удалить самого себя" });
    }
    
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    users.splice(userIndex, 1);
    updateGlobalUsers();
    
    res.json({ message: "Пользователь удален" });
  } catch (error) {
    console.error("Ошибка удаления пользователя:", error);
    res.status(500).json({ error: "Ошибка删除ления пользователя" });
  }
});

router.get("/test", (req: Request, res: Response) => {
  res.json({ message: "Auth router is working!" });
});

export default router;