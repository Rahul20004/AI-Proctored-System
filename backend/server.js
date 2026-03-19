import express from "express";
import dotenv from "dotenv";
import { errorHandler, notFound } from "./middleware/errorMiddleware.js";
import connectDB from "./config/db.js";
import cookieParser from "cookie-parser";
import examRoutes from "./routes/examRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import codingRoutes from "./routes/codingRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import { exec } from "child_process";
import { writeFileSync } from "fs";
import path from "path";
import cors from "cors";

// 🔥 IMPORTANT FIX (load env properly)
dotenv.config({ path: "./backend/.env" });

// Debug (remove later)
console.log("MONGO_URL:", process.env.MONGO_URL);

// Connect DB
connectDB();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "https://ai-proctored-system.vercel.app",
      "http://localhost:3000",
      "http://localhost:5000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ================= RUN CODE APIs =================

// Python
app.post("/run-python", (req, res) => {
  const { code } = req.body;

  writeFileSync("script.py", code);

  exec("python script.py", (error, stdout, stderr) => {
    if (error) {
      return res.send(`Error: ${stderr}`);
    }
    res.send(stdout);
  });
});

// JavaScript
app.post("/run-javascript", (req, res) => {
  const { code } = req.body;

  writeFileSync("script.js", code);

  exec("node script.js", (error, stdout, stderr) => {
    if (error) {
      return res.send(`Error: ${stderr}`);
    }
    res.send(stdout);
  });
});

// Java
app.post("/run-java", (req, res) => {
  const { code } = req.body;

  writeFileSync("Main.java", code);

  exec("javac Main.java && java Main", (error, stdout, stderr) => {
    if (error) {
      return res.send(`Error: ${stderr}`);
    }
    res.send(stdout);
  });
});

// ================= ROUTES =================

app.use("/api/users", userRoutes);
app.use("/api/users", examRoutes);
app.use("/api/users", resultRoutes);
app.use("/api/coding", codingRoutes);

// ================= PRODUCTION =================

if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();

  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(
      path.resolve(__dirname, "frontend", "dist", "index.html")
    )
  );
} else {
  app.get("/", (req, res) => {
    res.send("<h1>Server is running 🚀</h1>");
  });
}

// ================= ERROR HANDLING =================

app.use(notFound);
app.use(errorHandler);

// ================= SERVER =================

app.listen(port, () => {
  console.log(`🔥 Server running on http://localhost:${port}`);
});