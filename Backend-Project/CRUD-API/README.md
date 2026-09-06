# Task CRUD API

A simple **CRUD REST API** built with **Node.js, Express, and TypeScript**, backed by **PostgreSQL running in Docker**, with a **repository pattern** allowing the storage layer to be swapped without touching routes, and interactive API documentation using **Swagger UI**.

## Features

* Create a task
* Get all tasks
* Get a single task by ID
* Update a task
* Delete a task
* Health check endpoint
* API information endpoint
* Interactive Swagger API documentation
* PostgreSQL persistence via Docker + volumes
* Repository pattern (SQLite and Postgres implementations, swappable via one line)
* TypeScript type safety

## Technologies Used

* **Node.js**
* **Express.js**
* **TypeScript**
* **PostgreSQL** (via Docker)
* **pg** (Postgres client for Node)
* **Docker & Docker Compose**
* **better-sqlite3** (earlier implementation, kept as a reference/alternate repository)
* **Swagger UI Express**
* **Swagger JSDoc**

## Project Structure

```text
task-api/
│
├── src/
│   ├── index.ts
│   ├── types.ts
│   └── repositories/
│       ├── task.repository.ts          # interface/contract
│       ├── sqlite-task.repository.ts   # SQLite implementation
│       └── postgres-task.repository.ts # Postgres implementation
├── init-db/
│   └── init.sql
├── screenshots/
├── docker-compose.yml
├── .env
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Move into the project directory:

```bash
cd task-api
```

Install the dependencies:

```bash
npm install
```

Copy the example environment file and adjust if needed:

```bash
cp .env.example .env
```

## Running the Application

### 1. Start Postgres in Docker

```bash
docker compose up -d
```

This starts a Postgres 16 container, creates a persistent volume (`pgdata`) for the data, and automatically runs `init-db/init.sql` to create the `tasks` table **the first time** the volume is empty.

### 2. Start the API server

```bash
npm run dev
```

The server will run on:

```text
http://localhost:3000
```

## Docker Reference

### Start the database (detached / background)

```bash
docker compose up -d
```

### Start the database (attached, streaming logs live)

```bash
docker compose up
```

### Stop the container (keeps data — safe, normal shutdown)

```bash
docker compose down
```

This stops and removes the container, but the `pgdata` volume is untouched — your data is still there next time you run `docker compose up`.

### Stop and wipe all data (fresh start)

```bash
docker compose down -v
```

The `-v` flag also deletes the volume — use this only if you want to reset the database completely (e.g. to test `init.sql` running again from scratch).

### Check what's currently running

```bash
docker compose ps
```

or view everything (including stopped containers):

```bash
docker ps -a
```

### View live logs from the database container

```bash
docker compose logs -f
```

## Environment Variables

Connection details are read from `.env` (gitignored). A template is provided in `.env.example`:

```text
DATABASE_URL=postgresql://username:password@localhost:5432/tasks
```

## Architecture: Repository Pattern

Routes never talk to the database directly. Instead, they call a `TaskRepository` interface:

```ts
export interface TaskRepository {
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(title: string): Promise<Task>;
  updateTask(id: number, title?: string, done?: boolean): Promise<Task | undefined>;
  deleteTask(id: number): Promise<Task | undefined>;
}
```

Two implementations exist — `sqliteTaskRepository` and `postgresTaskRepository` — both satisfying the same contract. Switching which database the whole app uses is a single line in `index.ts`:

```ts
const taskRepository = postgresTaskRepository; // or sqliteTaskRepository
```

No route, no validation logic, and no other code changes when swapping databases.

## API Documentation

Swagger UI is available at:

```text
http://localhost:3000/api-docs
```

Swagger allows you to view and test all API endpoints directly from your browser.

## API Endpoints

### 1. API Information

**GET**

```text
/
```

Example response:

```json
{
  "name": "Task API",
  "version": "1.0",
  "endpoints": ["/tasks"]
}
```

---

### 2. Health Check

**GET**

```text
/health
```

Example response:

```json
{
  "status": "ok"
}
```

---

# Tasks API

## 3. Get All Tasks

**GET**

```text
/tasks
```

Example response:

```json
[
  { "id": 1, "title": "Learn TypeScript", "done": false },
  { "id": 2, "title": "Build a CRUD API", "done": false },
  { "id": 3, "title": "Test with Swagger", "done": true }
]
```

---

## 4. Get a Task by ID

**GET**

```text
/tasks/:id
```

Example response:

```json
{ "id": 1, "title": "Learn TypeScript", "done": false }
```

If not found — `404 Not Found`:

```json
{ "message": "Task 999 not found" }
```

---

## 5. Create a Task

**POST**

```text
/tasks
```

Request body:

```json
{ "title": "Learn Express" }
```

Response — `201 Created`:

```json
{ "id": 4, "title": "Learn Express", "done": false }
```

If title missing/empty — `400 Bad Request`:

```json
{ "error": "Title is required" }
```

---

## 6. Update a Task

**PUT**

```text
/tasks/:id
```

Request body (either or both fields):

```json
{ "title": "Learn TypeScript and Express", "done": true }
```

Response — `200 OK`:

```json
{ "id": 1, "title": "Learn TypeScript and Express", "done": true }
```

If title sent but empty — `400 Bad Request`:

```json
{ "error": "Title cannot be empty" }
```

If not found — `404 Not Found`:

```json
{ "error": "Task not found" }
```

---

## 7. Delete a Task

**DELETE**

```text
/tasks/:id
```

Response — `200 OK`:

```json
{
  "message": "Task deleted successfully",
  "task": { "id": 2, "title": "Build a CRUD API", "done": false }
}
```

If not found — `404 Not Found`:

```json
{ "error": "Task not found" }
```

---

# CRUD Summary

| Operation     | HTTP Method | Endpoint     |
| ------------- | ----------- | ------------ |
| Create task   | POST        | `/tasks`     |
| Get all tasks | GET         | `/tasks`     |
| Get one task  | GET         | `/tasks/:id` |
| Update task   | PUT         | `/tasks/:id` |
| Delete task   | DELETE      | `/tasks/:id` |

## Task Object

```json
{
  "id": 1,
  "title": "Learn TypeScript",
  "done": false
}
```

| Property | Type    | Description                              |
| -------- | ------- | ----------------------------------------- |
| `id`     | number  | Unique identifier for the task            |
| `title`  | string  | Description/name of the task              |
| `done`   | boolean | Indicates whether the task is completed   |

## Testing With Swagger

1. `npm run dev`
2. Open `http://localhost:3000/api-docs`
3. Select an endpoint → **Try it out** → fill in params/body → **Execute**

## Testing With Thunder Client

```text
GET    http://localhost:3000/tasks
GET    http://localhost:3000/tasks/1
POST   http://localhost:3000/tasks      Body: { "title": "Learn Swagger" }
PUT    http://localhost:3000/tasks/1    Body: { "title": "Learn TypeScript properly", "done": true }
DELETE http://localhost:3000/tasks/1
```

## Screenshots

Screenshots of the API and Docker containers running are available in the [`/screenshots`](./screenshots) folder.

## Persistence Proof

To confirm data survives restarts:

1. Create a task via `POST /tasks`
2. Stop the app (`Ctrl+C`) and the container (`docker compose down` — **without** `-v`)
3. Restart the container (`docker compose up -d`) and the app (`npm run dev`)
4. `GET /tasks` — the created task is still present

This proves the `pgdata` Docker volume, not the container or the app process, is what actually holds the data.

## Error Handling

| Status | Meaning                        |
| ------ | ------------------------------ |
| `200`  | Request successful             |
| `201`  | Resource created successfully  |
| `400`  | Invalid request                |
| `404`  | Resource not found             |

## Learning Goals

* Express routing, HTTP methods, request params/bodies
* JSON responses, HTTP status codes, CRUD operations
* TypeScript interfaces and basic validation
* SQL (SQLite, then PostgreSQL)
* Docker, Docker Compose, volumes, and persistence
* Repository pattern for swappable data layers
* Async/await and Promise-based data access
* Swagger/OpenAPI documentation
* API testing

## Future Improvements

* Add authentication
* Add user accounts
* Add automated tests
* Add pagination, filtering, searching
* Add Redis caching
* Deploy the API online

## Author

**Samuel Oroja**

Computer Science Student

---

## License

This project is for learning and educational purposes.