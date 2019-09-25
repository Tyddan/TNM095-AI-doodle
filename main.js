/*
variables
*/
let model;
const classNames = [];
let canvas;
let coords = [];
let mousePressed = false;
let mode;

/*
prepare the drawing canvas
*/
$(function() {
    canvas = window.canvas = new fabric.Canvas('canvas');
    canvas.backgroundColor = '#ffffff';
    canvas.isDrawingMode = 0;
    canvas.freeDrawingBrush.color = "black";
    canvas.freeDrawingBrush.width = 10;
    canvas.renderAll();
    //setup listeners
    canvas.on('mouse:up', function(e) {
        //getFrame();
        mousePressed = false;
    });
    canvas.on('mouse:down', function(e) {
        mousePressed = true;
    });
    canvas.on('mouse:move', function(e) {
        recordCoordinates(e)
    });
});

/*
set the table of the predictions
*/
function setTable(top5, probability) {
    //loop over the predictions
    for (let i = 0; i < top5.length; i++) {
        let sym = document.getElementById('sym' + (i + 1));
        let prob = document.getElementById('prob' + (i + 1));
        sym.innerHTML = top5[i];
        prob.innerHTML = Math.round(probability[i] * 100);
    }
    //create the pie
    createPie(".pieID.legend", ".pieID.pie");

}

/*
record the current drawing coordinates
*/
function recordCoordinates(event) {
    const pointer = canvas.getPointer(event.e);
    const posX = pointer.x;
    const posY = pointer.y;

    if (posX >= 0 && posY >= 0 && mousePressed) {
        coords.push(pointer);
    }
}

/*
get the best bounding box by trimming around the drawing
*/
function getMinBox() {
    //get coordinates
    const coordinateX = coords.map(function (p) {
        return p.x;
    });
    const coordinateY = coords.map(function (p) {
        return p.y;
    });

    //find top left and bottom right corners
    const min_coords = {
        x: Math.min.apply(null, coordinateX),
        y: Math.min.apply(null, coordinateY)
    };
    const max_coords = {
        x: Math.max.apply(null, coordinateX),
        y: Math.max.apply(null, coordinateY)
    };

    return {
        min: min_coords,
        max: max_coords
    };
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
        const indices = findIndicesOfMax(pred, 5);
        const prob = findTopValues(pred, 5);
        const names = getClassNames(indices);

        //set the table
        setTable(names, prob);
    }

}

/*
get the the class names
*/
function getClassNames(indices) {
    const output = [];
    for (let i = 0; i < indices.length; i++)
        output[i] = classNames[indices[i]];
    return output;
}

/*
load the class names
*/
async function loadDict() {
    let loc = 'model/class_names.txt';

    await $.ajax({
        url: loc,
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
get indices of the top prob
*/
function findIndicesOfMax(inp, count) {
    const out = [];
    for (let i = 0; i < inp.length; i++) {
        out.push(i); // add index to output array
        if (out.length > count) {
            out.sort(function(a, b) {
                return inp[b] - inp[a];
            }); // descending sort the output array
            out.pop(); // remove the last index (index of smallest element in output array)
        }
    }
    return out;
}

/*
find the top 5 predictions
*/
function findTopValues(inp, count) {
    const out = [];
    let indices = findIndicesOfMax(inp, count);
    // show 5 greatest scores
    for (let i = 0; i < indices.length; i++)
        out[i] = inp[indices[i]];
    return out;
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
        return normalized.expandDims(0);
    })
}

/*
load the model
*/
async function start(cur_mode) {
    //arabic or english
    mode = cur_mode;

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
    const slider = document.getElementById('myRange');
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