import express, { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface User {
  id: number;
  username: string;
  email: string;
  password: string;
  createdAt: Date;
}

let users: User[] = [];
let nextId = 1;

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    
    if (!email || !password || !username) {
      return res.status(400).json({ error: "Все поля обязательны" });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: "Пользователь с таким email уже существует" });
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
    
    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(200).json({ 
      user: userWithoutPassword,
      token
    });
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

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Неверный пароль" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    });
    
    const { password: _, ...userWithoutPassword } = user;
    res.status(200).json({ 
      user: userWithoutPassword,
      token
    });
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
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
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
  res.status(200).json({ message: "Успешный выход из системы" });
});

export default router;