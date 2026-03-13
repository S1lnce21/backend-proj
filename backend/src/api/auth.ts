import express, { Request, Response } from "express";
import { hashPass, comparePassword } from "../utils/hashPass";
import prisma from "../db";
import jwt from "jsonwebtoken";

interface RegisterBody {
  username?: string;
  email?: string;
  password?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const router = express.Router();

router.post("/login", async function (req: Request<{}, {}, LoginBody>, res: Response) {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new Error("Email и пароль обязательны");
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ error: "Пользователь не найден" });
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      return res.status(400).json({ error: "Неверный пароль" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return res.status(200).json({ 
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : "Ошибка входа" });
  }
});

router.post("/logout", async function (req: Request, res: Response) {
  try {
    return res.status(200).json({ message: "Успешный выход из системы" });
  } catch (e) {
    return res.status(400).json({ error: e instanceof Error ? e.message : "Ошибка выхода" });
  }
});

router.post(
  "/register",
  async function (req: Request<{}, {}, RegisterBody>, res: Response) {
    try {
      const { username, email, password } = req.body;
      
      if (!email || !password || !username) {
        throw new Error("Email, пароль и имя пользователя обязательны");
      }

      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: "Пользователь с таким email уже существует" });
      }

      const hashedPass = await hashPass(password);
      const newUser = await prisma.user.create({
        data: { username, email, password: hashedPass },
      });
      
      return res.status(200).json({ 
        user: {
          id: newUser.id,
          email: newUser.email,
          username: newUser.username
        }
      });
    } catch (e) {
      return res.status(400).json({ error: e instanceof Error ? e.message : "Ошибка регистрации" });
    }
  },
);

export default router;