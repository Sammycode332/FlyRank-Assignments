import { Task } from '../types';

export interface TaskRepository {
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(title: string): Promise<Task>;
  updateTask(id: number, title?: string, done?: boolean): Promise<Task | undefined>;
  deleteTask(id: number): Promise<Task | undefined>;
}