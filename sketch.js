let keymap = {};

onkeydown = onkeyup = function(event) {
    keymap[event.code] = event.type == 'keydown';
};


/**
 * @class Model
 * @description Loads a 3D model and texture, can be drawn to the screen multiple times
*/
class Model {
    constructor(model_path, texture_path, scale, numModels = 1) {
        this.asset = undefined;

        if (numModels == 1) {
            this.asset = loadModel(model_path, true);
        } else {
            this.asset = [];
            
            for (let i = 0; i < numModels; ++i) {
                this.asset.push(loadModel(model_path[i], true));
            }
        }

        this.texture = loadImage(texture_path);

        this.scale = scale;
        this.models = numModels;

        this.rotateHold = {x: 0, y: 0, z: 0};

        // draw function is set once, faster than checking at runtime
        this.draw = this.drawSingle;

        if (numModels > 1) {
            this.draw = this.drawModelNum;
        }
    }

    rotate(x, y, z) {
        this.rotateHold.x += z;
        this.rotateHold.y += x;
        this.rotateHold.z += y;
    }

    drawSingle(rx, ry, rz, tx, ty, tz) {
        push();

        translate(tx, ty, tz);

        rotateY(ry + this.rotateHold.y);
        rotateZ(rz + this.rotateHold.z);
        rotateX(rx + this.rotateHold.x);


        texture(this.texture);

        scale(this.scale);
        model(this.asset);

        pop();
    }


    drawModelNum(rx, ry, rz, tx, ty, tz, modelNum) {
        push();

        translate(tx, ty, tz);

        rotateY(ry + this.rotateHold.y);
        rotateZ(rz + this.rotateHold.z);
        rotateX(rx + this.rotateHold.x);

        texture(this.texture);

        scale(this.scale);
        model(this.asset[modelNum]);

        pop();
    }
}

class Game {
    constructor() {
        this.bee_pos = true;
        this.bee = new Model(
            ['assets/models/Bee.obj', 'assets/models/Bee2.obj'], // 2 models to animate the bee
            'assets/textures/Bee.png',
            0.25, // scale the bee
            2 // number of models
        );

        this.tree = new Model(
            'assets/models/Tree.obj',
            'assets/textures/Tree.png',
            10 // trees are big
        );

        this.rock = new Model(
            'assets/models/rock/Rock.obj',
            'assets/textures/Rock.png',
            2
        );

        this.flower = new Model(
            'assets/models/flower/Flower.obj',
            'assets/textures/Flower.png',
            2
        );

        this.sunflower = new Model(
            'assets/models/sunflower/Sunflower.obj',
            'assets/textures/Sunflower.png',
            1
        );
      
        this.titlefont = loadFont(
          'assets/fonts/Title.ttf'
        );
      
        this.instructions = loadImage(
          'assets/Instructions.png'
        );
      
        this.demo_flower = loadModel(
            'assets/models/flower/Flower.obj',
            true
        );
      
      
        // camera is setup in the setup() function
        this.camera = undefined;
        
        // don't make larger, frame rate already bad
        this.numTrees = 10;
        this.numRocks = 25;
        this.numFlowers = 100;
        
        // generated every game
        this.treePositions = this.generateRandPositions(this.numTrees);
        this.rockPositions = this.generateRandPositions(this.numRocks);
        this.flowerPositions = this.generateRandPositions(this.numFlowers);
        this.sunflowerPositions = this.generateRandPositions(this.numFlowers);
        
        // to limit how far the bee can rotate / tilt
        this.deg_rotate = 0;
        this.deg_tilt = 0;
        
        // when the loop request a new frame we draw instructions until the game starts
        this.newFrame = this.startFrames;
    }

    createVector(x, y, z) {
        return {
            x: x,
            y: y,
            z: z
        };
    }

    setup() {
        // WEBGL allows for 3D rendering
        createCanvas(windowWidth, windowHeight, WEBGL);

        // max frame rate
        frameRate(30);
        // all rotation to be done in degrees
        angleMode(DEGREES);
        // no outlines
        noStroke();
        // how rectangles are centered
        rectMode(CENTER);

        this.camera = createCamera();
        // FOV, aspect ratio, near frustum plane, far frustum plane
        perspective(80, width / height, 0.1, 25000);
    }

    generateRandPositions(max) {
        let poses = [];

        for (let i = 0; i < max; ++i) {
            poses.push([
                random(-999, 999) * 10,
                random(-999, 999) * 10,
                random(-360, 360) * 10
            ]);
        }

        return poses;
    }

    renderBee() {
        // draw the other position of the wings
        this.bee_pos = !this.bee_pos;

        this.bee.draw(
            180, -90, 0, // bee Rotation
            this.camera.centerX, 50 + this.camera.centerY, this.camera.centerZ,  // bee Position
            +this.bee_pos // unary operator to convert bool to int
        );
    }

    renderTrees(poses) {
        // faster than for
        let len = this.numTrees;
        while(len--) {
            this.tree.draw(
                90, poses[len][2], 0, // Tree Rotation
                poses[len][1], -800, poses[len][0]  // Tree Position
            );
        }
    }

    renderRocks(poses) {
        let len = this.numRocks;
        // faster than for
        while(len--) {
            this.rock.draw(
                90, poses[len][2], 0, // Tree Rotation
                poses[len][1], 100, poses[len][0]  // Tree Position
            );
        }
    }

    renderFlowers(poses) {
        let len = this.numFlowers;
        // faster than for
        while(len--) {
            this.flower.draw(
                180, poses[len][2], 0,
                poses[len][1], 0, poses[len][0]
            );
        }
    }

    renderSunFlowers(poses) {
        let len = this.numFlowers;
        while(len--) {
            this.sunflower.draw(
                180, poses[len][2], 0,
                poses[len][1], 105, poses[len][0]
            );
        }
    }

    handleKeys() {
        if (keymap['KeyW']) {
            this.camera.move(0, 0, -25);
        } else {
            this.camera.move(0, 0, -10);
        }

        if (keymap['ArrowLeft'] ) {
            let pan_x = 1;

            if(this.deg_rotate < 0) {
                pan_x = 0;
            }

            if (this.deg_rotate < 75) {
                this.deg_rotate += 2;
                this.bee.rotate(pan_x, 0, 2);
            } else {
                this.bee.rotate(pan_x, 0, 0);
            }

            this.camera.pan(pan_x);
        } else if (keymap['ArrowRight']) {
            let pan_x = -1;

            if(this.deg_rotate > 0) {
                pan_x = 0;
            }

            if (this.deg_rotate > -75) {
                this.deg_rotate -= 2;
                this.bee.rotate(pan_x, 0, -2);
            } else {
                this.bee.rotate(pan_x, 0, 0);
            }

            this.camera.pan(pan_x);
        }

        if (keymap['ArrowUp']) {
            if (this.deg_tilt > -25) {
                this.deg_tilt -= 0.5;

                this.camera.tilt(-0.5);
                this.bee.rotate(0, -0.5, 0);
            }
        } else if (keymap['ArrowDown']) {
            if (this.deg_tilt < 25) {
                this.deg_tilt += 0.5;

                this.camera.tilt(0.5);
                this.bee.rotate(0, 0.5, 0);
            }
        }
    }

    renderFloor() {
        push();
        fill(107,142,35);
        rotateX(90);
        beginShape();
        vertex(-10000, -10000, -200);
        vertex(10000, -10000, -200);
        vertex(10000, 10000, -200);
        vertex(-10000, 10000, -200);
        endShape();
        pop();
    }
    
    startFrames() {
        background('black');
      
        this.camera.setPosition(0, 0, 500);
        this.camera.lookAt(0, 0, 0);
        
        // set font from file, and style text
        fill('#ED225D');
        textFont(this.titlefont);
        textSize(25);
        textAlign(CENTER, TOP);
        // draw title
        text('Welcome To The Garden Game', 0, -300);
        
        // display & style image with arrow keys
        imageMode(CENTER);
        this.instructions.resize(800, (800) / 1.77777);
        image(this.instructions, 0 , 250);
        
        // draw the rotating flower
        push();
        translate(0, 0, 200);
        rotateX(180);
        rotateY(frameCount);
        rotateZ(frameCount);
        normalMaterial();
        scale(0.5);
        model(this.demo_flower);
        pop();
        
        // tell the user to continue
        textSize(14);
        fill('white');
        text('Press SPACE To Start!', 0, 390);
        
        // check if continue
        if (keymap['Space']) {
            // change frame responder so it draws the game
            this.newFrame = this.gameModeFrames;
            // camera needs to look in a different direction for the game
            this.camera.setPosition(0, 0, 0);
            this.camera.lookAt(0, 0, 300);
        }
    }
  
    gameModeFrames() {
        // draw over previous frame
        background('skyblue');

        // built in p5.js function
        lights();

        // analyises the output of the keydown event listener
        this.handleKeys();
        
        // renders floor as a 2D plane using vertex()
        this.renderFloor();

        // draws our charachter to the screen each frame
        this.renderBee();

        // draws all the stationary objects
        this.renderTrees(this.treePositions);
        this.renderRocks(this.rockPositions);
        this.renderFlowers(this.flowerPositions);
        this.renderSunFlowers(this.sunflowerPositions);
    }
}

let game;

function preload() {
    game = new Game();
}

function setup() {
    game.setup();
}

function draw() {
    game.newFrame();
}

// Sunflower by Poly by Google [CC-BY] via Poly Pizza