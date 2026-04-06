# DevTrack Pro

> A high-performance SaaS platform for developer productivity, featuring polyglot persistence, robust CI/CD, and a decoupled architecture.

![CI/CD Status](https://img.shields.io/badge/CI%2FCD-GitHub_Actions-2088FF?style=flat-square&logo=github)
![Coverage](https://img.shields.io/badge/Coverage-80%25-brightgreen?style=flat-square)
![Backend](https://img.shields.io/badge/Backend-NestJS-E0234E?style=flat-square&logo=nestjs)
![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)

## Overview

DevTrack Pro is a full-stack developer productivity suite designed to handle complex project management and real-time analytics. Built with a modern micro-services mindset, it implements a **Polyglot Persistence** architecture, utilizing PostgreSQL for strong relational data consistency and MongoDB for high-speed metric aggregation.

## Key Features

* **Advanced Authentication:** Secure JWT-based auth with HTTP-only cookies and third-party API integration for reliable password recovery (via Resend HTTP API to bypass standard cloud SMTP restrictions).
* **Polyglot Database Architecture:** * Relational data (Users, Projects, Tasks) managed via **PostgreSQL** + TypeORM.
  * Application metrics and logging managed via **MongoDB** + Mongoose for optimized aggregation pipelines.
* **Automated CI/CD Pipeline:** Fully automated testing and deployment workflows using GitHub Actions.
* **Quality Assurance Gate:** Strict 80% minimum test coverage threshold enforced at the pipeline level before any deployment.

## Tech Stack

### Frontend (Deployed on Vercel)
* **Framework:** React 18 + Vite (TypeScript)
* **Styling:** Tailwind CSS
* **Testing:** Vitest + React Testing Library

### Backend (Deployed on Render)
* **Framework:** NestJS (TypeScript)
* **Persistence:** TypeORM & Mongoose
* **Email Service:** Resend (HTTP API)
* **Testing:** Jest (Unit & E2E)

### Infrastructure & Databases
* **PostgreSQL:** Serverless hosting via Neon.
* **MongoDB:** Cloud hosting via MongoDB Atlas.
* **CI/CD:** GitHub Actions (Automated build, test, and deploy triggers).

## Architecture & Deployment

The application follows a decoupled client-server architecture:
1. **GitHub Actions** acts as the gatekeeper. On every push to `main`, it provisions a Node.js runner, installs dependencies, lints, and runs the entire test suite.
2. If tests pass (and maintain >80% coverage), the pipeline signals the cloud providers.
3. **Render** pulls the backend code, injects secure environment variables, connects to the cloud databases via SSL, and exposes the RESTful API.
4. **Vercel** builds the optimized React static assets and deploys them to a global Edge CDN, dynamically routing API calls to the Render backend.

## Local Development Setup

To run this project locally, you will need Node.js (v20+) and Docker Desktop installed. We use Docker Compose to orchestrate the local database infrastructure.

### 1. Clone the repository
```bash
git clone [https://github.com/yourusername/devtrack-pro.git](https://github.com/yourusername/devtrack-pro.git)
cd devtrack-pro
```

### 2. Infrastructure Setup (Docker)

Spin up the local PostgreSQL and MongoDB instances in detached mode:

```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` directory:
```env
PORT=3000
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=root
POSTGRES_PASSWORD=rootpassword
POSTGRES_DB=devtrack_db
MONGO_URI=mongodb://root:rootpassword@localhost:27017/devtrack_metrics?authSource=admin
JWT_SECRET=your_super_secret_development_key
RESEND_API_KEY=your_resend_api_key
FRONTEND_URL=http://localhost:5173
```
Run the development server:
```bash
npm run start:dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```
Create a `.env.local` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:3000
```
Run the frontend:
```bash
npm run dev
```

## Testing

Testing is a first-class citizen in this project.
* **Backend:** `cd backend && npm run test:cov` (Generates full coverage report)
* **Frontend:** `cd frontend && npm run test` (Runs Vitest UI component tests)

## License
This project is licensed under the MIT License.