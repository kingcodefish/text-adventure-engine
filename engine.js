"use strict";

var currRoom;
var objects = {
    chamber: {
        type: "room",
        description: "Once, this was of the utmost in decor and ornamentation for someone equally deserving of their high appointment, but this too was long ago. Now, there's a constant chill as this bitter air can be felt gnawing through these walls. An all to real and present smell of death, blight, and other familiars have made their presence known. A man, I've awakened while spread on the floor atop the remnants of an animal fur rug. In this area, the floor maintains a different hue. The walls groan in an uncanny manner that needles a startled expression in my face. My ears close as I stand.",
        player: {
            type: "player",
            description: "Just some dude.",
            inventory: []
        },
        bucket: {
            type: "object",
            aliases: "tool",
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
            /** --- ALIASING --- **/
            if(typeof objects[i] === "object") {
                for(var j in objects[i]) {
                    if (objects[i][j].hasOwnProperty("aliases")) {
                        var aliases = objects[i][j].aliases.split(/,\s?/);
                        for(var k = 0; k < aliases.length; k++) {
                            objects[i][aliases[k]] = objects[i][j];
                        }
                    }
                }
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
        } else if(objects[currRoom][object].hasOwnProperty("description")) {
            output(objects[currRoom][object].description);
        }
    },
    "take": function(object) {
        if (objects[currRoom][object].type === "object") {
            objects[currRoom].player.inventory.push(objects[currRoom][object]);
            var currAliases = objects[currRoom][object].aliases.split("/,\s?/");
            for(var i = 0; i < currAliases.length; i++) {
                console.log(currAliases[i]);
                delete objects[currRoom][currAliases[i]];
            }
            delete objects[currRoom][object];
            $("<p>").text(object).appendTo(".tae-inventory .tae-menu-wrapper");
            output("You took the " + object);
        } else {
            output("You can't pick that up.");
        }
    }
};
for(var i = 0; i < objects[currRoom].player.inventory.length; i++) {
    $("<p>").text(objects[currRoom].player.inventory[i]).appendTo(".tae-inventory .tae-menu-wrapper");
}
$(".tae-input").bind("enterKey", function() {
    var input = $(".tae-input").val().split(/\s(.+)?/);
    input.length > 1 ? input.pop() : 0;
    $("<pre>").text(input[0] + (input[1] !== undefined ? " " + input[1] : "")).appendTo(".tae-output");
    if (commands[input[0]] !== undefined && objects[currRoom][input[1]] !== undefined
        || commands[input[0]] !== undefined && input[1] === undefined) {
        commands[input[0]](input[1]);
    } else if(commands[input[0]] === undefined) {
        output(input[0] + " is not a known command.");
    } else {
        output(input[1] + " doesn't exist.");
    }
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