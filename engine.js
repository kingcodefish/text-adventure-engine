"use strict";

var currRoom;
var objects = {
    chamber: {
        type: "room",
        description: "Once, this was of the utmost in decor and ornamentation for someone equally deserving of their high appointment, but this too was long ago. Now, there's a constant chill as this bitter air can be felt gnawing through these walls. An all to real and present smell of death, blight, and other familiars have made their presence known. A man, I've awakened while spread on the floor atop the remnants of an animal fur rug. In this area, the floor maintains a different hue. The walls groan in an uncanny manner that needles a startled expression in my face. My ears close as I stand.",
        player: {
            description: "Just some dude."
        },
        bucket: {
            description: "Just a bucket."
        }
    },
    hallway: {
        type: "room",
        description: "Something that is empty..."
    },
    init: function() {
        for(var i in objects) {
            if(objects[i].hasOwnProperty("player")) {
                currRoom = i;
            }
        }
        delete this.init;
    }
};
objects.init();
var output = function(text) {
    $("<p>").text(text).appendTo(".tae-output");
};
var commands = {
    "look": function(object) {
        if(object === undefined) {
            output(objects[currRoom].description);
        } else if(objects[currRoom][object] !== undefined && objects[currRoom][object].hasOwnProperty("description")) {
            output(objects[currRoom][object].description);
        }
    }
};
$(".tae-input").bind("enterKey", function() {
    var input = $(".tae-input").val().split(/\s(.+)?/);
    input.length > 1 ? input.pop() : 0;
    console.log(input);
    commands[input[0]](input[1]);
    $(".tae-input").val("");
});
$(".tae-input").keyup(function(e) {
    if(e.keyCode == 13) {
        $(this).trigger("enterKey");
    }
});

/** --- INTERFACE --- **/
$(".tae-menu > div").on("click", function() {
    $(this).toggleClass("active");
    $(this).find(".tae-menu-wrapper").slideToggle("fast");
});