import { Entity } from "../library/entity";
import { Vector2 } from "../library/geometry/vector2";
import { Assets } from "./assets";
import { IGameState } from "Library";

export class Player extends Entity {
  graphic: Entity;
  speed = 10;

  constructor() {
    super({
      name: "Player",
      collidable: true,
    });

    this.graphic = new Entity({ name: "PlayerGraphic" });
    this.graphic.texture = Assets.getResource("player");

    this.addChild(this.graphic);
  }

  move(state: IGameState) {
    let x = 0;
    let y = 0;

    if (state.keys.down.Right) {
      x += this.speed;
    }
    if (state.keys.down.Left) {
      x -= this.speed;
    }

    if (state.keys.down.Up) {
      y -= this.speed;
    }
    if (state.keys.down.Down) {
      y += this.speed;
    }

    this.velocity = new Vector2(x, y);
  }

  update(state: IGameState) {
    this.move(state);
  }
}
