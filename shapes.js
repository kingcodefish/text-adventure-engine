/** --- GLOBAL VARIABLES --- **/
var BIG_NUMBER = 1000000;

/** --- MTV HANDLING --- **/
/*var MinimumTranslationVector = function(axis, overlap) {
    this.axis = axis;
    this.overlap = overlap;
};
function getMTV(shape1, shape2, displacement, axes) {
    var minimumOverlap = BIG_NUMBER,
        overlap,
        axisWithSmallestOverlap,
        mtv;

    for(var i = 0; i < axes.length; i++) {
        var axis = axes[i];
        var projection1 = shape1.project(axis);
        var projection2 = shape2.project(axis);
        overlap = projection1.getOverlap(projection2);

        if (overlap === 0) {
            return new MinimumTranslationVector(undefined, 0);
        }
        else {
            if (overlap < minimumOverlap) {
                minimumOverlap = overlap;
                axisWithSmallestOverlap = axis;
            }
        }
    }
    mtv = new MinimumTranslationVector(axisWithSmallestOverlap,
        minimumOverlap);
    return mtv;
};*/

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
    },
    reflect: function(axis) {
        var dotProductRatio, vdot1, ldot1, v = new Vector();
        vdot1 = this.dotProduct(axis);
        ldot1 = axis.dotProduct(axis);
        dotProductRatio = vdot1 / ldot1;

        v.x = 2 * dotProductRatio * axis.x - this.x;
        v.y = 2 * dotProductRatio * axis.y - this.y;

        return v;
    },
    centroid: function () {
        var pointSum = new Point(0,0);

        for (var i = 0; i < this.points.length; i++) {
            var point = this.points[i];
            pointSum.x += point.x;
            pointSum.y += point.y;
        }
        return new Point(pointSum.x / this.points.length,
            pointSum.y / this.points.length);
    }
};

/** --- PROJECTION HANDLING --- **/
var Projection = function(min, max) {
    this.min = min;
    this.max = max;
};
Projection.prototype = {
    overlaps: function(projection) {
        return this.max > projection.min && projection.max > this.min;
    },
    getOverlap: function(projection) {
        var overlap;

        if (!this.overlaps(projection))
            return 0;

        if (this.max > projection.max) {
            overlap = projection.max - this.min;
        }
        else {
            overlap = this.max - projection.min;
        }
        return overlap;
    }
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
    createPath: function(ctx) {
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
    },
    minimumTranslationVector: function(axes, shape) {
        var minimumOverlap = BIG_NUMBER,
            overlap,
            axisWithSmallestOverlap;

        for(var i = 0; i < axes.length; i++) {
            var axis = axes[i];
            var projection1 = shape.project(axis),
                projection2 = this.project(axis);
            overlap = projection1.overlaps(projection2);

            if(!overlap) {
                return {
                    axis: undefined,
                    overlap: 0
                };
            } else if(overlap < minimumOverlap) {
                minimumOverlap = overlap;
                axisWithSmallestOverlap = axis;
            }
        }
        return {
            axis: axisWithSmallestOverlap,
            overlap: minimumOverlap
        };
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
Polygon.prototype.project = function(axis) {
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
Polygon.prototype.collidesWith = function(shape) {
    return polygonCollidesWithPolygon(this, shape);
};

/** --- UTILITY FUNCTIONS --- **/
var polygonCollidesWithPolygon = function(p1, p2) {
    var mtv1 = p1.minimumTranslationVector(p1.getAxes(), p2),
        mtv2 = p1.minimumTranslationVector(p2.getAxes(), p2);

    if(mtv1.overlap === 0 && mtv2.overlap === 0) {
        return { axis: undefined, overlap: 0 };
    } else {
        return mtv1.overlap < mtv2.overlap ? mtv1 : mtv2;
    }
};