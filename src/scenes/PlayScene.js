
import BaseScene from './BaseScene';

const PIPES_TO_RENDER = 4;

class PlayScene extends BaseScene {

  constructor(config) {
    super('PlayScene', config);

    this.bird = null;
    this.platform = null;
    this.pipes = null;
    this.isPaused = false;
    this.isDead = false;
    this.isFirstJump = false;

    this.pipeHorizontalDistance = 0;
    

    this.score = 0;
    this.scoreText = '';

    this.currentDifficulty = 'easy';
    this.difficulties = {
      'easy': {
        pipeVerticalDistanceRange: [160, 200],
        pipeHorizontalDistanceRange: [120, 180]
      },
      'normal': {
        pipeVerticalDistanceRange: [150, 190],
        pipeHorizontalDistanceRange: [110, 160]
      },
      'hard': {
        pipeVerticalDistanceRange: [140, 170],
        pipeHorizontalDistanceRange: [100, 150]
      }
    }
  }

  create() {
    this.currentDifficulty = 'easy';
    super.create();
    this.createBird();
    this.createPipes();
    this.createColliders();
    this.createScore();
    this.createPause();
    this.handleInputs();
    this.listenToEvents();

    this.anims.create({
      key: 'jump',
      frames: this.anims.generateFrameNumbers('jump', {start:0, end:7}),
      frameRate:16,
      repeat:-1
    })

    this.anims.create({
      key: 'run',
      frames: this.anims.generateFrameNumbers('run', {start:0, end:5}),
      frameRate:16,
      repeat:-1
    })

    this.anims.create({
      key: 'idle',
      frames: this.anims.generateFrameNumbers('idle', {start:0, end:3}),
      frameRate:16,
      repeat:-1
    })

    this.anims.create({
      key: 'die',
      frames: this.anims.generateFrameNumbers('die', { start: 0, end: 3}),
      // 24 fps default, it will play animation consisting of 24 frames in 1 second
      // in case of framerate 2 and sprite of 8 frames animations will play in
      // 4 sec; 8 / 2 = 4
      frameRate: 16,
      // repeat infinitely
      repeat: -1
    })

    this.anims.create({
      key: 'fly',
      frames: this.anims.generateFrameNumbers('fly', { start: 0, end: 6}),
      // 24 fps default, it will play animation consisting of 24 frames in 1 second
      // in case of framerate 2 and sprite of 8 frames animations will play in
      // 4 sec; 8 / 2 = 4
      frameRate: 16,
      // repeat infinitely
      repeat: -1
    })

    

    this.bird.play('idle');
  }

  
  update() {
    const cursors = this.input.keyboard.createCursorKeys();
    if (cursors.left.isDown) {
      this.bird.flipX = true;
      this.bird.setVelocityX(-200);
      this.bird.anims.play("run", true);
    } else if (cursors.right.isDown) {
      this.bird.flipX = false;
      this.bird.setVelocityX(200);
      this.bird.anims.play("run", true);
    } else {
      this.bird.setVelocityX(0);
      this.bird.anims.play("idle");
    }

    if (cursors.up.isDown && this.bird.body.touching.down) {
      this.bird.anims.play("jump");
      this.bird.setVelocityY(-400);
      this.platform.destroy();
    }
    if (cursors.down.isDown && !this.bird.body.touching.down) {
      this.bird.anims.play("jump");
      this.bird.setVelocityY(500);
    }

    this.checkGameStatus();
    this.recyclePipes();
  }

  listenToEvents() {
    if (this.pauseEvent) { return; }

    this.pauseEvent = this.events.on('resume', () => {
      this.initialTime = 3;
      this.countDownText = this.add.text(...this.screenCenter, 'Fly in: ' + this.initialTime, this.fontOptions).setOrigin(0.5);
      this.timedEvent = this.time.addEvent({
        delay: 1000,
        callback: this.countDown,
        callbackScope: this,
        loop: true
      })
    })
  }

  countDown() {
    this.initialTime--;
    this.countDownText.setText('Fly in: ' + this.initialTime);
    if (this.initialTime <= 0) {
      this.isPaused = false;
      this.countDownText.setText('');
      this.physics.resume();
      this.timedEvent.remove();
    }
  }

  createBG() {
    this.add.image(0, 0, 'sky').setOrigin(0);
  }

  createBird() {
    this.bird = this.physics.add.sprite(this.config.startPosition.x, this.config.startPosition.y, 'bird')
      .setScale(1.5)
      .setOrigin(0)
      .setImmovable(false);

    this.bird.setBodySize(this.bird.width, this.bird.height-5);
    this.bird.body.gravity.y = 400;
    this.bird.setCollideWorldBounds(true);
  }



  createPipes() {
    this.platform = this.physics.add.sprite(200, 575, 'pipe')
      .setImmovable(true);
    this.physics.add.collider(this.bird, this.platform);


    this.pipes = this.physics.add.group();
    for (let i = 0; i < PIPES_TO_RENDER; i++) {
      const leftPipe = this.pipes.create(0, 0, 'pipe')
        .setImmovable(true)
        .setOrigin(1, 0);
      const rightPipe = this.pipes.create(0, 0, 'pipe')
        .setImmovable(true)
        .setOrigin(0, 0);

      this.placePipe(leftPipe, rightPipe)
    }

    this.pipes.setVelocityY(120);
  }

  createColliders() {
    this.physics.add.collider(this.bird, this.pipes);
  }

  createScore() {
    this.score = 0;
    const bestScore = localStorage.getItem('bestScore');
    this.scoreText = this.add.text(16, 16, `Score: ${0}`, { fontSize: '32px', fill: '#000'});
    this.add.text(16, 52, `Best score: ${bestScore || 0}`, { fontSize: '18px', fill: '#000'});
  }

  createPause() {
    this.isPaused = false;
    const pauseButton = this.add.image(this.config.width - 10, this.config.height -10, 'pause')
      .setInteractive()
      .setScale(3)
      .setOrigin(1);

    pauseButton.on('pointerdown', () => {
      this.isPaused = true;
      this.physics.pause();
      this.scene.pause();
      this.scene.launch('PauseScene');
    })
  }

  handleInputs() {
    // this.input.on('pointerdown', this.flap, this);
    // this.input.keyboard.on('keydown_SPACE', this.flap, this);

  }

  checkGameStatus() {
    if (!this.isDead && (this.bird.getBounds().bottom >= this.config.height || this.bird.y >= this.config.height)) {
      this.gameOver();
    }
  }

  placePipe(lPipe, rPipe) {
    const difficulty = this.difficulties[this.currentDifficulty];
    const upMostY = this.getUpMostPipe();
    const pipeHorizontalDistance = Phaser.Math.Between(...difficulty.pipeHorizontalDistanceRange);
    const pipeHorizontalPosition = Phaser.Math.Between(0, this.config.width - pipeHorizontalDistance);
    const pipeVerticalDistance = Phaser.Math.Between(...difficulty.pipeVerticalDistanceRange);

    lPipe.x = pipeHorizontalPosition;
    lPipe.y = upMostY - pipeVerticalDistance;

    rPipe.x = lPipe.x + pipeHorizontalDistance;
    rPipe.y = lPipe.y;
  }
  recyclePipes() {
    const tempPipes = [];
    this.pipes.getChildren().forEach(pipe => {
      if (pipe.getBounds().bottom >= this.config.height) {
        tempPipes.push(pipe);
        if (tempPipes.length === 2) {
          this.placePipe(...tempPipes);
          this.increaseScore();
          this.saveBestScore();
          this.increaseDifficulty();
        }
      }
    })
  }

  increaseDifficulty() {
    if (this.score === 5) {
      this.currentDifficulty = 'normal';
      this.pipes.setVelocityY(150);
    }

    if (this.score === 10) {
      this.currentDifficulty = 'hard';
      this.pipes.setVelocityY(200);
    }
  }

  getUpMostPipe() {
    let upMostY = 0;

    this.pipes.getChildren().forEach(function(pipe) {
      upMostY = Math.min(pipe.y, upMostY);
    })

    return upMostY;
  }

  saveBestScore() {
    const bestScoreText = localStorage.getItem('bestScore');
    const bestScore = bestScoreText && parseInt(bestScoreText, 10);

    if (!bestScore || this.score > bestScore) {
      localStorage.setItem('bestScore', this.score);
    }
  }

  gameOver() {
    this.isDead = true;
    console.log("bopa");
    this.bird.play('idle');
    this.physics.pause();
    this.bird.setTint(0xEE4824);

    this.saveBestScore();

    this.time.addEvent({
      delay: 1000,
      callback: () => {
        console.log("calling back");
        this.isDead = false;
        console.log(this.isDead);
        this.scene.restart();
      },
      loop: false
    })
  }

  increaseScore() {
    this.score++;
    this.scoreText.setText(`Score: ${this.score}`)
  }
}

export default PlayScene;
