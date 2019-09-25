/*
variables
*/
let model;
let classNames = [];
let canvas;
let coords = [];
let mousePressed = false;
let mode;

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
        let sym = document.getElementById('sym' + (topGuess));
        let prob = document.getElementById('prob' + (topGuess));
        sym.innerHTML = topGuess;
        prob.innerHTML = Math.round(probability[i] * 100);
    }
    //create the pie 
    createPie(".pieID.legend", ".pieID.pie");
}

/*
record the current drawing coordinates
*/
function recordCoordinates(event) {
    let pointer = canvas.getPointer(event.e);
    let posX = pointer.x;
    let posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer)
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates 
    let coordinateX = coords.map(function(p) {
        return p.x
    });
    let coordinateY = coords.map(function(p) {
        return p.y
    });

    //find top left and bottom right corners 
    let min_coords = {
        x: Math.min.apply(null, coordinateX),
        y: Math.min.apply(null, coordinateY)
    };
    let max_coords = {
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

        //find the top 5 predictions 
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
    let output = [];
    for (let i = 0; i < indices.length; i++)
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
    for (let i = 0; i < lst.length - 1; i++) {
        classNames[i] = lst[i]
    }
}

/*
get indices of the top probabilities
*/
function findIndicesOfMax(inp, count) {
    let output = [];
    for (let i = 0; i < inp.length; i++) {
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
find the top 5 predictions
*/
function findTopValues(inp, count) {
    let output;
    let indices = findIndicesOfMax(inp, count);
    // show 5 greatest scores
        output = inp[indices];
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
    await loadDict()
}

/*
allow drawing on canvas
*/
function allowDrawing() {
    canvas.isDrawingMode = 1;
    
    document.getElementById('status').innerHTML = 'Model Loaded';

    $('button').prop('disabled', false);
    let slider = document.getElementById('myRange');
    slider.oninput = function() {
        canvas.freeDrawingBrush.width = this.value;
    };
}

/*
clear the canvas
*/
function erase() {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    coords = [];
}
