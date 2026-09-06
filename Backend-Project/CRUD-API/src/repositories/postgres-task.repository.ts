import { Pool } from 'pg';
import { Task } from '../types';
import { TaskRepository } from './task.repository';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const postgresTaskRepository: TaskRepository = {
  async getAllTasks(): Promise<Task[]> {
    const result = await pool.query('SELECT * FROM tasks');
    return result.rows as Task[];
  }, 
};