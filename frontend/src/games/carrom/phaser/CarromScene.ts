import * as Phaser from 'phaser';
import { playCarromSound } from '../audio';
import {
  allResting,
  applyImpulse,
  BOARD,
  clampToBaseline,
  MAX_STEPS,
  radiusOf,
  stepWorld,
} from '../engine/physics';
import { createOpeningPieces } from '../engine/layout';
import type { CarromBoardState, CarromColor, CarromPiece, CarromShotInput } from '../types';
import { drawCarromBoard, drawPieceTexture } from './boardDraw';

export interface CarromSceneCallbacks {
  onAim: (power: number, angle: number, active: boolean) => void;
  onShoot: (input: CarromShotInput) => void;
}

interface SpritePiece {
  id: string;
  kind: CarromPiece['kind'];
  sprite: Phaser.GameObjects.Image;
  shadow: Phaser.GameObjects.Ellipse;
}

const VIEW = 900;

export class CarromScene extends Phaser.Scene {
  private pieces: CarromPiece[] = [];
  private sprites = new Map<string, SpritePiece>();
  private board: CarromBoardState | null = null;
  private myColor: CarromColor = 'white';
  private inputEnabled = false;
  private wantedInput = false;
  private resolving = false;
  private simPieces: CarromPiece[] | null = null;
  private simSteps = 0;
  private dragMode: 'none' | 'place' | 'aim' = 'none';
  private aimLine: Phaser.GameObjects.Graphics | null = null;
  private glow: Phaser.GameObjects.Image | null = null;
  private callbacks: CarromSceneCallbacks | null = null;
  private lastShotId = '';
  private playSize = 716;
  private origin = 92;

  constructor() {
    super('CarromScene');
  }

  init(data: { callbacks?: CarromSceneCallbacks }): void {
    this.callbacks = data.callbacks || null;
  }

  create(): void {
    try {
    const boardCanvas = drawCarromBoard();
    if (this.textures.exists('carrom-board')) this.textures.remove('carrom-board');
    const boardTexture = this.textures.addCanvas('carrom-board', boardCanvas);
    boardTexture?.refresh();
    this.add.image(VIEW / 2, VIEW / 2, 'carrom-board').setDisplaySize(VIEW, VIEW);

    for (const kind of ['white', 'black', 'queen', 'striker'] as const) {
      if (this.textures.exists(`carrom-${kind}`)) this.textures.remove(`carrom-${kind}`);
      this.textures.addCanvas(`carrom-${kind}`, drawPieceTexture(kind));
    }

    this.aimLine = this.add.graphics().setDepth(20);
    this.glow = this.add.image(0, 0, 'carrom-striker').setVisible(false).setDepth(18).setAlpha(0.35);
    this.glow.setTint(0x4da3ff);
    this.glow.setBlendMode(Phaser.BlendModes.ADD);

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.pieces = createOpeningPieces();
    this.syncSprites();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (typeof window !== 'undefined') {
        (window as Window & { __carromError?: string }).__carromError = message;
      }
    }
  }

  setCallbacks(callbacks: CarromSceneCallbacks): void {
    this.callbacks = callbacks;
  }

  setControl(options: { myColor: CarromColor; inputEnabled: boolean }): void {
    this.myColor = options.myColor;
    this.wantedInput = options.inputEnabled;
    this.inputEnabled = options.inputEnabled && !this.resolving;
  }

  applyBoard(board: CarromBoardState, playShotId?: string): void {
    this.board = board;
    if (this.resolving) return;
    const shot = board.lastShot;
    const alreadyPlayed = !shot || shot.shotId === this.lastShotId || shot.shotId === playShotId;
    if (!alreadyPlayed && this.pieces.length > 0) {
      this.lastShotId = shot.shotId;
      this.playShot(shot.input);
      return;
    }
    if (shot) this.lastShotId = shot.shotId;
    this.applyAuthoritativePieces(board.pieces);
  }

  playShot(input: CarromShotInput, fallbackPieces?: CarromPiece[]): void {
    const start = (this.pieces.length ? this.pieces : fallbackPieces || this.board?.pieces || []).map((piece) => ({
      ...piece,
      vx: 0,
      vy: 0,
    }));
    const striker = start.find((piece) => piece.kind === 'striker');
    if (!striker) return;
    applyImpulse(striker, input);
    this.simPieces = start;
    this.simSteps = 0;
    this.resolving = true;
    this.inputEnabled = false;
    this.dragMode = 'none';
    this.aimLine?.clear();
    this.glow?.setVisible(false);
    playCarromSound('strike');
    this.callbacks?.onAim(input.power, input.angle, false);
  }

  private applyAuthoritativePieces(pieces: CarromPiece[]): void {
    this.pieces = pieces.map((piece) => ({ ...piece, vx: 0, vy: 0 }));
    this.syncSprites();
  }

  private finishResolve(): void {
    this.simPieces = null;
    this.simSteps = 0;
    this.resolving = false;
    if (this.board?.lastShot) {
      this.lastShotId = this.board.lastShot.shotId;
      this.applyAuthoritativePieces(this.board.pieces);
    } else {
      this.syncSprites();
    }
    this.inputEnabled = this.wantedInput;
    this.callbacks?.onAim(0, 0, false);
  }

  private cleanup(): void {
    this.input.off('pointerdown', this.onPointerDown, this);
    this.input.off('pointermove', this.onPointerMove, this);
    this.input.off('pointerup', this.onPointerUp, this);
    this.sprites.clear();
    this.simPieces = null;
  }

  private toView(x: number, y: number): { x: number; y: number } {
    const flip = this.myColor === 'black';
    const bx = flip ? BOARD - x : x;
    const by = flip ? BOARD - y : y;
    return {
      x: this.origin + (bx / BOARD) * this.playSize,
      y: this.origin + (by / BOARD) * this.playSize,
    };
  }

  private toBoard(px: number, py: number): { x: number; y: number } {
    const bx = ((px - this.origin) / this.playSize) * BOARD;
    const by = ((py - this.origin) / this.playSize) * BOARD;
    if (this.myColor === 'black') return { x: BOARD - bx, y: BOARD - by };
    return { x: bx, y: by };
  }

  private syncSprites(): void {
    const scale = this.playSize / BOARD;
    for (const piece of this.pieces) {
      let entry = this.sprites.get(piece.id);
      if (!entry) {
        const shadow = this.add.ellipse(0, 0, 36, 14, 0x000000, 0.22).setDepth(4);
        const sprite = this.add.image(0, 0, `carrom-${piece.kind}`).setDepth(piece.kind === 'striker' ? 8 : 6);
        entry = { id: piece.id, kind: piece.kind, sprite, shadow };
        this.sprites.set(piece.id, entry);
      }
      const visible = !piece.pocketed;
      const pos = this.toView(piece.x, piece.y);
      const size = radiusOf(piece.kind) * 2 * scale * 1.12;
      entry.sprite.setVisible(visible).setPosition(pos.x, pos.y).setDisplaySize(size, size);
      entry.shadow.setVisible(visible).setPosition(pos.x + 3, pos.y + size * 0.38).setSize(size * 0.72, size * 0.28);
    }
    for (const [id, entry] of this.sprites) {
      if (!this.pieces.some((piece) => piece.id === id)) {
        entry.sprite.destroy();
        entry.shadow.destroy();
        this.sprites.delete(id);
      }
    }
  }

  update(_time: number, delta: number): void {
    if (!this.simPieces) return;
    const steps = Math.min(4, Math.max(1, Math.round((delta / 1000) / (1 / 120))));
    for (let i = 0; i < steps; i++) {
      const report = stepWorld(this.simPieces);
      this.simSteps += 1;
      if (report.collisions) playCarromSound('collision');
      if (report.walls) playCarromSound('wall');
      for (const piece of report.pockets) {
        playCarromSound(piece.kind === 'queen' ? 'queen' : 'pocket');
      }
      if (this.simSteps > 8 && (allResting(this.simPieces) || this.simSteps >= MAX_STEPS)) {
        this.pieces = this.simPieces;
        this.finishResolve();
        return;
      }
    }
    this.pieces = this.simPieces;
    this.syncSprites();
  }

  private striker(): CarromPiece | undefined {
    return this.pieces.find((piece) => piece.kind === 'striker' && !piece.pocketed);
  }

  private onPointerDown = (pointer: Phaser.Input.Pointer): void => {
    if (!this.inputEnabled || this.resolving) return;
    const striker = this.striker();
    if (!striker) return;
    const view = this.toView(striker.x, striker.y);
    const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, view.x, view.y);
    if (dist < 52) {
      this.dragMode = 'place';
      return;
    }
    const onBoard =
      pointer.x >= this.origin - 24 &&
      pointer.x <= this.origin + this.playSize + 24 &&
      pointer.y >= this.origin - 24 &&
      pointer.y <= this.origin + this.playSize + 24;
    if (onBoard) {
      this.dragMode = 'aim';
      this.updateAim(pointer);
    }
  };

  private onPointerMove = (pointer: Phaser.Input.Pointer): void => {
    if (!this.inputEnabled || this.resolving || this.dragMode === 'none') return;
    if (this.dragMode === 'place') {
      const board = this.toBoard(pointer.x, pointer.y);
      const placed = clampToBaseline(this.myColor, board.x);
      const striker = this.striker();
      if (striker) {
        striker.x = placed.x;
        striker.y = placed.y;
        this.syncSprites();
      }
      return;
    }
    this.updateAim(pointer);
  };

  private onPointerUp = (pointer: Phaser.Input.Pointer): void => {
    if (this.dragMode === 'aim') {
      const aim = this.readAim(pointer);
      this.dragMode = 'none';
      this.aimLine?.clear();
      this.glow?.setVisible(false);
      if (aim.power >= 0.08) {
        const striker = this.striker();
        if (!striker) return;
        const shotId =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `shot-${Date.now()}`;
        const input: CarromShotInput = {
          shotId,
          strikerX: striker.x,
          strikerY: striker.y,
          angle: aim.angle,
          power: aim.power,
        };
        this.lastShotId = shotId;
        this.playShot(input);
        this.callbacks?.onShoot(input);
      } else {
        this.callbacks?.onAim(0, 0, false);
      }
      return;
    }
    this.dragMode = 'none';
  };

  private readAim(pointer: Phaser.Input.Pointer): { angle: number; power: number } {
    const striker = this.striker();
    if (!striker) return { angle: 0, power: 0 };
    const view = this.toView(striker.x, striker.y);
    const dx = view.x - pointer.x;
    const dy = view.y - pointer.y;
    const dist = Math.hypot(dx, dy);
    const power = Math.min(1, dist / 180);
    const viewAngle = Math.atan2(dy, dx);
    const angle = this.myColor === 'black' ? viewAngle + Math.PI : viewAngle;
    return { angle, power };
  }

  private updateAim(pointer: Phaser.Input.Pointer): void {
    const striker = this.striker();
    const g = this.aimLine;
    if (!striker || !g) return;
    const aim = this.readAim(pointer);
    const view = this.toView(striker.x, striker.y);
    const viewAngle = this.myColor === 'black' ? aim.angle + Math.PI : aim.angle;
    g.clear();
    const dots = 18;
    for (let i = 1; i <= dots; i++) {
      const t = i / dots;
      const x = view.x + Math.cos(viewAngle) * t * 260;
      const y = view.y + Math.sin(viewAngle) * t * 260;
      const alpha = 1 - t * 0.7;
      g.fillStyle(i < 3 ? 0x7ecbff : 0xffffff, alpha);
      g.fillCircle(x, y, i === 1 ? 4.2 : 2.4);
    }
    this.glow?.setVisible(true).setPosition(view.x, view.y).setDisplaySize(86, 86).setAlpha(0.28 + aim.power * 0.35);
    this.callbacks?.onAim(aim.power, aim.angle, true);
  }
}

export const CARROM_VIEW = VIEW;
