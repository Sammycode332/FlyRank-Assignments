import Database from "better-sqlite3";
import { Task } from '../types'
import { TaskRepository } from "./task.repository";

const db = new Database('tasks.db')

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL
  );
`);

export const sqliteTaskRepository: TaskRepository = {
  async getAllTasks(): Promise<Task[]> {
    return db.prepare('SELECT * FROM tasks').all() as Task[];
  },
  async getTaskById(id: number): Promise<Task | undefined> {
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
  },
  async createTask(title: string): Promise<Task> {
    const insert = db.prepare(`INSERT INTO tasks(title, done) VALUES(?, ?)`);
    const result = insert.run(title, 0);
    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid) as Task;
  },
  async updateTask(id: number, title?: string, done?: boolean): Promise<Task | undefined>{
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!existingTask) return undefined;

    const newTitle = title !== undefined ? title : existingTask.title;
    const newDone = done !== undefined ? done : existingTask.done;

    db.prepare(`UPDATE tasks SET title = ?, done = ? WHERE id = ?`).run(newTitle, Number(newDone), id);

    return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task;
  },

  async deleteTask(id: number): Promise<Task | undefined>{
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as Task | undefined;
    if (!task) return undefined;

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return task;
  },
};