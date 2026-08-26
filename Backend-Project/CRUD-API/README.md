# Task CRUD API

A simple **CRUD REST API** built with **Node.js, Express, and TypeScript**, with interactive API documentation using **Swagger UI**.

## Features

* Create a task
* Get all tasks
* Get a single task by ID
* Update a task
* Delete a task
* Health check endpoint
* API information endpoint
* Interactive Swagger API documentation
* TypeScript type safety

## Technologies Used

* **Node.js**
* **Express.js**
* **TypeScript**
* **Swagger UI Express**
* **Swagger JSDoc**

## Project Structure

```text
task-api/
│
├── src/
│   └── index.ts
│
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

Returns all tasks.

Example response:

```json
[
  {
    "id": 1,
    "title": "Learn TypeScript",
    "done": false
  },
  {
    "id": 2,
    "title": "Build a CRUD API",
    "done": false
  },
  {
    "id": 3,
    "title": "Test with Swagger",
    "done": true
  }
]
```

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
  "done": false
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
  "done": false
}
```

Status code:

```text
201 Created
```

If the title is missing:

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
  "done": true
}
```

You can also update only one property.

For example:

```json
{
  "done": true
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
    "done": false
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
| -------- | ------- | --------------------------------------- |
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

## Current Data Storage

This project currently stores tasks in an in-memory JavaScript array:

```ts
let tasks: Task[] = [
  { id: 1, title: "Learn TypeScript", done: false },
  { id: 2, title: "Build a CRUD API", done: false },
  { id: 3, title: "Test with Swagger", done: true }
];
```

This means the data is reset whenever the server restarts.

A future version can connect the API to a database such as PostgreSQL, MongoDB, or Supabase.

## Error Handling

The API returns appropriate HTTP status codes for common situations.

| Status | Meaning                       |
| ------ | ----------------------------- |
| `200`  | Request successful            |
| `201`  | Resource created successfully |
| `400`  | Invalid request               |
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
* Swagger/OpenAPI documentation
* API testing

## Future Improvements

Possible improvements include:

* Add a database
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
