/*
variables
*/
var model;
var classNames = [];
var canvas;
var coords = [];
var mousePressed = false;
var mode;
var content;
var random;
var randomClass;

/*
prepare the drawing canvas 
*/
$(function() {
    canvas = window._canvas = new fabric.Canvas('canvas');
    canvas.backgroundColor = '#ffffff';
    canvas.isDrawingMode = 0;
    canvas.freeDrawingBrush.color = "black";
    canvas.freeDrawingBrush.width = 10;
    canvas.renderAll();
    //setup listeners 
    canvas.on('mouse:up', function() {
        getFrame();
        mousePressed = false
    });
    canvas.on('mouse:down', function() {
        mousePressed = true
    });
    canvas.on('mouse:move', function(e) {
        recordCoordinates(e)
    });
});

/*
set the table of the predictions 
*/
function setTable(topGuess, probability) {
    //loop over the predictions 
    for (var i = 0; i < topGuess.length; i++) {
        let sym = document.getElementById('sym' + (i + 1));
        let prob = document.getElementById('prob' + (i + 1));
        sym.innerHTML = topGuess[i];
        prob.innerHTML = Math.round(probability[i] * 100);

        if(sym.innerHTML === randomClass)
        {
            setTimeout(function(){
                sym.innerHTML = 'I GUESSED RIGHT';
                prob.innerHTML = '';
            }, 1000);

            setTimeout(function(){
                erase();
                RndText();
                sym.innerHTML = '';
            }, 3000);
        }
    }
}

/*
random class chosen for user to draw
*/
function RndText() {
    content = document.getElementById("ShowText");
    random = parseInt(Math.random() * classNames.length);
    randomClass = classNames[random];
    content.innerHTML= randomClass;
}

/*
record the current drawing coordinates
*/
function recordCoordinates(event) {
    var pointer = canvas.getPointer(event.e);
    var posX = pointer.x;
    var posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer)
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates 
    var coordinateX = coords.map(function(p) {
        return p.x
    });
    var coordinateY = coords.map(function(p) {
        return p.y
    });

    //find top left and bottom right corners 
    var min_coords = {
        x: Math.min.apply(null, coordinateX),
        y: Math.min.apply(null, coordinateY)
    };
    var max_coords = {
        x: Math.max.apply(null, coordinateX),
        y: Math.max.apply(null, coordinateY)
    };

    return {
        min: min_coords,
        max: max_coords
    }
}

/*
get the current image data 
*/
function getImageData() {
    //get the minimum bounding box around the drawing
    const mbb = getMinBox();

    //get image data according to dpi
    const dpi = window.devicePixelRatio;
    return canvas.contextContainer.getImageData(mbb.min.x * dpi, mbb.min.y * dpi,
        (mbb.max.x - mbb.min.x) * dpi, (mbb.max.y - mbb.min.y) * dpi);
}

/*
get the prediction 
*/
function getFrame() {
    //make sure we have at least two recorded coordinates 
    if (coords.length >= 2) {

        //get the image data from the canvas 
        const imgData = getImageData();

        //get the prediction 
        const pred = model.predict(preprocess(imgData)).dataSync();

        //find the top prediction
        const indices = findIndicesOfMax(pred, 1);
        const probability = findTopValues(pred, 1);
        const names = getClassNames(indices);

        //set the table 
        setTable(names, probability)
    }
}

/*
get the the class names 
*/
function getClassNames(indices) {
    var output = [];
    for (var i = 0; i < indices.length; i++)
        output[i] = classNames[indices[i]];
    return output
}

/*
load the class names 
*/
async function loadDict() {
    await $.ajax({
        url: 'model/class_names.txt',
        dataType: 'text',
    }).done(success);
}

/*
load the class names
*/
function success(data) {
    const lst = data.split(/\n/);
    for (var i = 0; i < lst.length - 1; i++) {
        classNames[i] = lst[i]
    }
}

/*
get indices of the top probability
*/
function findIndicesOfMax(inp, count) {
    var output = [];
    for (var i = 0; i < inp.length; i++) {
        output.push(i); // add index to output array
        if (output.length > count) {
            output.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            output.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    return output;
}

/*
find the top prediction
*/
function findTopValues(inp, count) {
    var output = [];
    let indices = findIndicesOfMax(inp, count);
    // show greatest score
    for (var i = 0; i < indices.length; i++)
        output[i] = inp[indices[i]];
    return output
}

/*
preprocess the data
*/
function preprocess(imgData) {
    return tf.tidy(() => {
        //convert to a tensor 
        let tensor = tf.browser.fromPixels(imgData, numChannels = 1);
        
        //resize 
        const resize = tf.image.resizeBilinear(tensor, [28, 28]).toFloat();
        
        //normalize 
        const offset = tf.scalar(255.0);
        const normalized = tf.scalar(1.0).sub(resize.div(offset));

        //We add a dimension to get a batch shape
        return normalized.expandDims(0)
    })
}

/*
load the model
*/
async function start() {
    //load the model 
    model = await tf.loadLayersModel('model/model.json');
    
    //warm up 
    model.predict(tf.zeros([1, 28, 28, 1]));
    
    //allow drawing on the canvas 
    allowDrawing();
    
    //load the class names
    await loadDict();
}

/*
allow drawing on canvas
*/
function allowDrawing() {
    canvas.isDrawingMode = 1;
    document.getElementById('status').innerHTML = 'Model Loaded';

    $('button').prop('disabled', false);
    /*var slider = document.getElementById('myRange');
    slider.oninput = function() {
        canvas.freeDrawingBrush.width = this.value;
    };*/
}

/*
clear the canvas
*/
function erase() {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    coords = [];
}
