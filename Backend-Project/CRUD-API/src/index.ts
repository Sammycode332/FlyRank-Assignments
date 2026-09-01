import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import Database from 'better-sqlite3'

const db  = new Database('tasks.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL
  );
`);
const rows = db.prepare(`SELECT * FROM tasks`).all();
if (rows.length === 0){
  const insert = db.prepare(`
    INSERT INTO tasks(id,title,done)
    VALUES(?,?,?)`)
    insert.run(1, "Learn TypeScript", 0)
    insert.run(2, "Build a CRUD API", 0)
    insert.run(3, "Test with Swagger", 1)

}
const allTasks = db.prepare('SELECT * FROM tasks').all();
console.log(allTasks);
const app = express();


app.use(express.json());

interface Task {
  id: number;
  title: string;
  done: boolean;
}

let tasks: Task[] = [
  { id: 1, title: "Learn TypeScript", done: false },
  { id: 2, title: "Build a CRUD API", done: false },
  { id: 3, title: "Test with Swagger", done: true },
];

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRUD API',
      version: '1.0.0',
      description: 'A simple CRUD API with Swagger docs',
    },

    // Task model
    components: {
      schemas: {
        Task: {
          type: 'object',
          required: ['id', 'title', 'done'],
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Learn TypeScript',
            },
            done: {
              type: 'boolean',
              example: false,
            },
          },
        },
      },
    },
  },

  apis: ['./src/index.ts'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

const PORT = 3000;

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns API info
 *     responses:
 *       200:
 *         description: API metadata
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 version:
 *                   type: string
 *                 endpoints:
 *                   type: array
 *                   items:
 *                     type: string
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: ["/tasks"],
  });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: "ok",
  });
});

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: A list of all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 */
app.get('/tasks', (req: Request, res: Response) => {
  res.json(tasks);
});

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Task found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
app.get('/tasks/:id', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  const task = tasks.find(t => t.id === taskId);

  if (!task) {
    res.status(404).json({
      message: `Task ${taskId} not found`,
    });
    return;
  }

  res.json(task);
});

/**
 * @swagger
 * /tasks:
 *   post:
 *     summary: Create a new task
 *     tags:
 *       - Tasks
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: Learn Express
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Title is required
 */
app.post('/tasks', (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    res.status(400).json({
      error: "Title is required",
    });
    return;
  }

  const newId =
    tasks.length > 0
      ? Math.max(...tasks.map(t => t.id)) + 1
      : 1;

  const newTask: Task = {
    id: newId,
    title: title,
    done: false,
  };

  tasks.push(newTask);

  res.status(201).json(newTask);
});

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     summary: Update a task
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Learn TypeScript properly
 *               done:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Title cannot be empty
 *       404:
 *         description: Task not found
 */
app.put('/tasks/:id', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    res.status(404).json({
      error: "Task not found",
    });
    return;
  }

  const { title, done } = req.body;

  if (title !== undefined && title.trim() === "") {
    res.status(400).json({
      error: "Title cannot be empty",
    });
    return;
  }

  const existingTask = tasks[taskIndex]!;

  if (title !== undefined) {
    existingTask.title = title;
  }

  if (done !== undefined) {
    existingTask.done = done;
  }

  res.status(200).json(existingTask);
});

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Task deleted successfully
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *       404:
 *         description: Task not found
 */
app.delete('/tasks/:id', (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  const taskIndex = tasks.findIndex(t => t.id === taskId);

  if (taskIndex === -1) {
    res.status(404).json({
      error: "Task not found",
    });
    return;
  }

  const deletedTask = tasks.splice(taskIndex, 1)[0];

  res.status(200).json({
    message: "Task deleted successfully",
    task: deletedTask,
  });
});

// Swagger UI
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
