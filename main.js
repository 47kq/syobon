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
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let player;
let cursors;
let platforms;
let movingplatforms;
let staticSpikes;
let movingSpikes;
let goal;
let deathZone;
let isDead = false;
let jumpSound;

const game = new Phaser.Game(config);

function preload() {
    this.load.image('player', 'https://labs.phaser.io/assets/sprites/phaser-dude.png');
    this.load.image('spike', 'https://labs.phaser.io/assets/sprites/spikedball.png');
    this.load.image('ground', 'https://labs.phaser.io/assets/sprites/platform.png');
    this.load.image('goal','goal.png');
    this.load.audio('bgm', 'bgm.mp3');
    this.load.audio('jump', 'lumora_studios-pixel-jump-319167.mp3');
}

function create() {

    this.physics.world.setBounds(0, 0, 2000, 500);

    platforms = this.physics.add.staticGroup();
    platforms.create(150, 480, 'ground').setScale(0.75, 1).refreshBody();
    platforms.create(500, 480, 'ground').setScale(0.25, 3).refreshBody();
    platforms.create(700, 480, 'ground').setScale(0.25, 1).refreshBody();
    platforms.create(900, 480, 'ground').setScale(0.25, 1).refreshBody();
    platforms.create(1450, 480, 'ground').setScale(0.1, 2).refreshBody();
    platforms.create(1800, 480, 'ground').setScale(1, 1).refreshBody();

    player = this.physics.add.sprite(50, 400, 'player');
    player.setCollideWorldBounds(true);

    movingplatforms = this.physics.add.group({
        allowGravity: false,
        immovable: true
    });

    const createMovingPlatform=(scene, x, y, dx,dy, speed)=> {
        let p = movingplatforms.create(x, y, 'ground').setScale(0.25, 1);

        p.prevX = p.x;
        p.prevY = p.y;

        scene.tweens.add({
            targets: p,
            x: x + dx,
            y:y+dy,
            duration: speed,
            yoyo:true,
            repeat: -1,
            ease:'Linear',
            onUpdate: () => {
                p.body.updateFromGameObject();
            }
        });

        
    }

    createMovingPlatform(this, 1100, 500, 200,0, 2000);

    this.physics.add.collider(player, platforms);

    this.physics.add.collider(player, movingplatforms);



    this.cameras.main.setBounds(0, 0, 2000, 500);
    this.cameras.main.startFollow(player, false, 1, 1);

    this.physics.add.collider(player, platforms);

    staticSpikes = this.physics.add.staticGroup();
    staticSpikes.create(600, 440, 'spike').setScale(0.5).refreshBody();
    staticSpikes.create(200, 450, 'spike').setScale(0.5).refreshBody();

    this.physics.add.overlap(player, staticSpikes, () => {
        playerDie();
    }, null, this);

    movingSpikes = this.physics.add.group();

    let spikesData = [
        { x: 400, y: 300, type: 'fall' ,vx:100},
        { x: 800, y: 300, vy: 200, type: 'vertical',range:200,duration:1000 }
    ];

    spikesData.forEach(data => {
        let spike = movingSpikes.create(data.x, data.y, 'spike').setScale(0.5);

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
    });

    this.physics.add.overlap(player, movingSpikes, playerDie, null, this);

    goal = this.physics.add.staticGroup();
    
    goal.create(1900, 400, 'goal');

    this.physics.add.overlap(player, goal, () => {
        console.log("クリア！");

        if (this.music) {
            this.music.stop();
            this.music.destroy();
            this.music = null;
        }
        this.scene.restart();
    }, null, this);

    deathZone = this.physics.add.staticSprite(1000, 500, null);
    deathZone.displayWidth = 2000;
    deathZone.displayHeight = 1;
    deathZone.refreshBody();
    deathZone.visible = false;

    this.physics.add.overlap(player, deathZone, playerDie, null, this);

    cursors = this.input.keyboard.createCursorKeys();

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

    jumpSound = this.sound.add('jump');


}

function update() {
    if (cursors.left.isDown) {
        player.setVelocityX(-200);
    } else if (cursors.right.isDown) {
        player.setVelocityX(200);
    } else {
        player.setVelocityX(0);
    }

    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-400);
        jumpSound.play();
    }

    movingplatforms.getChildren().forEach(p => {
        let dx = p.x - p.prevX;
        let dy = p.y - p.prevY;

        if (player.body.touching.down && p.body.touching.up) {
            player.x += dx;
            player.y += dy;
        }
        p.prevX = p.x;
        p.prevY = p.y;
    });
    
}

function playerDie() {
    if (isDead) return;
    isDead = true;

    player.setTint(0xff0000);
    player.setVelocity(0, 0);

    player.body.enable = false;

    setTimeout(() => {
        location.reload();
    }, 500);
}


