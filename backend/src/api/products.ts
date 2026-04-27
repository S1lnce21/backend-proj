import express, { Response } from "express";
import { authenticateToken, AuthRequest } from "../middleware/authMiddleware";
import { io } from "../index";

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

const getUsernameById = (userId: number): string => {
  const user = (global as any).usersForPosts?.find((u: any) => u.id === userId);
  return user?.username || `user_${userId}`;
};

const getUserRoleById = (userId: number): string => {
  const user = (global as any).usersForPosts?.find((u: any) => u.id === userId);
  return user?.role || 'user';
};

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
        username: getUsernameById(product.authorId),
        role: getUserRoleById(product.authorId)
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
          username: getUsernameById(product.authorId),
          role: getUserRoleById(product.authorId)
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
    
    const productWithAuthor = {
      ...newProduct,
      author: {
        id: req.user.userId,
        username: getUsernameById(req.user.userId),
        role: req.user.role
      }
    };
    
    io.emit('product_created', productWithAuthor);
    
    res.status(201).json({ product: productWithAuthor });
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

    const product = products[productIndex];
    const isAuthor = product.authorId === req.user.userId;
    const isModerator = req.user.role === 'moderator';
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isModerator && !isAdmin) {
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

    const updatedProduct = {
      ...products[productIndex],
      author: {
        id: products[productIndex].authorId,
        username: getUsernameById(products[productIndex].authorId),
        role: getUserRoleById(products[productIndex].authorId)
      }
    };
    
    io.emit('product_updated', updatedProduct);

    res.json({ product: updatedProduct });
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

    const product = products[productIndex];
    const isAuthor = product.authorId === req.user.userId;
    const isModerator = req.user.role === 'moderator';
    const isAdmin = req.user.role === 'admin';
    
    if (!isAuthor && !isModerator && !isAdmin) {
      return res.status(403).json({ error: "Нет прав на удаление" });
    }

    const deletedProduct = products[productIndex];
    products.splice(productIndex, 1);
    
    io.emit('product_deleted', { id });
    
    const deletedBy = isAdmin ? 'администратором' : (isModerator ? 'модератором' : 'автором');
    console.log(`🗑️ Товар удален ${deletedBy}: ${deletedProduct.name} (ID: ${id})`);
    
    res.json({ message: "Товар успешно удален" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка при удалении товара" });
  }
});

export default router;