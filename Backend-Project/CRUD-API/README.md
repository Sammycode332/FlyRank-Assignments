# Task CRUD API

A simple **CRUD REST API** built with **Node.js, Express, and TypeScript**, backed by a **SQLite database** (via `better-sqlite3`), with interactive API documentation using **Swagger UI**.

## Features

* Create a task
* Get all tasks
* Get a single task by ID
* Update a task
* Delete a task
* Health check endpoint
* API information endpoint
* Interactive Swagger API documentation
* Persistent storage with SQLite
* TypeScript type safety

## Technologies Used

* **Node.js**
* **Express.js**
* **TypeScript**
* **better-sqlite3**
* **Swagger UI Express**
* **Swagger JSDoc**

## Project Structure

```text
task-api/
│
├── src/
│   └── index.ts
├── screenshots/
├── tasks.db
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

## Running the Application

Start the development server:

```bash
npm run dev
```

The server will run on:

```text
http://localhost:3000
```

On first run, a `tasks.db` SQLite file is created automatically in the project root, and the `tasks` table is seeded with 3 example tasks if it's empty.

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

Returns basic information about the API.

Example response:

```json
{
  "name": "Task API",
  "version": "1.0",
  "endpoints": [
    "/tasks"
  ]
}
```

---

### 2. Health Check

**GET**

```text
/health
```

Checks whether the server is running.

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

Returns all tasks from the database.

Example response:

```json
[
  {
    "id": 1,
    "title": "Learn TypeScript",
    "done": 0
  },
  {
    "id": 2,
    "title": "Build a CRUD API",
    "done": 0
  },
  {
    "id": 3,
    "title": "Test with Swagger",
    "done": 1
  }
]
```

> Note: SQLite stores booleans as `0`/`1` under the hood, so `done` is returned as an integer.

---

## 4. Get a Task by ID

**GET**

```text
/tasks/:id
```

Example:

```text
/tasks/1
```

Example response:

```json
{
  "id": 1,
  "title": "Learn TypeScript",
  "done": 0
}
```

If the task doesn't exist:

```json
{
  "message": "Task 999 not found"
}
```

Status code:

```text
404 Not Found
```

---

## 5. Create a Task

**POST**

```text
/tasks
```

Request body:

```json
{
  "title": "Learn Express"
}
```

Example response:

```json
{
  "id": 4,
  "title": "Learn Express",
  "done": 0
}
```

Status code:

```text
201 Created
```

If the title is missing or empty:

```json
{
  "error": "Title is required"
}
```

Status code:

```text
400 Bad Request
```

---

## 6. Update a Task

**PUT**

```text
/tasks/:id
```

Example:

```text
/tasks/1
```

Request body:

```json
{
  "title": "Learn TypeScript and Express",
  "done": true
}
```

Example response:

```json
{
  "id": 1,
  "title": "Learn TypeScript and Express",
  "done": 1
}
```

You can also update only one property.

For example:

```json
{
  "done": true
}
```

If the title is sent but empty:

```json
{
  "error": "Title cannot be empty"
}
```

Status code:

```text
400 Bad Request
```

If the task doesn't exist:

```json
{
  "error": "Task not found"
}
```

Status code:

```text
404 Not Found
```

---

## 7. Delete a Task

**DELETE**

```text
/tasks/:id
```

Example:

```text
/tasks/2
```

Example response:

```json
{
  "message": "Task deleted successfully",
  "task": {
    "id": 2,
    "title": "Build a CRUD API",
    "done": 0
  }
}
```

If the task doesn't exist:

```json
{
  "error": "Task not found"
}
```

Status code:

```text
404 Not Found
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

Each task follows this structure:

```json
{
  "id": 1,
  "title": "Learn TypeScript",
  "done": false
}
```

### Properties

| Property | Type    | Description                             |
| -------- | ------- | ---------------------------------------- |
| `id`     | number  | Unique identifier for the task          |
| `title`  | string  | Description/name of the task            |
| `done`   | boolean | Indicates whether the task is completed |

## Testing With Swagger

1. Start the server:

```bash
npm run dev
```

2. Open:

```text
http://localhost:3000/api-docs
```

3. Select an endpoint.

4. Click **Try it out**.

5. Enter the required parameters or request body.

6. Click **Execute**.

Swagger will show the request, response, and HTTP status code.

## Testing With Thunder Client

You can also test the API using Thunder Client in VS Code.

### Get all tasks

```text
GET http://localhost:3000/tasks
```

### Get one task

```text
GET http://localhost:3000/tasks/1
```

### Create task

```text
POST http://localhost:3000/tasks
```

Body:

```json
{
  "title": "Learn Swagger"
}
```

### Update task

```text
PUT http://localhost:3000/tasks/1
```

Body:

```json
{
  "title": "Learn TypeScript properly",
  "done": true
}
```

### Delete task

```text
DELETE http://localhost:3000/tasks/1
```

## Screenshots

Screenshots of the API in action (Swagger UI and/or Thunder Client) are available in the [`/screenshots`](./screenshots) folder.

## Data Storage

This project stores tasks in a **SQLite database** (`tasks.db`) using `better-sqlite3`.

```ts
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL
  );
`);
```

Unlike an in-memory array, data now **persists between server restarts**, since it's saved to disk in `tasks.db`.

A future version can connect the API to a hosted database such as PostgreSQL, MySQL, or Supabase.

## Error Handling

The API returns appropriate HTTP status codes for common situations.

| Status | Meaning                       |
| ------ | ------------------------------ |
| `200`  | Request successful            |
| `201`  | Resource created successfully |
| `400`  | Invalid request                |
| `404`  | Resource not found            |

## Learning Goals

This project demonstrates the fundamentals of building a REST API with TypeScript:

* Express routing
* HTTP methods
* Request parameters
* Request bodies
* JSON responses
* HTTP status codes
* CRUD operations
* TypeScript interfaces
* Basic validation
* SQL database integration (SQLite)
* Swagger/OpenAPI documentation
* API testing

## Future Improvements

Possible improvements include:

* Switch to a hosted database (PostgreSQL/MySQL)
* Add authentication
* Add user accounts
* Add middleware for validation
* Add better error handling
* Add automated tests
* Add pagination
* Add filtering and searching
* Add environment variables
* Deploy the API online

## Author

**Samuel Oroja**

Computer Science Student

---

## License

This project is for learning and educational purposes.