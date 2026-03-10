# ASM Web Console - Backend API

This is the backend API service for the Attack Surface Management (ASM) Web Console. It provides data for the dashboard, issues portfolio, and digital footprint assets.

## Tech Stack

- **Framework**: [Express.js](https://expressjs.com/) with TypeScript
- **ORM**: [Prisma](https://www.prisma.io/) (v5)
- **Database**: SQLite (for local development)
- **Dev Tools**: `ts-node`, `nodemon` (via `node --watch`)

## Prerequisites

- Node.js (v20+ recommended)
- npm

## Getting Started

Follow these instructions to set up and run the backend server locally.

### 1. Install Dependencies

Navigate to the `apps/console` directory and install the required packages:

```bash
cd apps/console
npm install
```

### 2. Environment Variables

Create a `.env` file in the root of the `apps/console` directory (if it doesn't exist) and add the database URL for SQLite:

```env
DATABASE_URL="file:./dev.db"
```

### 3. Database Setup

The backend uses Prisma with SQLite. You need to create the database schema and seed it with initial data.

Run the following command to apply database migrations (this will create the `dev.db` file):

```bash
npx prisma migrate dev
```

Next, seed the database with initial dummy data so the frontend has something to display:

```bash
npm run seed
```

### 4. Running the Development Server

Start the Express development server with hot-reloading:

```bash
npm run dev
```

The server will start on port `3001`. You should see `Server is running on port 3001` in your console.

## API Endpoints

The following REST API endpoints are available:

- `GET /api/health` - Health check endpoint to verify the server is running.
- `GET /api/dashboard/summary` - Returns the overall assessment score, grade, and factor breakdown.
- `GET /api/issues` - Returns a list of security issues/vulnerabilities.
- `GET /api/assets` - Returns a list of digital footprint assets.

## Prisma Commands Reference

- `npx prisma generate` - Generates the Prisma Client (run this if you change `schema.prisma`).
- `npx prisma migrate dev` - Applies schema changes to the SQLite database.
- `npx prisma studio` - Opens a visual web interface to view and edit the data in your database.
