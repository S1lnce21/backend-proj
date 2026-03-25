import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/auth";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  imageUrl?: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
}

let products: Product[] = [];
let nextProductId = 1;

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const productsWithAuthor = products.map(product => ({
      ...product,
      author: {
        id: product.authorId,
        username: product.authorId === req.user?.userId ? "sloy" : "testuser"
      }
    }));
    res.json({ products: productsWithAuthor });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении товаров" });
  }
});

router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID товара" });
    }

    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    res.json({
      product: {
        ...product,
        author: {
          id: product.authorId,
          username: product.authorId === req.user?.userId ? "sloy" : "testuser"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при получении товара" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const { name, description, price, category, stock, imageUrl } = req.body;
    
    if (!name || !description || !price || !category) {
      return res.status(400).json({ error: "Название, описание, цена и категория обязательны" });
    }

    const newProduct: Product = {
      id: nextProductId++,
      name,
      description,
      price: parseFloat(price),
      category,
      stock: stock ? parseInt(stock) : 0,
      imageUrl: imageUrl || "",
      authorId: req.user.userId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    products.push(newProduct);
    console.log(`✅ Товар создан: ${newProduct.name} (ID: ${newProduct.id})`);
    
    res.status(201).json({ 
      product: {
        ...newProduct,
        author: {
          id: req.user.userId,
          username: "sloy"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при создании товара" });
  }
});

router.put("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID товара" });
    }

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    if (products[productIndex].authorId !== req.user.userId) {
      return res.status(403).json({ error: "Нет прав на редактирование" });
    }

    const { name, description, price, category, stock, imageUrl } = req.body;
    
    if (name) products[productIndex].name = name;
    if (description) products[productIndex].description = description;
    if (price) products[productIndex].price = parseFloat(price);
    if (category) products[productIndex].category = category;
    if (stock !== undefined) products[productIndex].stock = parseInt(stock);
    if (imageUrl !== undefined) products[productIndex].imageUrl = imageUrl;
    products[productIndex].updatedAt = new Date();

    res.json({
      product: {
        ...products[productIndex],
        author: {
          id: products[productIndex].authorId,
          username: "sloy"
        }
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при обновлении товара" });
  }
});

router.delete("/:id", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }

    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Неверный ID товара" });
    }

    const productIndex = products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: "Товар не найден" });
    }

    if (products[productIndex].authorId !== req.user.userId) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    products.splice(productIndex, 1);
    console.log(`🗑️ Товар удален (ID: ${id})`);
    
    res.json({ message: "Товар успешно удален" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении товара" });
  }
});

export default router;