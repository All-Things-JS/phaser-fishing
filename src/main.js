import Phaser from "./lib/Phaser.js";
import Game from "./scenes/Game.js";

export default new Phaser.Game({
  type: Phaser.AUTO,
  width: 200,
  height: 200,
  scene: Game,
  backgroundColor: "#d9fff9",
  physics: {
    default: "arcade",
    arcade: {
      debug: true,
    },
  },
  parent: "app",
  dom: {
    createContainer: true,
  },
});
