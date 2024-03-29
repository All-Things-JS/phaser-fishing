import Phaser from "../lib/Phaser.js";

export default class Game extends Phaser.Scene {
  /** @type {Phaser.Physics.Arcade.Sprite} */
  #player;

  /** @type {Phaser.GameObjects.DOMElement} */
  #inventory_object;

  /** @type {HTMLImageElement} */
  #inventory_element;

  /** @type {Phaser.GameObjects.DOMElement} */
  #arrow_object;

  /** @type {HTMLImageElement} */
  #arrow_element;

  /** @type {Phaser.Physics.Arcade.StaticBody} */
  #fishing_pole;

  /** @type {Phaser.Physics.Arcade.StaticBody} */
  #oven;

  /** @type {Phaser.Types.Input.Keyboard.CursorKeys}*/
  #cursors;

  constructor() {
    super("game");
  }

  init() {}

  preload() {
    this.load.image("tilemap", "assets/tilemap.png");
    this.load.image("player", "assets/char_idle.png");
    this.load.image("fishing_pole", "assets/fishing_pole.png");
    this.load.image("oven", "assets/oven.png");
    this.load.tilemapTiledJSON("map", "assets/phishing_map.json");
    this.#cursors = this.input.keyboard.createCursorKeys();
  }

  create() {
    const map = this.make.tilemap({ key: "map" });
    map.createLayer("background", map.addTilesetImage("platformer", "tilemap"));

    this.physics.world.setBounds(21, 0, 0, 420, true, false, false, false);
    this.physics.world.setBounds(483, 0, 0, 420, false, true, false, false);

    this.#fishing_pole = this.physics.add.staticSprite(
      483,
      284,
      "fishing_pole",
    );

    this.#oven = this.physics.add.staticSprite(31, 284, "oven");

    this.#player = this.physics.add.sprite(
      this.#fishing_pole.x - this.#fishing_pole.width,
      this.#fishing_pole.y,
      "player",
    );
    this.#player.body.collideWorldBounds = true;

    this.#inventory_element = this.#createInventoryElement();
    this.#inventory_object = this.add.dom(
      this.#player.x,
      this.#player.y,
      this.#inventory_element,
    );

    this.#arrow_element = this.#createArrowElement();
    this.#arrow_object = this.add.dom(
      this.#fishing_pole.x,
      this.#fishing_pole.y - this.#fishing_pole.height,
      this.#arrow_element,
    );

    this.physics.add.collider(this.#player, this.#fishing_pole);
    this.physics.add.collider(this.#player, this.#oven);

    this.cameras.main.startFollow(this.#player);
  }

  update() {
    if (this.#cursors.left.isDown) {
      this.#player.setVelocityX(-100);
    } else if (this.#cursors.right.isDown) {
      this.#player.setVelocityX(100);
    } else {
      this.#player.setVelocityX(0);
    }

    this.#inventory_object.setPosition(
      this.#player.x,
      this.#getInventoryY(this.#player),
    );

    if (
      this.#nextToFishingPole() &&
      !this.#hasCaughtFish() &&
      this.#cursors.space.isDown
    ) {
      this.#showArrow();
    }

    if (this.#showingArrow() && !this.#nextToFishingPole()) {
      this.#resetArrow();
    }

    if (
      this.#showingArrow() &&
      this.#nextToFishingPole() &&
      !this.#hasCaughtFish() &&
      this.#cursors.up.isDown
    ) {
      this.#resetArrow();
      this.#catchFish();
    }

    if (
      this.#nextToOven() &&
      this.#hasCaughtFish() &&
      this.#cursors.space.isDown
    ) {
      this.#cookFish();
    }

    if (this.#hasCookedFish() && this.#cursors.shift.isDown) {
      this.#resetInventory();
    }
  }

  #nextToFishingPole() {
    return (
      this.#player.x + this.#player.width / 2 ===
      this.#fishing_pole.x - this.#fishing_pole.width / 2
    );
  }

  #nextToOven() {
    return (
      this.#player.x - this.#player.width / 2 ===
      this.#oven.x + this.#oven.width / 2
    );
  }

  #hasCaughtFish() {
    return (
      this.#inventory_element.getAttribute("src") === "./assets/caught_fish.png"
    );
  }

  #hasCookedFish() {
    return (
      this.#inventory_element.getAttribute("src") === "./assets/cooked_fish.png"
    );
  }

  #showingArrow() {
    return this.#arrow_element.hasAttribute("src");
  }

  #showArrow() {
    this.#arrow_element.setAttribute("src", "./assets/arrow_up.png");
  }

  #catchFish() {
    this.#inventory_element.setAttribute("src", "./assets/caught_fish.png");
  }

  #cookFish() {
    this.#inventory_element.src = "./assets/cooked_fish.png";
  }

  #resetInventory() {
    this.#inventory_element = this.#createInventoryElement();
    this.#inventory_object.setElement(this.#inventory_element);
  }

  #createInventoryElement() {
    const elem = document.createElement("img");
    elem.height = 19;
    elem.width = 19;
    elem.style = "border: 1px solid black; background-color: white";
    return elem;
  }

  #resetArrow() {
    this.#arrow_element = this.#createArrowElement();
    this.#arrow_object.setElement(this.#arrow_element);
  }

  #createArrowElement() {
    const elem = document.createElement("img");
    elem.setAttribute("height", 21);
    elem.setAttribute("width", 21);
    return elem;
  }

  /**
   * @param {Phaser.Physics.Arcade.Sprite} player
   * @returns {number}
   */
  #getInventoryY(player) {
    return player.y + player.height;
  }
}
