// Hardcore JS Activate! :P
"use strict";

/** --- CANVAS ENVIRONMENT VARIABLES --- **/
var canvas = $("#game")[0];
var ctx = canvas.getContext("2d");
var mouseX = 0;
var mouseY = 0;
var keys = [];
var translateKey = undefined;

/** --- CANVAS INITIALIZATION --- **/
canvas.width = 800;
canvas.height = 600;
ctx.clearRect(0, 0, canvas.width, canvas.height);

/** --- GAME VARIABLES --- **/
var rooms = [[[-150, -100], [0, -200], [150, -100], [150, 100], [-150, 100], "rgb(100, 100, 100)"]];
var shapes = [];
var onlyPolygons = false;

var POLYGON_POINTS = [[new Point(-150, -100), new Point(-150, -120), new Point(0, -220), new Point(0, -200)]];
var POLYGON_STROKE_STYLES = ["rgb(150, 150, 255)", "rgb(150, 150, 255)"];
var POLYGON_FILL_STYLES = ["rgba(255, 255, 255, 0.0)", "rgba(255, 255, 255, 0.0)"];

var velocity = new Vector(new Point(350, 190));

/** --- UTILITY FUNCTIONS --- **/
var getMousePos = function(e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
};

/** --- MAP HANDLING --- **/
var Map = function() {
    this.velocity = { x: 0, y: 0 };
    this.lastVelocity = { x:0, y: 0 };
    this.lastRotation = 0;
    this.rotation = 0;
    this.lastTranslation = 0;
    this.translation = 0;
};
Map.prototype.update = function() {
    for(var i = 0; i < rooms.length; i++) {
        for (var j = 0; j < rooms[i].length - 1; j++) {
            var x = rooms[i][j][0];
            var y = rooms[i][j][1] + this.translation;
            rooms[i][j][0] = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
            rooms[i][j][1] = x * Math.sin(this.rotation) + y * Math.cos(this.rotation);
        }
    }
    for(var i = 0; i < shapes.length; i++) {
        for(var j = 0; j < shapes[i].points.length; j++) {
            var point = shapes[i].points[j];
            var x = point.x;
            var y = point.y + this.translation;
            point.x = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
            point.y = x * Math.sin(this.rotation) + y * Math.cos(this.rotation);
        }
    }
};
Map.prototype.separate = function(mtv) {
    var dx, dy, velocityMagnitude, point;

    if(mtv.axis === undefined) {
        point = new Point();
        velocityMagnitude = Math.sqrt(Math.pow(this.velocity.x, 2) +
            Math.pow(this.velocity.y, 2));

        point.x = this.velocity.x / velocityMagnitude;
        point.y = this.velocity.y / velocityMagnitude;

        mtv.axis = new Vector(point);
    }

    dy = mtv.axis.y * mtv.overlap;
    dx = mtv.axis.x * mtv.overlap;

    if((dx < 0 && this.velocity.x < 0) ||
        (dx > 0 && this.velocity.x > 0)) {
        dx = -dx;
    }

    if((dy < 0 && this.velocity.y < 0) ||
        (dy > 0 && this.velocity.y > 0)) {
        dy = -dy;
    }
    this.move(dx, dy);
};
Map.prototype.move = function(dx, dy) {
    this.lastVelocity = this.velocity;
    this.velocity.x += dx;
    this.velocity.y += dy;
    this.lastTranslation = this.translation;
    this.translation += dy;
};
Map.prototype.draw = function() {
    if(!onlyPolygons) {
        for (var i = 0; i < rooms.length; i++) {
            ctx.fillStyle = rooms[i][rooms[i].length - 1];
            ctx.beginPath();
            for (var j = 0; j < rooms[i].length - 1; j++) {
                ctx.lineTo(rooms[i][j][0], rooms[i][j][1]);
            }
            ctx.closePath();
            ctx.fill();
        }
    } else {
        shapes.forEach(function(shape) {
            shape.stroke(ctx);
            shape.fill(ctx);
        });
    }
};
var map = new Map();

/** --- PLAYER HANDLING --- **/
var Player = function(r) {
    this.r = r;
    this.MOVEMENT_SPEED = 4;
    this.ROTATION_SPEED = 0.05;
    this.POLY = new Polygon();
    this.POLY.points = [new Point(0, -40), new Point(-20, 0), new Point(-15, 15), new Point(0, 20), new Point(15, 15), new Point(20, 0)];
};
Player.prototype.update = function() {
    if(keys["ArrowUp"] && !keys["ArrowDown"]) {
        map.lastVelocity.y = map.velocity.y;
        map.velocity.y += this.MOVEMENT_SPEED;
        map.lastTranslation = this.MOVEMENT_SPEED;
        map.translation = this.MOVEMENT_SPEED;
    }
    if(keys["ArrowDown"] && !keys["ArrowUp"]) {
        map.lastVelocity.y = map.velocity.y;
        map.velocity.y -= this.MOVEMENT_SPEED;
        map.lastTranslation = -this.MOVEMENT_SPEED;
        map.translation = -this.MOVEMENT_SPEED;
    }
    if(!keys["ArrowUp"] && !keys["ArrowDown"]) {
        map.lastTranslation = map.translation;
        map.translation = 0;
    }
    if(keys["ArrowLeft"]) {
        map.lastRotation = this.ROTATION_SPEED;
        map.rotation = this.ROTATION_SPEED;
    } else if(keys["ArrowRight"]) {
        map.lastRotation = -this.ROTATION_SPEED;
        map.rotation = -this.ROTATION_SPEED;
    } else {
        map.lastRotation = map.rotation;
        map.rotation = 0;
    }
    console.log("velocity: %d, lastVelocity: %d", map.velocity.y, map.lastVelocity.y);
};
Player.prototype.draw = function() {
    if (!onlyPolygons) {
        ctx.fillStyle = "rgb(255, 0, 0)";
        ctx.beginPath();
        ctx.moveTo(this.r, 0);
        ctx.lineTo(0, -this.r * 2);
        ctx.lineTo(-this.r, 0);
        ctx.arc(0, 0, this.r, 0, Math.PI, false);
        ctx.closePath();
        ctx.fill();
    } else {
        this.POLY.stroke(ctx);
    }
};
var player = new Player(20);

var collisionDetected = function(mtv) {
    return mtv.axis !== undefined || mtv.overlap !== 0;
};
var handleShapeCollisions = function() {
    shapes.forEach(function(shape) {
        var mtv = player.POLY.collidesWith(shape);
        if(collisionDetected(mtv)) {
            console.log("Collision!");
            map.separate(mtv);
        }
    });
};
var detectCollisions = function() {
    handleShapeCollisions();
};

/** --- GAME HANDLING --- **/
var Game = {
    background: function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Graph Paper Gen
        ctx.strokeStyle = "rgb(210, 210, 255)";
        ctx.lineWidth = 1;
        for(var x = 0.5; x < canvas.width; x += 20) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        for(var y = 0.5; y < canvas.height; y += 20) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        // Very Right and Bottom Lines
        ctx.moveTo(canvas.width - 0.5, 0);
        ctx.lineTo(canvas.width - 0.5, canvas.height);
        ctx.moveTo(0, canvas.height - 0.5);
        ctx.lineTo(canvas.width, canvas.height - 0.5);
        ctx.stroke();
    },
    map: function() {
        map.update();
        map.draw();
    },
    player: function() {
        player.update();
        player.draw();
    },
    setup: function() {
        for(var i = 0; i < POLYGON_POINTS.length; i++) {
            var polygon = new Polygon();
            var points = POLYGON_POINTS[i];

            polygon.strokeStyle = POLYGON_STROKE_STYLES[i];
            polygon.fillStyle = POLYGON_FILL_STYLES[i];

            points.forEach(function(point) {
                polygon.addPoint(point.x, point.y);
            });

            shapes.push(polygon);
        }
        this.draw();
    },
    draw: function() {
        detectCollisions();
        Game.background();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        Game.map();
        Game.player();

        // Reset Transformation Matrix
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        window.requestAnimationFrame(Game.draw);
    }
};

/** --- GAME INITIALIZATION --- **/
Game.setup();

/** --- EVENT LISTENERS --- **/
canvas.addEventListener("keydown", function(e) {
    keys[e.key] = true;
    e.preventDefault();
});
canvas.addEventListener("keyup", function(e) {
    keys[e.key] = false;
    e.preventDefault();
});

$("#onlyPolygons").on("change", function() {
    onlyPolygons = !onlyPolygons;
});