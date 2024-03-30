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

  /** @type {HTMLSpanElement} */
  #timer;

  /** @type {number} */
  #current_time;

  /** @type {number} */
  #timer_handle;

  #arrow_timer_handle;

  #show_arrow_timer;

  /** @type {Phaser.Physics.Arcade.StaticBody} */
  #oven;

  /** @type {Phaser.Types.Input.Keyboard.CursorKeys}*/
  #cursors;

  #arrow_handler;

  #arrow_clicked;

  #fishing;

  constructor() {
    super("game");
  }

  init() {
    this.#fishing = false;
    this.#arrow_clicked = 0;
    this.#arrow_handler = () => {
      if (this.#showingArrow()) {
        this.#resetArrow();
        this.#arrow_clicked += 1;
      }
    };
  }

  preload() {
    this.load.image("tilemap", "assets/tilemap.png");
    this.load.image("player", "assets/char_idle.png");
    this.load.image("fishing_pole", "assets/fishing_pole.png");
    this.load.image("oven", "assets/oven.png");
    this.load.spritesheet("sprites", "assets/tilemap.png", {
      frameWidth: 21,
      frameHeight: 21,
    });
    this.load.tilemapTiledJSON("map", "assets/phishing_map.json");
    this.load.audio("background_music", "assets/background_music.mp3");
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

    this.anims.create({
      key: "walk",
      frameRate: 7,
      frames: this.anims.generateFrameNumbers("sprites", {
        start: 88,
        end: 89,
      }),
      repeat: -1,
    });

    this.#player = this.physics.add.sprite(
      240,
      this.#fishing_pole.y,
      "sprites",
    );
    this.#player.setFrame(79);
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

    this.#timer = document.createElement("span");
    this.add.dom(
      this.#arrow_object.x + this.#arrow_object.width,
      this.#arrow_object.y,
      this.#timer,
    );

    this.physics.add.collider(this.#player, this.#fishing_pole);
    this.physics.add.collider(this.#player, this.#oven);

    this.cameras.main.startFollow(this.#player);
    this.game.sound.play("background_music", { loop: true, volume: 0.2 });
  }

  update() {
    if (this.#cursors.left.isDown) {
      this.#player.setFlipX(true);
      if (!this.#player.anims.isPlaying) {
        this.#player.play("walk");
      }
      this.#player.setVelocityX(-100);
    } else if (this.#cursors.right.isDown) {
      this.#player.setFlipX(false);
      if (!this.#player.anims.isPlaying) {
        this.#player.play("walk");
      }
      this.#player.setVelocityX(100);
    } else {
      this.#player.stop();
      this.#player.setFrame(79);
      this.#player.setVelocityX(0);
    }

    this.#inventory_object.setPosition(
      this.#player.x,
      this.#getInventoryY(this.#player),
    );

    if (
      this.#nextToFishingPole() &&
      !this.#hasCaughtFish() &&
      !this.#fishing &&
      this.#cursors.space.isDown
    ) {
      this.#fishing = true;
      let time = 10;

      if (this.#hasCookedFish()) {
        time += 5;
        this.#resetInventory();
      }

      this.#cursors.up.addListener("down", this.#arrow_handler);
      this.#startTimer(time, this.#resetFishing.bind(this));
    }

    if (this.#fishing && !this.#nextToFishingPole()) {
      this.#resetFishing();
    }

    if (this.#arrow_clicked === 3) {
      this.#resetFishing();
      this.#catchFish();
    }

    if (
      this.#nextToOven() &&
      this.#hasCaughtFish() &&
      this.#cursors.space.isDown
    ) {
      this.#cookFish();
    }
  }

  #startTimer(time, timedout) {
    this.#current_time = time;
    this.#timer.innerHTML = this.#current_time;
    this.#timer_handle = setInterval(() => {
      if (!this.#show_arrow_timer && !this.#showingArrow()) {
        this.#show_arrow_timer = setTimeout(
          () => {
            this.#showArrow();
            clearTimeout(this.#show_arrow_timer);
            this.#show_arrow_timer = undefined;
          },
          Phaser.Math.RND.between(1500, 3000),
        );
      }

      this.#current_time -= 1;

      if (this.#current_time === 0) {
        timedout();
        this.#resetTimer();
        return;
      }

      this.#timer.innerHTML = this.#current_time;
    }, 1000);
  }

  #resetFishing() {
    clearTimeout(this.#show_arrow_timer);
    this.#show_arrow_timer = undefined;
    this.#cursors.up.removeListener("down", this.#arrow_handler);
    this.#arrow_clicked = 0;
    this.#resetArrow();
    this.#resetTimer();
    this.#fishing = false;
  }

  #resetTimer() {
    clearInterval(this.#timer_handle);
    this.#timer.innerHTML = "";
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
    this.#arrow_timer_handle = setTimeout(
      this.#resetArrow.bind(this),
      Phaser.Math.RND.between(500, 1000),
    );
    this.#arrow_element.style.visibility = "visible";
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
    clearTimeout(this.#arrow_timer_handle);
    this.#arrow_element = this.#createArrowElement();
    this.#arrow_object.setElement(this.#arrow_element);
  }

  #createArrowElement() {
    const elem = document.createElement("img");
    elem.setAttribute("height", 21);
    elem.setAttribute("width", 21);
    elem.style.visibility = "hidden";
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
