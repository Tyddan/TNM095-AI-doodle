var lines;
var randomName;
var lastRandomName;

$(document.body).ready(function () {

    // load the trivia from the server
    $.ajax({
        url: 'mini_classes.txt'
    }).done(function(content) {

        // normalize the line breaks, then split into lines
        lines = content.replace(/\r\n|\r/g, '\n').trim().split('\n');

        // only set up the click handler if there were lines found
        if (lines && lines.length) {
            $('#showLine').on('click', function () {
                // loop to prevent repeating the last random number
                while (randomName === lastRandomName) {
                    randomName = parseInt(Math.random() * lines.length);
                    // check to prevent infinite loop
                    if (lines.length === 1) { break; }
                }
                // keep track of the last random number
                lastRandomName = randomName;

                // show the corresponding line
                $('#random').text(lines[randomName]);
            });
        }
    });
});