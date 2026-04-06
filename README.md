
![Konect](client/public/logo.svg)

A real-time multiplayer virtual space where players walk around an office environment, bump into each other, and start conversations — kind of like what would happen if you shrunk a coworking space into a browser tab.

**Live:** [client-rho-five-84.vercel.app](https://client-rho-five-84.vercel.app)


## What is this?

Konect is a proximity-based chat app disguised as a top-down pixel art game. You enter a name, spawn into a virtual office, and walk around using WASD. When you get close to another player, the app asks if you want to connect. If you accept, a chat sidebar opens and you can talk — just like walking up to someone's desk in real life.

The twist: you can only chat with people you're physically near in the game world. No friend lists, no search bars. Just walk up and say hi.

## How it works

### The short version

```
React (UI) ←→ Pixi.js (game rendering) ←→ Socket.IO (real-time sync) ←→ Express + MongoDB (persistence)
```

### The longer version

The app is split into two parts that talk to each other over WebSockets:

**Client** — A Vite + React app that handles two jobs:
- **Pixi.js** renders the game world: the office floor, furniture, walls, and animated player characters. It runs a 60fps game loop that handles movement, collision detection, and proximity checks.
- **React** handles everything outside the canvas: the join screen, the connection confirmation modal, the chat sidebar, the player list, and the mobile d-pad controls.

These two systems communicate through callbacks. Pixi tells React "hey, there's a player nearby" and React decides what UI to show. React tells Pixi "the chat input is focused" so Pixi stops processing WASD keys. Clean separation.

**Server** — An Express + Socket.IO server that keeps everyone in sync. When you move, your position broadcasts to everyone else. When you send a chat message, it goes directly to the recipient (not broadcast). MongoDB stores user sessions and chat history so messages persist across reconnections.

### Why these choices?

**Pixi.js over raw Canvas** — Pixi gives us animated sprites, containers, and a proper scene graph without the weight of a full game engine. The characters use [LPC (Liberated Pixel Cup)](https://lpc.opengameart.org/) sprite sheets — community-made pixel art that's composited at load time from separate body/head/hair/clothes layers. Each player gets a unique character based on their name.

**React for UI, not for the game** — React is great at forms, modals, and chat interfaces. It's terrible at running a 60fps game loop. So the game lives in a Pixi Application that React mounts via `useEffect`, and they talk through a clean callback interface. No React re-renders during gameplay.

**Socket.IO over raw WebSockets** — Auto-reconnection, room support (ready if we need it later), and the `io.to(socketId)` pattern for direct messaging. Chat messages go point-to-point, not through broadcast — so two people chatting don't generate traffic for everyone else.

**Camera system for mobile** — Instead of shrinking the whole world to fit a phone screen (unplayable), the game zooms in and follows your character. On desktop you see most of the office. On mobile portrait you see a comfortable window around your player. Same world, different viewport.

**Collision that doesn't trap you** — The collision system checks if you're already inside an object before enforcing boundaries. If you spawn on a table or stand up from a chair into a wall, you can walk out freely. Once you're in open space, normal collision kicks in. This prevents the classic "stuck in geometry" problem.

## The office

The game world is a furnished office space with three zones:

- **Lounge** (left) — Sofas, coffee table, bookshelves. The chill zone.
- **Workspace** (middle) — Desks with monitors, a shared table with chairs. Where the "work" happens.
- **Conference room** (right) — Big table, chairs, whiteboard. For important pixel meetings.
- **Cafe** (bottom) — Small tables and chairs. Coffee not included.

Players can sit on chairs and sofas (press E or tap the button). The character plays a sit animation and snaps onto the seat. Other players see you sitting too.

## Project structure

```
Konect/
├── client/                     # React + Pixi.js frontend
│   ├── public/
│   │   ├── sprites/            # LPC character sprite sheets (CC0)
│   │   ├── favicon.svg         # App icon
│   │   └── logo.svg            # Full logo
│   └── src/
│       ├── components/         # React UI components
│       │   ├── JoinScreen.tsx   # Name input form
│       │   ├── GameScreen.tsx   # Main game + HUD + mobile controls
│       │   ├── ChatSidebar.tsx  # 1-to-1 chat panel
│       │   └── ConnectionModal.tsx  # "Connect with X?" popup
│       ├── pixi/               # Game engine layer
│       │   ├── PixiGame.ts     # Core game loop, camera, input, socket bridge
│       │   ├── Player.ts       # Animated character (walk/sit, name tag, proximity)
│       │   ├── World.ts        # Floor, grid, renders environment
│       │   ├── WorldObjects.ts # Furniture layout, collision, seat detection
│       │   └── SpriteLoader.ts # LPC spritesheet compositing + frame extraction
│       ├── App.tsx             # Join → Game routing
│       ├── socket.ts           # Socket.IO singleton
│       └── types.ts            # Shared types
│
└── server/                     # Express + Socket.IO backend
    └── src/
        ├── index.ts            # Socket events, game state, chat routing
        ├── db.ts               # MongoDB connection (graceful fallback)
        └── models/
            ├── User.ts         # Player sessions
            └── Message.ts      # Chat history
```

## Running locally

```bash
# Terminal 1 — server
cd server
cp .env.example .env            # Edit with your MongoDB URI (optional)
npm install
npm run dev

# Terminal 2 — client
cd client
npm install
npm run dev
```

Open http://localhost:8080 in two browser tabs, enter different names, and walk towards each other.

## Deployment

The app runs on:
- **Frontend:** Vercel (static site)
- **Backend:** Render free tier (with UptimeRobot pinging `/health` every 2 minutes to prevent sleep)
- **Database:** MongoDB Atlas free tier (optional — app works without it)

### Environment variables

**Client** (Vercel):
```
VITE_SERVER_URL=https://your-server.onrender.com
```

**Server** (Render):
```
PORT=5000
MONGODB_URI=mongodb+srv://...
CLIENT_URL=https://your-app.vercel.app
```

## Design system

The UI follows the [VoltAgent](https://github.com/) design system — a dark, engineering-forward aesthetic:

- **Abyss black** (`#050507`) backgrounds
- **Emerald signal** (`#00d992`) for accents, active states, and self-player color
- **Coral** (`#fb565b`) for other players
- **Warm charcoal** (`#3d3a39`) borders — depth through borders, not shadows
- **Inter** for typography

## Controls

| Input | Action |
|-------|--------|
| WASD | Move |
| Shift | Sprint |
| E | Sit / Stand (when near a seat) |
| Mobile d-pad | Move (touch) |
| Sprint button | Sprint (touch) |

## Credits

- Character sprites: [Liberated Pixel Cup](https://lpc.opengameart.org/) (CC0)
- Design system: Inspired by VoltAgent
- Built with: React, Pixi.js v8, Socket.IO, Express, MongoDB, Tailwind CSS

## License

MIT
