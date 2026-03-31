const level1Data = {
    groundData: [
        { x: 150, y: 480, scaleX: 0.75, scaleY: 1 },
        { x: 500, y: 480, scaleX: 0.25, scaleY: 3 },
        { x: 700, y: 480, scaleX: 0.25, scaleY: 1 },
        { x: 900, y: 480, scaleX: 0.25, scaleY: 1 },
        { x: 1450, y: 480, scaleX: 0.1, scaleY: 2 },
        { x: 1800, y: 480, scaleX: 1, scaleY: 1 }
    ],
    movingPlatformData: [
        { x: 1100, y: 500, scaleX: 0.25, scaleY: 1, dx: 200, dy: 0, duration: 2000 }
    ],
    spikeData: [
        { x: 150, y: 450, type: 'static' },
        { x: 600, y: 440, type: 'static' },
        { x: 400, y: 300, type: 'fall', vx: 100 },
        { x: 800, y: 300, type: 'vertical', range: 200, duration: 1000 },
        { x: 1600, y: 200, type: 'vertical', range: 300, duration: 1000 }
    ],
    nextLevel: 'Level2'
};

const level2Data = {
    groundData: [
        { x: 150, y: 200, scaleX: 0.75, scaleY: 1 },
        { x: 500, y: 480, scaleX: 0.25, scaleY: 3 },
        { x: 700, y: 480, scaleX: 0.25, scaleY: 1 },
        { x: 900, y: 480, scaleX: 0.25, scaleY: 1 },
        { x: 1450, y: 480, scaleX: 0.1, scaleY: 2 },
        { x: 1800, y: 480, scaleX: 1, scaleY: 1 }
    ],
    movingPlatformData: [
        { x: 1100, y: 500, scaleX: 0.25, scaleY: 1, dx: 200, dy: 0, duration: 2000 }
    ],
    spikeData: [
        { x: 200, y: 200, type: 'static' },
        { x: 600, y: 440, type: 'static' },
        { x: 400, y: 300, type: 'fall', vx: 100 },
        { x: 800, y: 300, type: 'vertical', range: 200, duration: 1000 },
        { x: 1600, y: 200, type: 'vertical', range: 300, duration: 1000 }
    ],
    nextLevel: 'Level1'
};


class BootScene extends Phaser.Scene{
    constructor() { super('Boot'); }

    preload() {
        this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
        this.load.image('spike', 'https://labs.phaser.io/assets/sprites/spikedball.png');
        this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
        this.load.image('goal','goal.png');
        this.load.audio('bgm', 'bgm.mp3');
        this.load.audio('jump', 'lumora_studios-pixel-jump-319167.mp3');
    }

    create() {
        this.scene.start('Level1');
    }
}

class BaseLevel extends Phaser.Scene{
    constructor(key, levelData) {
        super(key);
        this.levelData = levelData;
    }


    create() {
        
        const { groundData, movingPlatformData, spikeData, nextLevel }=this.levelData
        this.physics.world.setBounds(0, 0, 2000, 500);

        this.cursors = this.input.keyboard.createCursorKeys();

        this.player = this.physics.add.sprite(50, 400, 'player');
        this.player.setCollideWorldBounds(true);

        this.isDead = false;

        this.cameras.main.setBounds(0, 0, 2000, 500);
        this.cameras.main.startFollow(this.player, false, 1, 1);

        const platforms = this.physics.add.staticGroup();
        groundData.forEach(data => {
            platforms.create(data.x, data.y, 'ground')
                .setScale(data.scaleX, data.scaleY)
                .refreshBody();
        });

        this.movingplatforms = this.physics.add.group({
            allowGravity: false,
            immovable: true
        });
        movingPlatformData.forEach(data => {
            let p = this.movingplatforms.create(data.x, data.y, 'ground')
                .setScale(data.scaleX, data.scaleY);
            
            p.prevX = p.x;
            p.prevY = p.y;

            this.tweens.add({
                targets: p,
                x: data.x + data.dx,
                y: data.y + data.dy,
                duration: data.duration,
                yoyo: true,
                repeat: -1,
                ease: 'Linear',
                onUpdate: () => { p.body.updateFromGameObject(); }
            });
        });
        this.physics.add.collider(this.player, platforms);
        this.physics.add.collider(this.player, this.movingplatforms);
        
        const staticSpikes = this.physics.add.staticGroup();
        const movingSpikes = this.physics.add.group();
        spikeData.forEach(data => {
            if (data.type === 'static') {
                staticSpikes.create(data.x, data.y, 'spike')
                    .setScale(0.5)
                    .refreshBody();
            }
            else {
                let spike = movingSpikes.create(data.x, data.y, 'spike')
                    .setScale(0.5);
                
                if (data.type === 'fall') {
                    spike.setVelocityX(data.vx);
                    spike.setCollideWorldBounds(true);
                    spike.setBounce(1);
                }
                if (data.type === 'vertical') {
                    spike.body.allowGravity = false;

                    this.tweens.add({
                        targets: spike,
                        y: data.y + data.range,
                        duration: data.duration,
                        yoyo: true,
                        repeat: -1
                    });
                }
            }
        })
        this.physics.add.overlap(this.player, staticSpikes, this.playerDie, null, this);
        this.physics.add.overlap(this.player, movingSpikes, this.playerDie, null, this);

        const goal = this.physics.add.staticGroup();
        goal.create(1900, 400, 'goal');
        this.physics.add.overlap(this.player, goal, () => {
            console.log("クリア！");
            if (this.music) {
                this.music.stop();
                this.music.destroy();
                this.music = null;
            }
            this.scene.start(nextLevel);
        }, null, this);

        const deathZone = this.physics.add.staticSprite(1000, 500, null);
        deathZone.displayWidth = 2000;
        deathZone.displayHeight = 1;
        deathZone.refreshBody();
        deathZone.visible = false;
        this.physics.add.overlap(this.player, deathZone, this.playerDie, null, this);

        this.music = this.sound.add('bgm', {
            loop: true,
            volume: 0
        });
        this.music.play();
        this.tweens.add({
            targets: this.music,
            volume: 0.5,
            duration: 100
        });

        this.jumpSound = this.sound.add('jump');
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-200);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(200);
        } else {
            this.player.setVelocityX(0);
        }

        if (this.cursors.up.isDown && this.player.body.touching.down) {
            this.player.setVelocityY(-400);
            this.jumpSound.play();
        }

        this.movingplatforms.getChildren().forEach(p => {
            let dx = p.x - p.prevX;
            let dy = p.y - p.prevY;

            if (this.player.body.touching.down && p.body.touching.up) {
                this.player.x += dx;
                this.player.y += dy;
            }
            p.prevX = p.x;
            p.prevY = p.y;
        });
        
    }

    playerDie() {
        if (this.isDead) return;
        this.isDead = true;

        this.player.setTint(0xff0000);
        this.player.setVelocity(0, 0);

        this.player.body.enable = false;

        setTimeout(() => {
            location.reload();
        }, 500);
    }
}


class Level1 extends BaseLevel{
    constructor() { super('Level1',level1Data); }
}


class Level2 extends BaseLevel{
    constructor() { super('Level2',level2Data); }
}

const config = {
    type: Phaser.AUTO,
    width: 600,
    height: 500,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: true
        }
    },
    scale: {
        mode: Phaser.Scale.NONE,
        parent: 'game-container',
        width: 600,
        height: 500
    },
    scene: [BootScene,Level1,Level2]
};


const game = new Phaser.Game(config);



