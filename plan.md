# CodeMeet Plan

A recommendation platform for programmers and coders, which matches people based on their interests, preferences and characteristics.

## 1. Project Requirements & Architecture

- **Backend**: Java / Spring Boot.
- **Frontend**: React / TypeScript / Vite.
- **Database**: PostgreSQL.
- **Core Entities**: User, Profile, Bio, Recommendations, Connections, Messages.
- **Authentication**: JWT & bcrypt.

## 2. Current Status (What is Done)
- ✅ Project scaffolding (Java Backend + React Frontend).
- ✅ User, Bio, and Profile entity models with their respective repositories.
- ✅ Registration & Login (bcrypt & JWT authentication).
- ✅ Basic User API endpoints (`/users/{id}`, `/me`).
- ✅ Updating and creating Bio & Profile API endpoints (`/me/bio`, `/me/profile`) with proper DB constraints and column definitions (`TEXT` for multi-select JSON stringification).
- ✅ **Step 1: Recommendation Engine** (Defined 5+ bio data points, scoring logic, `/recommendations` API endpoint).
- ✅ **Step 2: Connections** (Connection entities, states, `/connections` API endpoints, dismissing/accepting logic).
- ✅ **Step 3 Backend: Images & Files** (File system storage, `/api/me/profile-picture` upload endpoint, serving via static route `/uploads/**`).
- ✅ **Step 4 Backend: Real-time Chat** (WebSocket/STOMP setup, `Message` entity in DB, STOMP `/app/chat` mapping, read receipts, and pagination endpoints).
- ✅ **Frontend scaffolding** (Vite + React + Tailwind CSS).
- ✅ **Frontend Auth/Routing**: Login, Register UI with API integration and JWT storage, protected routes.
- ✅ **Frontend Onboarding Flow (`SetupBio.tsx`)**: Multi-step Cyberpunk-themed onboarding UI with completion %, validation, and multi-select. Backend saving working correctly (`/api/me/bio`).

## 3. Next Steps & Action Plan

### Step 3: Frontend Development (React)
- ✅ Create UI routing and protective wrappers for authenticated pages.
- ✅ **Auth Flow**: Build Login and Signup screens.
- ✅ **Onboarding Flow**: Screen to let user complete their Profile and Bio before exploring (complete with cyberpunk theme, multi-select, and completion %).
- ⏳ **Dashboard View**: View basic user status, links to other sections, and profile picture upload UI.
- **Match View**: Build the recommendation view (swipe right/left or list view with dismiss/connect actions).
- **Connections View**: See pending requests, accepted connections.
- **Chat View**: Real-time chat interface connecting to STOMP WebSocket, showing messages, time/date, unread tokens.
- **Profile View**: View and edit personal profile and bio data.

### Step 4: Mock Data & Review Prep
- Build a database seeder script or Spring ApplicationRunner to inject at least 100 fictitious users with varied bios and random connections into the DB to test scaling.

### Step 5: Extras (Optional)
- WebSockets for online status.
- Typing indicators using ephemeral WebSocket topics.
- GraphQL API setup for Match-Me GraphQL.
