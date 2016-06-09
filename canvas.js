"use strict";

/** --- CANVAS ENVIRONMENT VARIABLES --- **/
var canvas = $("#game")[0];
var ctx = canvas.getContext("2d");
var mouseX = 0;
var mouseY = 0;
var keys = [];

/** --- CANVAS INITIALIZATION --- **/
canvas.width = 800;
canvas.height = 600;
ctx.clearRect(0, 0, canvas.width, canvas.height);

/** --- GAME VARIABLES --- **/
var rooms = [[[-150, -100], [0, -200], [150, -100], [150, 100], [-150, 100], "rgb(100, 100, 100)"]];

/** --- UTILITY FUNCTIONS --- **/
var getMousePos = function(e) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
    };
};

/** --- VECTOR HANDLING --- **/
var Vector = function(x, y) {
    this.x = x;
    this.y = y;
};
Vector.prototype = {
    getMagnitude: function() {
        return Math.sqrt(Math.pow((this.x, 2), (this.y, 2)));
    },
    add: function(vector) {
        var v = new Vector();
        v.x = this.x + vector.x;
        v.y = this.y + vector.y;
        return v;
    },
    subtract: function(vector) {
        var v = new Vector();
        v.x = this.x - vector.x;
        v.y = this.y - vector.y;
        return v;
    },
    dotProduct: function(vector) {
        return this.x * vector.x +
               this.y * vector.y;
    },
    edge: function(vector) {
        return this.subtract(vector);
    },
    perpendicular: function() {
        var v = new Vector();
        v.x = this.y;
        v.y = 0 - this.x;
        return v;
    },
    normalize: function() {
        var v = new Vector(0, 0);
        var m = this.getMagnitude();

        if(m !== 0) {
            v.x = this.x / m;
            v.y = this.y / m;
        }
        return v;
    },
    normal: function() {
        var p = this.perpendicular();
        return p.normalize();
    }
};

/** --- PROJECTION HANDLING --- **/
var Projection = function(min, max) {
    this.min = min;
    this.max = max;
};
Projection.prototype.overlaps = function(projection) {
    return this.max > projection.min && projection.max > this.min;
};

/** --- SHAPE HANDLING --- **/
var Shape = function() {
    this.x = undefined;
    this.y = undefined;
    this.strokeStyle = "rgba(255, 253, 208, 0.9)";
    this.fillStyle = "rgba(147, 197, 114, 0.8)";
};
Shape.prototype = {
    collidesWith: function(shape) {
        var axes = this.getAxes().concat(shape.getAxes());
        return !this.separationOnAxes(axes, shape);
    },
    separationOnAxes: function(axes, shape) {
        for(var i = 0; i < axes.length; i++) {
            var axis = axes[i];
            var projection1 = shape.project(axis);
            var projection2 = this.project(axis);

            if(!projection1.overlaps(projection2)) {
                return true;
            }
        }
        return false;
    },
    project: function() {
        throw "project(axis) not implemented";
    },
    getAxes: function() {
        throw "getAxes() not implemented";
    },
    move: function(dx, dy) {
        throw "move(dx, dy) not implemented";
    },
    createPath: function(context) {
        throw "createPath(ctx) not implemented";
    },
    fill: function(ctx) {
        ctx.save();
        ctx.fillStyle = this.fillStyle;
        this.createPath(ctx);
        ctx.fill();
        ctx.restore();
    },
    stroke: function(ctx) {
        ctx.save();
        ctx.strokeStyle = this.strokeStyle;
        this.createPath(ctx);
        ctx.stroke();
        ctx.restore();
    },
    isPointInPath: function(ctx, x, y) {
        this.createPath(ctx);
        return ctx.isPointInPath(x, y);
    }
};

/** --- POINT HANDLING --- **/
var Point = function(x, y) {
    this.x = x;
    this.y = y;
};

/** --- POLYGON HANDLING --- **/
var Polygon = function() {
    this.points = [];
    this.strokeStyle = "blue";
    this.fillStyle = "white";
};
Polygon.prototype = new Shape();
Polygon.prototype.getAxes = function() {
    var v1 = new Vector();
    var v2 = new Vector();
    var axes = [];

    for(var i = 0; i < this.points.length - 1; i++) {
        v1.x = this.points[i].x;
        v1.y = this.points[i].y;

        v2.x = this.points[i + 1].x;
        v2.y = this.points[i + 1].y;

        axes.push(v1.edge(v2).normal());
    }

    v1.x = this.points[this.points.length - 1].x;
    v1.y = this.points[this.points.length - 1].y;

    v2.x = this.points[0].x;
    v2.y = this.points[0].y;

    axes.push(v1.edge(v2).normal());

    return axes;
};
Polygon.prototype.project = function() {
    var scalars = [];
    var v = new Vector();

    this.points.forEach(function(point) {
        v.x = point.x;
        v.y = point.y;
        scalars.push(v.dotProduct(axis));
    });

    return new Projection(Math.min.apply(Math, scalars),
                          Math.max.apply(Math, scalars));
};
Polygon.prototype.addPoint = function(x, y) {
    this.points.push(new Point(x, y));
};
Polygon.prototype.createPath = function(ctx) {
    if(this.points.length === 0) {
        return;
    }

    ctx.beginPath();
    ctx.moveTo(this.points[0].x,
               this.points[0].y);

    for(var i = 0; i < this.points.length; i++) {
        ctx.lineTo(this.points[i].x,
                   this.points[i].y);
    }

    ctx.closePath();
};
Polygon.prototype.move = function(dx, dy) {
    for(var i = 0; i < this.points.length; i++) {
        var point = this.points[i];
        point.x += dx;
        point.y += dy;
    }
};

/** --- MAP HANDLING --- **/
var Map = function() {
    this.rotation = 0;
    this.translation = 0;
};
Map.prototype.update = function() {
    for(var i = 0; i < rooms.length; i++) {
        for (var j = 0; j < rooms[i].length - 1; j++) {
            var x = rooms[i][j][0];
            var y = rooms[i][j][1] + this.translation;
            rooms[i][j][0] = x * Math.cos(this.rotation) - y * Math.sin(this.rotation);
            rooms[i][j][1] = x * Math.sin(this.rotation) + y * Math.cos(this.rotation) - this.translation;
        }
    }
};
Map.prototype.draw = function() {
    ctx.translate(0, this.translation);
    for(var i = 0; i < rooms.length; i++) {
        ctx.fillStyle = rooms[i][rooms[i].length - 1];
        ctx.beginPath();
            for (var j = 0; j < rooms[i].length - 1; j++) {
                ctx.lineTo(rooms[i][j][0], rooms[i][j][1]);
            }
        ctx.closePath();
        ctx.fill();
    }
};
var map = new Map();

/** --- PLAYER HANDLING --- **/
var Player = function(r) {
    this.r = r;
    this.MOVEMENT_SPEED = 4;
    this.ROTATION_SPEED = 0.05;
};
Player.prototype.update = function() {
    if(keys["ArrowUp"]) {
        map.translation += this.MOVEMENT_SPEED;
    }
    if(keys["ArrowDown"]) {
        map.translation -= this.MOVEMENT_SPEED;
    }
    if(keys["ArrowLeft"]) {
        map.rotation = this.ROTATION_SPEED;
    } else if(keys["ArrowRight"]) {
        map.rotation = -this.ROTATION_SPEED;
    } else {
        map.rotation = 0;
    }
};
Player.prototype.draw = function() {
    ctx.fillStyle = "rgb(255, 0, 0)";
    ctx.beginPath();
        ctx.moveTo(canvas.width / 2 + this.r, canvas.height / 2);
        ctx.lineTo(canvas.width / 2, canvas.height / 2 - this.r * 2);
        ctx.lineTo(canvas.width / 2 - this.r, canvas.height / 2);
        ctx.arc(canvas.width / 2, canvas.height / 2, this.r, 0, Math.PI, false);
        ctx.closePath();
    ctx.fill();
};
var player = new Player(20);

var POLYGON_POINTS = [[new Point(250, 150), new Point(250, 250), new Point(350, 250)],
                      [new Point(100, 100), new Point(100, 150), new Point(150, 150), new Point(150, 100)],
                      [new Point(400, 100), new Point(380, 150), new Point(500, 150), new Point(520, 100)]];

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
    }
};

/** --- GAME INITIALIZATION --- **/
var draw = function() {
    Game.background();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    Game.map();
    // Reset Transformation Matrix
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for(var i = 0; i < POLYGON_POINTS.length; i++) {
        var p = new Polygon();
        for(var j = 0; j < POLYGON_POINTS[i].length; j++) {
            p.addPoint(POLYGON_POINTS[i][j].x, POLYGON_POINTS[i][j].y);
        }
        p.stroke(ctx);
    }
    Game.player();

    window.requestAnimationFrame(draw);
};
draw();

/** --- EVENT LISTENERS --- **/
canvas.addEventListener("mousemove", function(e) {
    var mousePos = getMousePos(e);
    mouseX = mousePos.x;
    mouseY = mousePos.y;
});
canvas.addEventListener("keydown", function(e) {
    keys[e.key] = true;
    e.preventDefault();
});
canvas.addEventListener("keyup", function(e) {
    keys[e.key] = false;
    e.preventDefault();
});