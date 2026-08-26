import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const app = express();

app.use(express.json());

interface Task {
  id: number;
  title: string;
  done: boolean;
}

// Original / seed tasks
let tasks: Task[] = [
  { id: 1, title: "Learn TypeScript", done: false },
  { id: 2, title: "Build a CRUD API", done: false },
  { id: 3, title: "Test with Swagger", done: true },
];

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task CRUD API',
      version: '1.0.0',
      description:
        'A simple Task CRUD API built with Express, TypeScript and Swagger',
    },

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


/* =========================================================
   API INFORMATION
   ========================================================= */

/**
 * @swagger
 * /:
 *   get:
 *     summary: Returns API information
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: API metadata
 */
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: "Task API",
    version: "1.0",
    endpoints: [
      "/tasks",
      "/stats",
      "/reset",
      "/health",
      "/api-docs",
    ],
  });
});


/* =========================================================
   HEALTH CHECK
   ========================================================= */

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags:
 *       - General
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: "ok",
  });
});


/* =========================================================
   GET ALL TASKS + FILTERING + SEARCH
   ========================================================= */

/**
 * @swagger
 * /tasks:
 *   get:
 *     summary: Get all tasks, filter by completion status, or search by title
 *     tags:
 *       - Tasks
 *     parameters:
 *       - in: query
 *         name: done
 *         required: false
 *         description: Filter tasks by completion status
 *         schema:
 *           type: boolean
 *         example: true
 *
 *       - in: query
 *         name: search
 *         required: false
 *         description: Search tasks by title
 *         schema:
 *           type: string
 *         example: milk
 *
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Task'
 *
 *       400:
 *         description: Invalid done query parameter
 */
app.get('/tasks', (req: Request, res: Response) => {

  const { done, search } = req.query;

  let filteredTasks = tasks;


  // Filter by done status
  if (done !== undefined) {

    if (done !== 'true' && done !== 'false') {

      res.status(400).json({
        error: "done must be true or false",
      });

      return;
    }

    const isDone = done === 'true';

    filteredTasks = filteredTasks.filter(
      task => task.done === isDone
    );
  }


  // Search by title
  if (search !== undefined) {

    const searchTerm = String(search).toLowerCase();

    filteredTasks = filteredTasks.filter(
      task =>
        task.title
          .toLowerCase()
          .includes(searchTerm)
    );
  }


  res.json(filteredTasks);
});


/* =========================================================
   GET ONE TASK
   ========================================================= */

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
 *         description: The ID of the task
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
 *
 *       404:
 *         description: Task not found
 */
app.get('/tasks/:id', (req: Request, res: Response) => {

  const taskId = Number(req.params.id);

  const task = tasks.find(
    t => t.id === taskId
  );


  if (!task) {

    res.status(404).json({
      message: `Task ${taskId} not found`,
    });

    return;
  }


  res.json(task);
});


/* =========================================================
   CREATE TASK
   ========================================================= */

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
 *                 example: Buy milk
 *
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *
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


/* =========================================================
   UPDATE TASK
   ========================================================= */

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
 *         description: The ID of the task
 *         schema:
 *           type: integer
 *         example: 1
 *
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
 *
 *     responses:
 *       200:
 *         description: Task updated successfully
 *
 *       400:
 *         description: Title cannot be empty
 *
 *       404:
 *         description: Task not found
 */
app.put('/tasks/:id', (req: Request, res: Response) => {

  const taskId = Number(req.params.id);


  const taskIndex = tasks.findIndex(
    t => t.id === taskId
  );


  if (taskIndex === -1) {

    res.status(404).json({
      error: "Task not found",
    });

    return;
  }


  const { title, done } = req.body;


  if (
    title !== undefined &&
    title.trim() === ""
  ) {

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


/* =========================================================
   DELETE TASK
   ========================================================= */

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
 *         description: The ID of the task
 *         schema:
 *           type: integer
 *         example: 1
 *
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *
 *       404:
 *         description: Task not found
 */
app.delete('/tasks/:id', (req: Request, res: Response) => {

  const taskId = Number(req.params.id);


  const taskIndex = tasks.findIndex(
    t => t.id === taskId
  );


  if (taskIndex === -1) {

    res.status(404).json({
      error: "Task not found",
    });

    return;
  }


  const deletedTask =
    tasks.splice(taskIndex, 1)[0];


  res.status(200).json({
    message: "Task deleted successfully",
    task: deletedTask,
  });
});


/* =========================================================
   STATS
   ========================================================= */

/**
 * @swagger
 * /stats:
 *   get:
 *     summary: Get task statistics
 *     tags:
 *       - Statistics
 *     responses:
 *       200:
 *         description: Task statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 7
 *                 done:
 *                   type: integer
 *                   example: 3
 *                 open:
 *                   type: integer
 *                   example: 4
 */
app.get('/stats', (req: Request, res: Response) => {

  const total = tasks.length;

  const done =
    tasks.filter(task => task.done).length;

  const open =
    tasks.filter(task => !task.done).length;


  res.json({
    total,
    done,
    open,
  });
});


/* =========================================================
   RESET TASKS
   ========================================================= */

/**
 * @swagger
 * /reset:
 *   post:
 *     summary: Reset tasks to the original seed data
 *     tags:
 *       - Tasks
 *     responses:
 *       200:
 *         description: Tasks reset successfully
 */
app.post('/reset', (req: Request, res: Response) => {

  tasks = [
    {
      id: 1,
      title: "Learn TypeScript",
      done: false,
    },
    {
      id: 2,
      title: "Build a CRUD API",
      done: false,
    },
    {
      id: 3,
      title: "Test with Swagger",
      done: true,
    },
  ];


  res.status(200).json({
    message: "Tasks reset successfully",
    tasks,
  });
});


/* =========================================================
   SWAGGER UI
   ========================================================= */

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(PORT, () => {
  console.log(
    `Server is running on http://localhost:${PORT}`
  );

  console.log(
    `Swagger UI: http://localhost:${PORT}/api-docs`
  );
});

