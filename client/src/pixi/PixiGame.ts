import { Application, Container } from "pixi.js";
import { Player } from "./Player";
import { World } from "./World";
import { socket } from "../socket";
import { loadAllVariants, pickVariant, type CharacterFrames } from "./SpriteLoader";
import { collidesWithObject, findNearbySeat, type ObjectDef } from "./WorldObjects";
import type { NearbyPlayer, PlayerState } from "../types";

const MAP_X = 20;
const MAP_Y = 20;
const AREA_W = 1100;
const AREA_H = 620;
const SEAT_RANGE = 50;

export type OnlinePlayer = { id: string; name: string; isSelf: boolean };

type Callbacks = {
  onNearby: (player: NearbyPlayer) => void;
  onLeaveProximity: () => void;
  onPlayersChanged: (players: OnlinePlayer[]) => void;
  onSeatNearby: (canSit: boolean) => void;
};

export class PixiGame {
  private app: Application | null = null;
  private worldContainer: Container | null = null;
  private players = new Map<string, Player>();
  private selfId: string | null = null;
  private activeNearbyId: string | null = null;
  private keys: Record<string, boolean> = {};
  private chatFocused = false;
  private destroyed = false;
  private variants: CharacterFrames[] = [];
  private wasSeatNearby = false;
  private camScale = 1;
  private lastSeat: ObjectDef | null = null;

  constructor(private callbacks: Callbacks) {}

  setChatFocused(focused: boolean) { this.chatFocused = focused; }
  setKey(key: string, down: boolean) { this.keys[key] = down; }

  toggleSit() {
    if (!this.selfId) return;
    const me = this.players.get(this.selfId);
    if (!me) return;

    if (me.sitting) {
      // Move player out of the chair (below it) so collision doesn't trap them
      if (this.lastSeat) {
        const outY = this.lastSeat.y + this.lastSeat.h + me.radius + 2;
        me.setPosition(me.x, outY);
        socket.emit("player_move", { x: me.x, y: outY });
        this.lastSeat = null;
      }
      me.stand();
      socket.emit("player_action", { action: "stand" });
    } else {
      const seat = findNearbySeat(me.x, me.y, SEAT_RANGE);
      if (seat) {
        const seatX = seat.x + seat.w / 2;
        const seatY = seat.y + seat.h / 2;
        me.setPosition(seatX, seatY);
        socket.emit("player_move", { x: seatX, y: seatY });
        this.lastSeat = seat;
        me.sit();
        socket.emit("player_action", { action: "sit" });
      }
    }
  }

  private calcScale(): number {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const totalW = AREA_W + MAP_X * 2;
    const totalH = AREA_H + MAP_Y * 2;

    const isPortrait = vh > vw;
    if (isPortrait) {
      // Mobile portrait: fit ~450px of world width on screen
      return Math.max(vw / 450, 0.6);
    }
    // Landscape: fit the whole world or close to it
    return Math.min(vw / totalW, vh / totalH, 1.2);
  }

  private updateCamera() {
    if (!this.worldContainer || !this.selfId) return;
    const me = this.players.get(this.selfId);
    if (!me) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const s = this.camScale;

    // Center player on screen
    let cx = vw / 2 - (MAP_X + me.x) * s;
    let cy = vh / 2 - (MAP_Y + me.y) * s;

    // Clamp so camera doesn't go outside world
    const worldPxW = (AREA_W + MAP_X * 2) * s;
    const worldPxH = (AREA_H + MAP_Y * 2) * s;

    if (worldPxW <= vw) {
      cx = (vw - worldPxW) / 2; // Center if world fits
    } else {
      cx = Math.min(0, Math.max(vw - worldPxW, cx));
    }

    if (worldPxH <= vh) {
      cy = (vh - worldPxH) / 2;
    } else {
      cy = Math.min(0, Math.max(vh - worldPxH, cy));
    }

    this.worldContainer.x = cx;
    this.worldContainer.y = cy;
  }

  async mount(container: HTMLElement, name: string) {
    const app = new Application();
    const [variants] = await Promise.all([
      loadAllVariants(),
      app.init({ background: "#080a0f", resizeTo: window }),
    ]);

    if (this.destroyed) { app.destroy(true); return; }

    this.app = app;
    this.variants = variants;
    container.appendChild(app.canvas);

    // World container holds everything — camera moves this
    const wc = new Container();
    this.worldContainer = wc;
    this.camScale = this.calcScale();
    wc.scale.set(this.camScale);
    app.stage.addChild(wc);

    new World(MAP_X, MAP_Y, AREA_W, AREA_H).addToStage(wc);

    // Recalc on resize
    const onResize = () => {
      this.camScale = this.calcScale();
      wc.scale.set(this.camScale);
    };
    window.addEventListener("resize", onResize);

    this.setupSocketListeners();
    this.setupKeyboard();
    this.setupGameLoop();

    socket.connect();
    socket.emit("join", { name });
  }

  destroy() {
    this.destroyed = true;
    socket.off("current_players");
    socket.off("player_joined");
    socket.off("player_moved");
    socket.off("player_left");
    socket.off("player_action");
    socket.disconnect();

    if (this.app) {
      this.app.ticker.stop();
      this.app.destroy(true);
      this.app = null;
    }
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  private emitPlayerList() {
    const list: OnlinePlayer[] = [];
    this.players.forEach((p) => list.push({ id: p.id, name: p.name, isSelf: p.isSelf }));
    this.callbacks.onPlayersChanged(list);
  }

  private setupSocketListeners() {
    socket.on("current_players", ({ selfId, players }: { selfId: string; players: PlayerState[] }) => {
      this.selfId = selfId;
      for (const p of players) this.addPlayer(p, p.id === selfId);
      this.emitPlayerList();
    });

    socket.on("player_joined", (p: PlayerState) => {
      if (!this.players.has(p.id)) { this.addPlayer(p, false); this.emitPlayerList(); }
    });

    socket.on("player_moved", ({ id, x, y }: { id: string; x: number; y: number }) => {
      if (id !== this.selfId) this.players.get(id)?.setPosition(x, y);
    });

    socket.on("player_left", ({ id }: { id: string }) => {
      const p = this.players.get(id);
      if (p && this.worldContainer) {
        p.removeFromStage(this.worldContainer);
        this.players.delete(id);
        if (this.activeNearbyId === id) { this.activeNearbyId = null; this.callbacks.onLeaveProximity(); }
        this.emitPlayerList();
      }
    });

    socket.on("player_action", ({ id, action }: { id: string; action: string }) => {
      const p = this.players.get(id);
      if (!p || id === this.selfId) return;
      if (action === "sit") p.sit();
      else if (action === "stand") p.stand();
    });
  }

  private addPlayer(p: PlayerState, isSelf: boolean) {
    if (!this.worldContainer || this.variants.length === 0) return;
    const frames = this.variants[pickVariant(p.name)];
    const player = new Player({ id: p.id, name: p.name, mapX: MAP_X, mapY: MAP_Y, x: p.x, y: p.y, isSelf, frames });
    player.addToStage(this.worldContainer);
    this.players.set(p.id, player);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.chatFocused) return;
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === "e") this.toggleSit();
  };

  private onKeyUp = (e: KeyboardEvent) => { this.keys[e.key.toLowerCase()] = false; };

  private setupKeyboard() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
  }

  private setupGameLoop() {
    if (!this.app) return;
    const speed = 3;
    const boostSpeed = 6;

    this.app.ticker.add((ticker) => {
      if (!this.selfId) return;
      const me = this.players.get(this.selfId);
      if (!me) return;

      if (!me.sitting) {
        const delta = ticker.deltaTime;
        const s = this.keys["shift"] ? boostSpeed : speed;
        let px = me.x;
        let py = me.y;

        if (this.keys["w"]) py -= s * delta;
        if (this.keys["s"]) py += s * delta;
        if (this.keys["a"]) px -= s * delta;
        if (this.keys["d"]) px += s * delta;

        px = Math.max(me.radius, Math.min(px, AREA_W - me.radius));
        py = Math.max(me.radius, Math.min(py, AREA_H - me.radius));

        // Only enforce collision if we're NOT already stuck inside an object.
        // If current position already collides, let the player move out freely.
        const alreadyInside = collidesWithObject(me.x, me.y, me.radius);
        if (!alreadyInside) {
          if (collidesWithObject(px, me.y, me.radius)) px = me.x;
          if (collidesWithObject(me.x, py, me.radius)) py = me.y;
          if (collidesWithObject(px, py, me.radius)) { px = me.x; py = me.y; }
        }

        me.setPosition(px, py);
        socket.emit("player_move", { x: px, y: py });
      }

      this.players.forEach((p) => p.update());

      // Camera follow
      this.updateCamera();

      // Seat proximity
      const seatNearby = !!findNearbySeat(me.x, me.y, SEAT_RANGE);
      if (seatNearby !== this.wasSeatNearby) {
        this.wasSeatNearby = seatNearby;
        this.callbacks.onSeatNearby(seatNearby || me.sitting);
      }

      // Player proximity
      let nearestId: string | null = null;
      let nearestDist = Infinity;
      this.players.forEach((other, id) => {
        if (id === this.selfId) return;
        const dx = me.x - other.x;
        const dy = me.y - other.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < me.proximityRadius && dist < nearestDist) { nearestDist = dist; nearestId = id; }
      });

      if (nearestId !== this.activeNearbyId) {
        if (nearestId) {
          const np = this.players.get(nearestId)!;
          this.callbacks.onNearby({ id: nearestId, name: np.name });
        } else {
          this.callbacks.onLeaveProximity();
        }
        this.activeNearbyId = nearestId;
      }
    });
  }
}
