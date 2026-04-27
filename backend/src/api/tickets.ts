import express, { Response } from "express";
import { authenticateToken, AuthRequest, checkRole } from "../middleware/authMiddleware";
import { io } from "../index";

export interface Ticket {
  id: number;
  title: string;
  description: string;
  userId: number;
  username: string;
  status: 'open' | 'in_progress' | 'closed' | 'archived';
  assignedTo?: number;
  assignedToName?: string;
  messages: TicketMessage[];
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
}

export interface TicketMessage {
  id: number;
  ticketId: number;
  userId: number;
  username: string;
  message: string;
  isStaff: boolean;
  createdAt: Date;
}

let tickets: Ticket[] = [];
let nextTicketId = 1;
let nextMessageId = 1;

const router = express.Router();

router.use(authenticateToken);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const currentUser = req.user;
    let userTickets = tickets;
    
    if (currentUser.role === 'user') {
      userTickets = tickets.filter(t => t.userId === currentUser.userId);
    }
    
    const activeTickets = userTickets.filter(t => t.status !== 'archived');
    const archivedTickets = userTickets.filter(t => t.status === 'archived');
    
    res.json({ tickets: activeTickets, archived: archivedTickets });
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения заявок" });
  }
});

router.get("/all", checkRole(['admin', 'moderator']), async (req: AuthRequest, res: Response) => {
  try {
    const activeTickets = tickets.filter(t => t.status !== 'archived');
    const archivedTickets = tickets.filter(t => t.status === 'archived');
    res.json({ tickets: activeTickets, archived: archivedTickets });
  } catch (error) {
    res.status(500).json({ error: "Ошибка получения заявок" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: "Заполните все поля" });
    }
    
    const newTicket: Ticket = {
      id: nextTicketId++,
      title,
      description,
      userId: req.user.userId,
      username: req.user.username || 'user',
      status: 'open',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    tickets.push(newTicket);
    
    io.emit('new_ticket', newTicket);
    
    res.status(201).json({ ticket: newTicket });
  } catch (error) {
    res.status(500).json({ error: "Ошибка создания заявки" });
  }
});

router.post("/:id/message", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const ticketId = parseInt(req.params.id as string);
    const { message } = req.body;
    
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Неверный ID заявки" });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }
    
    const ticket = tickets[ticketIndex];
    const isStaff = req.user.role === 'admin' || req.user.role === 'moderator';
    const currentUser = req.user;
    
    if (ticket.status === 'closed' || ticket.status === 'archived') {
      return res.status(400).json({ error: "Заявка закрыта" });
    }
    
    if (!isStaff && ticket.userId !== currentUser.userId) {
      return res.status(403).json({ error: "Нет доступа" });
    }
    
    const newMessage: TicketMessage = {
      id: nextMessageId++,
      ticketId,
      userId: currentUser.userId,
      username: currentUser.username || 'user',
      message,
      isStaff,
      createdAt: new Date()
    };
    
    tickets[ticketIndex].messages.push(newMessage);
    tickets[ticketIndex].updatedAt = new Date();
    
    io.emit('ticket_message', { ticketId, message: newMessage });
    
    res.status(201).json({ message: newMessage });
  } catch (error) {
    res.status(500).json({ error: "Ошибка отправки сообщения" });
  }
});

router.put("/:id/assign", checkRole(['admin', 'moderator']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const ticketId = parseInt(req.params.id as string);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Неверный ID заявки" });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }
    
    if (tickets[ticketIndex].status !== 'open') {
      return res.status(400).json({ error: "Заявка уже обрабатывается" });
    }
    
    const currentUser = req.user;
    tickets[ticketIndex].assignedTo = currentUser.userId;
    tickets[ticketIndex].assignedToName = currentUser.username;
    tickets[ticketIndex].status = 'in_progress';
    tickets[ticketIndex].updatedAt = new Date();
    
    const assignedRole = currentUser.role === 'admin' ? 'Администратор' : 'Модератор';
    const systemMessage: TicketMessage = {
      id: nextMessageId++,
      ticketId,
      userId: currentUser.userId,
      username: 'Система',
      message: `${assignedRole} ${currentUser.username} взял заявку в работу`,
      isStaff: true,
      createdAt: new Date()
    };
    
    tickets[ticketIndex].messages.push(systemMessage);
    
    io.emit('ticket_updated', tickets[ticketIndex]);
    
    res.json({ ticket: tickets[ticketIndex] });
  } catch (error) {
    res.status(500).json({ error: "Ошибка назначения заявки" });
  }
});

router.put("/:id/close", checkRole(['admin', 'moderator']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const ticketId = parseInt(req.params.id as string);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Неверный ID заявки" });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }
    
    tickets[ticketIndex].status = 'closed';
    tickets[ticketIndex].closedAt = new Date();
    tickets[ticketIndex].updatedAt = new Date();
    
    const currentUser = req.user;
    const systemMessage: TicketMessage = {
      id: nextMessageId++,
      ticketId,
      userId: currentUser.userId,
      username: 'Система',
      message: `Заявка закрыта оператором ${currentUser.username}`,
      isStaff: true,
      createdAt: new Date()
    };
    
    tickets[ticketIndex].messages.push(systemMessage);
    
    io.emit('ticket_updated', tickets[ticketIndex]);
    
    res.json({ ticket: tickets[ticketIndex] });
  } catch (error) {
    res.status(500).json({ error: "Ошибка закрытия заявки" });
  }
});

router.put("/:id/reopen", checkRole(['admin', 'moderator']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const ticketId = parseInt(req.params.id as string);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Неверный ID заявки" });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }
    
    if (tickets[ticketIndex].status !== 'closed') {
      return res.status(400).json({ error: "Можно открыть только закрытую заявку" });
    }
    
    tickets[ticketIndex].status = 'in_progress';
    tickets[ticketIndex].updatedAt = new Date();
    
    const currentUser = req.user;
    const systemMessage: TicketMessage = {
      id: nextMessageId++,
      ticketId,
      userId: currentUser.userId,
      username: 'Система',
      message: `Заявка открыта заново оператором ${currentUser.username}`,
      isStaff: true,
      createdAt: new Date()
    };
    
    tickets[ticketIndex].messages.push(systemMessage);
    
    io.emit('ticket_updated', tickets[ticketIndex]);
    
    res.json({ ticket: tickets[ticketIndex] });
  } catch (error) {
    res.status(500).json({ error: "Ошибка открытия заявки" });
  }
});

router.put("/:id/archive", checkRole(['admin', 'moderator']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const ticketId = parseInt(req.params.id as string);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Неверный ID заявки" });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }
    
    if (tickets[ticketIndex].status !== 'closed') {
      return res.status(400).json({ error: "В архив можно отправить только закрытую заявку" });
    }
    
    tickets[ticketIndex].status = 'archived';
    tickets[ticketIndex].updatedAt = new Date();
    
    io.emit('ticket_updated', tickets[ticketIndex]);
    
    res.json({ ticket: tickets[ticketIndex] });
  } catch (error) {
    res.status(500).json({ error: "Ошибка архивации заявки" });
  }
});

router.delete("/:id", checkRole(['admin', 'moderator']), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Не авторизован" });
    }
    
    const ticketId = parseInt(req.params.id as string);
    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Неверный ID заявки" });
    }
    
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex === -1) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }
    
    if (tickets[ticketIndex].status !== 'archived') {
      return res.status(400).json({ error: "Можно удалить только заявку из архива" });
    }
    
    tickets.splice(ticketIndex, 1);
    
    io.emit('ticket_deleted', { id: ticketId });
    
    res.json({ message: "Заявка удалена" });
  } catch (error) {
    res.status(500).json({ error: "Ошибка удаления заявки" });
  }
});

export default router;