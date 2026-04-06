import express from "express";
import { createServer } from "node:http";
import { Server, Socket } from "socket.io";
import { configDotenv } from "dotenv";
import { connectDB } from "./db";
import { User } from "./models/User";
import { Message } from "./models/Message";

configDotenv();

const port = process.env.PORT || 5000;

const app = express();
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = createServer(app);
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",")
  : null; // null = allow all origins (dev mode)

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins ?? "*",
    methods: ["GET", "POST"],
  },
});

type PlayerState = {
  id: string;
  name: string;
  x: number;
  y: number;
  variant: number;
};

const players = new Map<string, PlayerState>();

io.on("connection", (socket: Socket) => {
  console.log("User connected:", socket.id);

  socket.on("join", async ({ name, variant = 0 }: { name: string; variant?: number }) => {
    const spawnX = 100 + Math.random() * 700;
    const spawnY = 100 + Math.random() * 400;

    const player: PlayerState = {
      id: socket.id,
      name,
      x: spawnX,
      y: spawnY,
      variant,
    };

    players.set(socket.id, player);

    // Send all current players to the new player
    socket.emit("current_players", {
      selfId: socket.id,
      players: Array.from(players.values()),
    });

    // Notify everyone else
    socket.broadcast.emit("player_joined", player);

    // Save to DB
    try {
      await User.create({ socketId: socket.id, name, x: spawnX, y: spawnY });
    } catch {
      // DB might not be connected
    }
  });

  socket.on("player_move", ({ x, y }: { x: number; y: number }) => {
    const player = players.get(socket.id);
    if (!player) return;

    player.x = x;
    player.y = y;

    socket.broadcast.emit("player_moved", { id: socket.id, x, y });
  });

  socket.on(
    "chat_message",
    async ({ message, targetId }: { message: string; targetId: string }) => {
      if (!targetId) return;

      const sender = players.get(socket.id);
      const receiver = players.get(targetId);
      if (!sender || !receiver) return;

      io.to(targetId).emit("chat_message", {
        senderName: sender.name,
        message,
        timestamp: Date.now(),
      });

      try {
        await Message.create({
          senderName: sender.name,
          receiverName: receiver.name,
          message,
        });
      } catch {
        // DB might not be connected
      }
    },
  );

  socket.on("player_action", ({ action }: { action: string }) => {
    socket.broadcast.emit("player_action", { id: socket.id, action });
  });

  socket.on("load_chat_history", async ({ partnerName }: { partnerName: string }) => {
    const me = players.get(socket.id);
    if (!me) return;

    try {
      const msgs = await Message.find({
        $or: [
          { senderName: me.name, receiverName: partnerName },
          { senderName: partnerName, receiverName: me.name },
        ],
      })
        .sort({ timestamp: 1 })
        .limit(100)
        .lean();

      const formatted = msgs.map((m) => ({
        senderName: m.senderName,
        message: m.message,
        timestamp: new Date(m.timestamp).getTime(),
      }));

      socket.emit("chat_history", formatted);
    } catch {
      // DB might not be connected — client will use local cache
    }
  });

  socket.on("disconnect", async () => {
    console.log("User disconnected:", socket.id);
    players.delete(socket.id);
    socket.broadcast.emit("player_left", { id: socket.id });

    // Mark disconnected in DB
    try {
      await User.updateOne(
        { socketId: socket.id, disconnectedAt: null },
        { disconnectedAt: new Date() },
      );
    } catch {
      // DB might not be connected
    }
  });
});

async function start() {
  await connectDB();
  httpServer.listen(port, () => console.log(`Server started on port ${port}`));
}

start();
