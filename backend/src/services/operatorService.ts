import { randomUUID } from 'crypto';

export interface Operator {
  id: number;
  username: string;
  socketId: string;
  isOnline: boolean;
  currentRoom?: string;
}

export interface WaitingUser {
  userId: number;
  username: string;
  roomId: string;
  joinedAt: number;
}

class OperatorService {
  private operators: Map<number, Operator> = new Map();
  private waitingQueue: WaitingUser[] = [];

  constructor() {
    // Добавляем тестовых операторов
    this.addOperator(1, 'Анна Оператор');
    this.addOperator(2, 'Дмитрий Оператор');
  }

  addOperator(id: number, username: string): void {
    this.operators.set(id, {
      id,
      username,
      socketId: '',
      isOnline: false,
    });
  }

  registerOperatorSocket(operatorId: number, socketId: string): void {
    const operator = this.operators.get(operatorId);
    if (operator) {
      operator.socketId = socketId;
      operator.isOnline = true;
    }
  }

  unregisterOperatorSocket(operatorId: number): void {
    const operator = this.operators.get(operatorId);
    if (operator) {
      operator.isOnline = false;
      operator.currentRoom = undefined;
      operator.socketId = '';
    }
  }

  getAvailableOperator(): Operator | undefined {
    return Array.from(this.operators.values()).find(
      op => op.isOnline && !op.currentRoom
    );
  }

  assignOperatorToRoom(operatorId: number, roomId: string): boolean {
    const operator = this.operators.get(operatorId);
    if (operator && operator.isOnline) {
      operator.currentRoom = roomId;
      return true;
    }
    return false;
  }

  releaseOperatorFromRoom(operatorId: number): void {
    const operator = this.operators.get(operatorId);
    if (operator) {
      operator.currentRoom = undefined;
    }
  }

  addToWaitingQueue(userId: number, username: string, roomId: string): number {
    const waitingUser: WaitingUser = {
      userId,
      username,
      roomId,
      joinedAt: Date.now(),
    };
    this.waitingQueue.push(waitingUser);
    return this.waitingQueue.length;
  }

  getNextWaitingUser(): WaitingUser | undefined {
    return this.waitingQueue.shift();
  }

  removeFromWaitingQueue(userId: number): void {
    this.waitingQueue = this.waitingQueue.filter(u => u.userId !== userId);
  }

  getWaitingPosition(userId: number): number {
    const index = this.waitingQueue.findIndex(u => u.userId === userId);
    return index !== -1 ? index + 1 : 0;
  }

  getOperatorsList(): Operator[] {
    return Array.from(this.operators.values());
  }

  getOperatorByRoom(roomId: string): Operator | undefined {
    return Array.from(this.operators.values()).find(
      op => op.currentRoom === roomId
    );
  }
}

export const operatorService = new OperatorService();