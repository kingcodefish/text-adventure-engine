var output = function(text) {
    $(".tae-output").append(text);
};
var rooms = [];
var objects = {
    "chamber": {
        type: "room",
        description: "Once, this was of the utmost in decor and ornamentation for someone equally deserving of their high appointment, but this too was long ago. Now, there's a constant chill as this bitter air can be felt gnawing through these walls. An all to real and present smell of death, blight, and other familiars have made their presence known. A man, I've awakened while spread on the floor atop the remnants of an animal fur rug. In this area, the floor maintains a different hue. The walls groan in an uncanny manner that needles a startled expression in my face. My ears close as I stand.",
        player: {
            description: "Just some dude.",
            parent: 0
        }
    },
    init: function() {
        this.player.parent = this;
        delete this.init;
        return this;
    }
}.init();
for(var i in objects) {
    if(objects[i].type === "room") {
        rooms.push(objects[i]);
    }
}
var commands = {
    "look": function(object) {
        output(objects.player.parent.description);
    }
};
$(".tae-input").bind("enterKey", function(e) {
    var input = $(".tae-input").val().split(" ");
    commands[input[0]](input[1]);
    $(".tae-input").val("");
});
$(".tae-input").keyup(function(e) {
    if(e.keyCode == 13) {
        $(this).trigger("enterKey");
    }
});