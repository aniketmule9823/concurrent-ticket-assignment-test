# Concurrent Ticket Assignment Test

## Project Overview
This project demonstrates safe concurrent ticket assignment using TypeScript, Prisma ORM, and PostgreSQL.

## Objective
When 20 assignment requests are made simultaneously for the same ticket:
- Exactly one request succeeds.
- The other 19 requests are rejected with HTTP 409 Conflict.
- Exactly one assignment record is created.

## Technologies Used
- TypeScript
- Node.js
- Prisma ORM
- PostgreSQL
- Vitest

## Concurrency Handling
- PostgreSQL row-level locking using SELECT FOR UPDATE.
- Optimistic locking using a ticket version field.
- Unique constraint on ticketId to prevent duplicate assignments.

## Run Locally
1. Install dependencies: npm install
2. Configure DATABASE_URL in prisma/.env.
3. Run migrations: npx prisma migrate dev
4. Run tests: npm test

## Note
This is a standalone prototype. Integration with the team's backend and CI pipeline remains pending.
