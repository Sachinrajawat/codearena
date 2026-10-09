const express = require('express')
const app = express()
app.set('trust proxy', 1);
require('dotenv').config();
const main = require('./config/db')
const cookieParser = require('cookie-parser');
const authRouter = require("./routes/authRouter");
const problemRouter = require('./routes/problemRouter')
const redisClient = require('./config/redis');
const submitRouter = require("./routes/submitRouter")
const cors = require('cors');
const aiRouter = require('./routes/aiChatting');

const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim());

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/user', authRouter);
app.use('/problem', problemRouter);
app.use('/submission', submitRouter);
app.use('/ai', aiRouter);

const initializeConnection = async () => {
    try {
        await Promise.all([main(), redisClient.connect()]);
        console.log("DB Connected");
        app.listen(process.env.PORT, () => {
            console.log("Server listening at port number: " + process.env.PORT);
        })
    } catch (error) {
        console.error("Startup failed:", error.message);
        process.exit(1); // don't leave a dead process running
    }
}

initializeConnection();