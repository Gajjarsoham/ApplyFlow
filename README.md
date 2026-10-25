# ApplyFlow

ApplyFlow is a job application tracking backend built with Node.js, Express, and MongoDB.

## Features

- User registration and login
- Password hashing
- JWT authentication using HTTP-only cookies
- Logout and authentication middleware
- Create, read, update, and delete job applications
- Search, filtering, sorting, and pagination
- Dashboard statistics and application insights
- Centralized error handling
- Automated API tests using Jest and Supertest

## Requirements

- Node.js and npm
- MongoDB connection string

## Installation

Clone the repository and install dependencies:

```bash
npm install
```

Create a `.env` file in the project root with the configuration required by your application. For example:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Use your actual configuration variable names if they differ. Never commit real credentials or secrets.

## Run the application

Start the development server:

```bash
npm run dev
```

Or start it normally:

```bash
npm start
```

## Run automated tests

```bash
npm test
```

The current automated tests use mocked database models for database-dependent API tests. They verify application behavior without requiring those tests to connect to your development database.

## API

The API includes authentication endpoints, job application CRUD endpoints, search/filtering/pagination, and dashboard statistics. Refer to the route files in `src/routes` for the exact endpoint paths and request formats.
