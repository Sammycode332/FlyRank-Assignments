import 'dotenv/config';
import { sqliteTaskRepository } from './repositories/sqlite-task.repository';
import { postgresTaskRepository } from './repositories/postgres-task.repository';
import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';


// const taskRepository = sqliteTaskRepository
const taskRepository = postgresTaskRepository
const app = express();


app.use(express.json());



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
app.get('/tasks', async (req: Request, res: Response) => {
  const tasks = await taskRepository.getAllTasks()
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
app.get('/tasks/:id', async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  const task = await taskRepository.getTaskById(taskId)

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
app.post('/tasks', async (req: Request, res: Response) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    res.status(400).json({
      error: "Title is required",
    });
    return;
  }

  const newTask = await taskRepository.createTask(title)
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
app.put('/tasks/:id', async (req: Request, res: Response) => {
  const taskId = Number(req.params.id);
  const { title, done } = req.body;

  if (title !== undefined && title.trim() === "") {
    res.status(400).json({
      error: "Title cannot be empty",
    });
    return;
  }

  const updatedTask = await taskRepository.updateTask(taskId, title, done);

  if (!updatedTask) {
    res.status(404).json({
      error: "Task not found",
    });
    return;
  }

  res.status(200).json(updatedTask);
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
app.delete('/tasks/:id', async(req: Request, res: Response) => {
  const taskId = Number(req.params.id);

  const deletedTask = await taskRepository.deleteTask(taskId)

  if (!deletedTask) {
    res.status(404).json({
      error: "Task not found",
    });
    return;
  }

 

  res.status(200).json({
    message: "Task deleted successfully",
    deletedTask,
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
