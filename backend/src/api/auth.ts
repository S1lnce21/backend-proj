import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
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
      createdAt: new Date()
    });
    
    const hashedPassword2 = await bcrypt.hash("AdminPass123!", 10);
    users.push({
      id: nextId++,
      username: "admin",
      email: "admin@test.com",
      password: hashedPassword2,
      createdAt: new Date()
    });
    
    console.log("✅ Тестовые пользователи созданы:");
    console.log("   testuser: test@test.com / TestPass123!");
    console.log("   admin: admin@test.com / AdminPass123!");
  }
};

initTestUsers();

(global as any).usersForPosts = users;

const updateGlobalUsers = () => {
  (global as any).usersForPosts = users;
};

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  console.log("📝 Register request:", req.body);
  
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
      createdAt: new Date()
    };
    
    users.push(newUser);
    updateGlobalUsers();
    console.log("✅ User created:", { id: newUser.id, email: newUser.email });
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
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
    console.error("❌ Register error:", e);
    res.status(400).json({ error: e instanceof Error ? e.message : "Ошибка регистрации" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  console.log("🔐 Login request:", req.body);
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(400).json({ error: "Пользователь не найден" });
    }

    console.log("📝 User found:", { id: user.id, email: user.email });
    
    const isValid = await bcrypt.compare(password, user.password);
    console.log("✅ Password valid:", isValid);
    
    if (!isValid) {
      return res.status(400).json({ error: "Неверный пароль" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    console.log("✅ Login successful for:", email);
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ user: userWithoutPassword, token });
  } catch (e) {
    console.error("❌ Login error:", e);
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
    };
    
    const userIndex = users.findIndex(u => u.id === decoded.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: "Пользователь не найден" });
    }
    
    const { username, currentPassword, newPassword } = req.body;
    
    if (username && username.trim()) {
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
    
    const { password: _, ...userWithoutPassword } = users[userIndex];
    res.json({ user: userWithoutPassword, message: "Профиль успешно обновлен" });
  } catch (error) {
    console.error("❌ Profile update error:", error);
    res.status(500).json({ error: "Ошибка обновления профиля" });
  }
});

router.get("/test", (req: Request, res: Response) => {
  res.json({ message: "Auth router is working!" });
});

export default router;