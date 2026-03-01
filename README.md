# CodeMeet

A full-stack recommendation application designed to connect developers, programmers, and hobbyists based on their programming languages, interests, and characteristics.

## Project Overview

CodeMeet is a Match-Me application tailored for coders. It provides:
- Secure User Authentication (JWT and bcrypt)
- Profile & Bio creation to highlight tech stack and interests
- An intelligent recommendation algorithm
- A connection system to link with like-minded peers
- Real-time chat between matching developers

## Current Status

We have implemented the following features:
- **Backend Setup**: Full Spring Boot foundational functionality with PostgreSQL integration.
- **Security**: User registration and login flow using JWT, and protected routes.
- **Core Entities**: Endpoints for creating and updating Bios and Profiles.
- **Matching & Connections**: A backend recommendation engine logic with scoring, and a complete connections system (accepting/dismissing).
- **Frontend Foundations**: React + Vite frontend scaffolding with Tailwind CSS integration.
- **UI Screens**: Authentication flows (Login/Register) and the fully functional Onboarding Flow (`SetupBio`) to configure multi-select profile variables.

Next phases involve adding image uploads, real-time chat, rendering the Match View on the frontend, and building out the rest of the application user interfaces.

## Setup and Installation Instructions

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL
- Maven

### Backend Setup (Spring Boot)
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Update `application.properties` with your PostgreSQL credentials.
3. Build and Start the backend server:
   ```bash
   ./mvnw spring-boot:run
   ```

### Frontend Setup (React/Vite)
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Usage Guide
Once both servers are running:
1. Open the frontend URL (typically `http://localhost:5173`).
2. Register for a new account.
3. Complete your Bio and Profile.
4. (Upcoming) Browse your developer matches on the recommendations page!

## Additional Features
- *To be documented once implemented (e.g. proximity-based recommendations, GraphQL API).*
