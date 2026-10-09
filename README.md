# CodeArena

A LeetCode-style coding practice platform. Users browse problems, write solutions in an in-browser editor, run them against example tests, submit them against hidden tests, and ask an AI assistant for hints. Admins create, update and delete problems, and every reference solution is verified by actually running it before a problem is saved.

**Live demo:** https://codearena-beryl.vercel.app

> The backend runs on a free instance that sleeps after about 15 minutes of inactivity, so the first request after a quiet period can take up to a minute.

---

## Features

**For users**
- Sign up, log in and log out with cookie-based JWT authentication
- Browse problems and filter by difficulty, tag and solved or unsolved status
- Solve problems in a Monaco editor (the editor used by VS Code) in C++, Java or JavaScript
- **Run** code against the visible example test cases without saving anything
- **Submit** code against hidden test cases, with status, runtime and memory recorded
- Submission history per problem, with a viewer for the submitted source code
- Solved problems are marked on the problem list
- AI chat assistant (Google Gemini) that gives hints and explanations for the open problem

**For admins**
- Create, update and delete problems from an admin panel
- Reference solutions in all three languages are executed against both the visible and the hidden test cases before a problem is saved, so a broken problem can't be published
- Deleting a problem also removes its submissions and its entries in users' solved lists

**Security and reliability**
- Passwords hashed with bcrypt
- JWT stored in an `httpOnly` cookie, with a Redis blocklist so logged-out tokens stop working immediately
- Role-based access control: separate user and admin middleware
- Allow-listed fields on register, create and update, so clients can't set roles or other protected fields
- Per-user rate limits on Run, Submit and AI chat
- Consistent JSON error responses with proper HTTP status codes

---

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, Redux Toolkit, React Router, Tailwind CSS 4, DaisyUI 5, React Hook Form, Zod, Monaco Editor, Axios |
| Backend | Node.js, Express 5, Mongoose, node-redis, JSON Web Tokens, bcrypt, validator, express-rate-limit |
| Database | MongoDB Atlas |
| Cache | Redis (token blocklist) |
| Code execution | Judge0 CE through RapidAPI |
| AI | Google Gemini (`@google/genai`) |
| Hosting | Vercel (frontend), Render (backend) |

---

## Architecture

```
Browser
   |
   |  https://<frontend>/              React app (Vercel)
   |  https://<frontend>/api/*         proxied by a Vercel rewrite
   v
Express API (Render)
   |-- MongoDB Atlas    users, problems, submissions
   |-- Redis            blocklist of logged-out tokens
   |-- Judge0 CE        runs code against test cases
   '-- Google Gemini    AI hints
```

The frontend calls `/api/...`, and a rewrite in `frontend/vercel.json` forwards those calls to the backend with the `/api` prefix removed. The browser therefore only talks to one origin, which keeps the login cookie first-party.

**Request flow on the backend:** route, then authentication middleware (user or admin), then rate limiter where one applies, then controller, then model.

**How code is judged:** the controller builds one Judge0 submission per test case, sends them as a batch, then polls for the results and maps the Judge0 status codes to Accepted, Wrong Answer, Compilation Error, Runtime Error or Time Limit Exceeded.

---

## Project structure

```
codearena/
|-- backend/
|   |-- package.json
|   '-- src/
|       |-- index.js               app entry, CORS, routes, startup
|       |-- config/
|       |   |-- db.js              MongoDB connection
|       |   '-- redis.js           Redis client and error handling
|       |-- controllers/
|       |   |-- userAuthent.js     register, login, logout, admin register, delete profile
|       |   |-- userProblem.js     problem CRUD, solved list, submission history
|       |   |-- userSubmission.js  run and submit code
|       |   '-- solveDoubt.js      AI chat
|       |-- middleware/
|       |   |-- userMiddleware.js
|       |   |-- adminMiddleware.js
|       |   '-- rateLimiters.js
|       |-- models/                user, problem, submission
|       |-- routes/                authRouter, problemRouter, submitRouter, aiChatting
|       '-- utils/
|           |-- ProblemUtility.js  Judge0 client (batching, polling, language mapping)
|           |-- cookieOptions.js
|           '-- validate.js
'-- frontend/
    |-- package.json
    |-- vercel.json                /api proxy and SPA fallback
    '-- src/
        |-- App.jsx                routes and auth gate
        |-- authSlice.js, problemSlice.js, store/
        |-- utils/axiosClient.js
        |-- pages/                 Homepage, Login, Signup, ProblemPage, AdminDashboard
        '-- components/            CreateProblem, UpdateProblem, AdminUpdate, AdminDelete,
                                   SubmissionHistory, ChatAi
```

---

## API reference

All routes return JSON. Errors look like `{ "message": "..." }`.

### Auth, mounted at `/user`

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Create an account (`firstName`, `emailId`, `password`) |
| POST | `/login` | Public | Log in, sets the `token` cookie |
| POST | `/logout` | User | Blocklists the token and clears the cookie |
| GET | `/check` | User | Returns the current user, used to restore the session |
| POST | `/admin/register` | Admin | Create another admin |
| DELETE | `/deleteProfile` | User | Delete the account and its submissions |

### Problems, mounted at `/problem`

| Method | Route | Access | Description |
|---|---|---|---|
| GET | `/getAllProblem` | User | List problems (id, title, difficulty, tags) |
| GET | `/problemByID/:id` | User | One problem with visible test cases and starter code |
| GET | `/problemSolvedByUser` | User | The current user's solved problems |
| GET | `/submittedProblem/:pid` | User | The current user's submissions for a problem |
| POST | `/create` | Admin | Create a problem after verifying reference solutions |
| PUT | `/update/:id` | Admin | Update a problem after verifying reference solutions |
| GET | `/admin/problemByID/:id` | Admin | Full problem including hidden test cases |
| DELETE | `/delete/:id` | Admin | Delete a problem and its related data |

### Submissions, mounted at `/submission`

| Method | Route | Access | Rate limit | Description |
|---|---|---|---|---|
| POST | `/run/:id` | User | 10 per minute | Run against visible test cases |
| POST | `/submit/:id` | User | 5 per minute | Judge against hidden test cases and save the result |

### AI, mounted at `/ai`

| Method | Route | Access | Rate limit | Description |
|---|---|---|---|---|
| POST | `/chat` | User | 10 per minute | Ask the AI assistant about a problem |

---

## Running locally

**Prerequisites:** Node.js 20 or newer, a MongoDB database (Atlas free tier works), a Redis instance, a [Judge0 CE](https://rapidapi.com/judge0-official/api/judge0-ce) key from RapidAPI (subscribe to a plan), and a Gemini API key.

### 1. Clone and install
```bash
git clone https://github.com/<your-username>/codearena.git
cd codearena

cd backend && npm install
cd ../frontend && npm install
```

### 2. Backend environment
Create `backend/.env`:
```env
PORT=3000
DB_CONNECT_STRING=<your MongoDB connection string>
JWT_KEY=<a long random string>
REDIS_PASS=<your Redis password>
JUDGE0_API_KEY=<your RapidAPI key>
GEMINI_API_KEY=<your Gemini key>
```

Optional variables:

| Variable | Default | Purpose |
|---|---|---|
| `REDIS_HOST`, `REDIS_PORT` | built-in defaults | Point at your own Redis instance |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated list of allowed frontend origins |
| `NODE_ENV` | unset | Set to `production` to make the cookie `Secure` (HTTPS only) |
| `COOKIE_SAMESITE` | `lax` | Use `none` only if frontend and backend are on different domains |

Generate a `JWT_KEY` with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Start both servers
```bash
# terminal 1
cd backend
npm start

# terminal 2
cd frontend
npm run dev
```
Open http://localhost:5173. In development the frontend calls `http://localhost:3000` directly, so no frontend `.env` is needed.

### 4. Create the first admin
Admin registration requires an existing admin, so the first one is set up by hand:
1. Sign up normally through the app.
2. In MongoDB (Compass or the Atlas UI), open the `users` collection and change that user's `role` from `user` to `admin`.
3. Log out and log in again, so the new role is in your token.

---

## Writing problems

- Input is passed to the program on standard input, and the program's standard output is compared with the expected output.
- Every problem needs a starter template and a reference solution in **all three** languages (C++, Java, JavaScript).
- Java solutions must use a class named `Main`.
- A problem needs at least one visible and one hidden test case. The reference solutions must pass **all** of them, or the problem is rejected with the failing language, test case and compiler output.
- Each create or update runs every language against every test case on Judge0, so it takes a few seconds and uses API quota.

---

## Deployment

The app is deployed on free tiers:

| Part | Service | Settings |
|---|---|---|
| Frontend | Vercel | Root directory `frontend`, environment variable `VITE_API_URL=/api` |
| Backend | Render | Root directory `backend`, build `npm install`, start `npm start`, all backend variables plus `NODE_ENV=production` and `CORS_ORIGINS=<frontend URL>` |
| Database | MongoDB Atlas | Network access must allow the backend, which has no fixed IP on the free tier |
| Cache | Redis Cloud | |

`frontend/vercel.json` holds the proxy and single-page-app rules:
```json
{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://<your-backend-host>/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```
Replace `<your-backend-host>` with your backend's host name, with no `/api` and no trailing slash. Pushing to `main` redeploys both services.

---

## Known limitations

- **Code execution depends on Judge0 quota.** Every Run, Submit and problem save consumes requests on your RapidAPI plan.
- **The AI chat is stateless.** Each message is sent on its own, so the assistant does not remember earlier messages, and the chat history clears when you leave the tab.
- **Reference solutions are visible** on the Solutions tab of every problem.
- **One tag per problem**, chosen from `array`, `linkedList`, `graph` and `dp`.
- **The Editorial tab is a placeholder.**
- **Rate limits are kept in memory**, so they reset when the server restarts and aren't shared across multiple server instances.
- **Cold starts** on the free hosting tier.

---

## Author

[@Sachinrajawat](https://github.com/Sachinrajawat)