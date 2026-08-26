import express, { Request, Response } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const app = express();
app.use(express.json());
interface Task {
  id: number;
  title: string;
  done:boolean;
}

let tasks: Task[] =[
  {id: 1, title:"Learn TypeScript", done: false},
  {id: 2, title:"Build a CRUD API", done: false},
  {id: 3, title:"Test with Swagger", done: true},
]
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRUD API',
      version: '1.0.0',
      description: 'A simple CRUD API with Swagger docs',
    },
  },
  apis: ['./src/index.ts'], // path to the file(s) with your route comments
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
    endpoints: ["/tasks"]
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
    status: "ok"
  });
});
app.get('/tasks',(req: Request,res:Response)=>{
  res.json(tasks)
})
app.get('/tasks/:id',(req:Request,res:Response)=>{
  const taskId = Number(req.params.id)
  const task = tasks.find(t=>t.id ===taskId)
  if(!task) {
    res.status(404).json({message: `Task ${taskId} not found`});
    return;
  }
  res.json(task)
})
app.post('/tasks',(req:Request, res: Response)=>{
  const { title } = req.body;
  if(!title || title.trim() === ""){
    res.status(400).json({error: "Title is required"})
    return;
  }
  const newId = tasks.length >0 ? Math.max(...tasks.map(t=>t.id)) +1:1;
  const newTask: Task = {
    id: newId,
    title: title,
    done:false,
  };
  tasks.push(newTask)

  res.status(201).json(newTask)
})
app.put('/tasks/:id',(req:Request,res:Response)=>{
  const taskId = Number(req.params.id)
  const taskIndex = tasks.findIndex(t=>t.id=== taskId)
  if(taskIndex === -1){
    res.status(404).json({error:"Task not found"});
    return
  }
  const {title, done } = req.body;
  if(title !== undefined && title.trim()=== ""){
    res.status(400).json({error: "Title cannpt be empty"})
    return;
  }
  const existingTask = tasks[taskIndex]!;
  if (title !== undefined) existingTask.title = title;
  if (done !== undefined) existingTask.done = done;

res.status(200).json(existingTask);
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.listen(PORT, ()=>{
    console.log(`Server is running on http://localhost:${PORT}`)
});