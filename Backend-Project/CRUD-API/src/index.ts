import 'dotenv/config';
import supabase from './supabase';
import { sqliteTaskRepository } from './repositories/sqlite-task.repository';
import { postgresTaskRepository } from './repositories/postgres-task.repository';
import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { access } from 'node:fs';


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

app.get('/public/info', (req: Request, res: Response) => {
  res.status(200).json({
    message: "Welcome stranger! This info is public."
  });
});
app.get('/protected/profile',async(req:Request,res:Response)=>{
  const authHeader = req.headers.authorization;

  if(!authHeader){
    return res.status(401).json({
      error:"Access token required"
    });
  }
  const parts = authHeader.split(' ');
  
  if(parts[0] !== "Bearer" || !parts[1]){
    return res.status(401).json({
      error:"Access token required"
    });
  }

  const token = parts[1]

  const {data,error } = await supabase.auth.getUser(token);

  if(error){
    return res.status(401).json({
      error: "Invalid or expired token"
    })
  }
  return res.status(200).json({
    id:data.user.id,
    email:data.user.email,
    created_at:data.user.created_at
  })
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
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Create a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid request
 */
app.post('/auth/signup',async(req,res)=>{
   const { email, password} = req.body
   if(!email || !password){
    res.status(400).json({
      error: "Email and password are required"
    })
    return;
   }
   const { data, error } = await supabase.auth.signUp({
   email,
   password
   
});

    if(error){
        return res.status(400).json({
          error:error.message
        });
    } else {
        res.status(201).json(data.user);
    }
})
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Email and password are required
 *       401:
 *         description: Invalid login credentials
 */
app.post('/auth/login',async(req,res)=>{
  const{ email,password } = req.body
  if (!email || !password) {
  res.status(400).json({
    error: "Email and password are required"
  });
  return;

}
const{data,error} = await supabase.auth.signInWithPassword({
  email,
  password
})
if(error){
  console.log(error);
  return res.status(401).json({  
    error: "Invalid login credentials"
  });
} else {
  return res.status(200).json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token
  });
}
})
// Swagger U
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec)
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
