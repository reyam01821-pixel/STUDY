import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("study_platform.db");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET","POST"] }
});

app.use(express.json());

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if(!username) return res.status(400).json({ error: "Username required" });
  const user = { 
    id: Date.now().toString(), 
    username, 
    is_admin: password === "admin" ? 1 : 0 
  };
  res.json(user);
});

app.use(express.static(path.join(__dirname, "dist")));
app.get("*", (req, res) => {
  res.sendFile(path.resolve(__dirname, "dist", "index.html"));
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
