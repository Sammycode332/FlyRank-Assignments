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
  async getTaskById(id: number): Promise<Task | undefined>{
    const result = await pool.query('SELECT * FROM tasks WHERE id = $1',[id])
    // pool.query(`SELECT * FROM tasks WHERE id = ${id}`)  // ❌ dangerous for security purposes
    return result.rows[0] as Task | undefined
  },
  async createTask(title: string): Promise<Task> {
      const insertResult = await pool.query(
        'INSERT INTO tasks(title, done) VALUES($1, $2) RETURNING *',[title, false]
    );
      return insertResult.rows[0] as Task;
    },
  async updateTask(id: number, title?: string, done?: boolean): Promise<Task | undefined>{
        const existingResult = await pool.query('SELECT * FROM tasks WHERE id = $1',[id])
        const existingTask = existingResult.rows[0] as Task | undefined
        if (!existingTask) return undefined;
    
        const newTitle = title !== undefined ? title : existingTask.title;
        const newDone = done !== undefined ? done : existingTask.done;
    
       await pool.query('UPDATE tasks SET title = $1, done = $2 WHERE id = $3',[newTitle,newDone,id]);
    
        const updatedResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
       return updatedResult.rows[0] as Task;
      },
   async deleteTask(id: number): Promise<Task | undefined>{
      const result = await pool.query('SELECT * FROM tasks WHERE id = $1',[id])
      const task = result.rows[0] as Task | undefined
      if (!task) return undefined;
  
      await pool.query('DELETE FROM tasks WHERE id = $1',[id])
      return task ;
    },
};