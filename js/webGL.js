"use strict";

var canvas;
var gl;

var maxNumPositions = 200;
var index = 0;
var linePoints = [];

var colors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0),  // cyan
    vec4(Math.random(), Math.random(), Math.random(), 1.0),  // random
];

var shapesList = [
    {name: "Line", value: 2},
    {name: "Triangle", value: 3},
    {name: "Rectangular", value: 4},
    {name: "Pentagon", value: 5},
    {name: "Polygon", value: Number.MAX_SAFE_INTEGER},
    {name: "Circle", value: 7},
    {name: "Star", value: 8},
];

var theta = 0.0;
var thetaLoc;
var speedRotation = 100;
var isRotate = false;
var direction = true;

var pointVec, colorVec;
var shape = shapesList[0];
var numPolygons = 0;
var numPositions = [];
numPositions[0] = 0;
var start = [0];
var cIndex = 0;
var state = states[0];
var theta = 0.0;
var thetaLoc;

init();

function init() {
    canvas = document.getElementById("gl-canvas");

    gl = canvas.getContext('webgl2');
    if (!gl) alert("WebGL 2.0 isn't available");

    // membuat warna dapat dipilih dengan button
    var button = document.getElementsByClassName("button");
    var addSelectClass = function () {
        removeSelectClass();
        this.classList.add('selected');
        cIndex = this.value;
        console.log(this.value);
    }

    var removeSelectClass = function () {
        for (var i = 0; i < button.length; i++) {
            button[i].classList.remove('selected')
        }
    }

    for (var i = 0; i < button.length; i++) {
        button[i].addEventListener("click", addSelectClass);
    }

    // membuat shape dapat dipilih dengan button
    const endPolygonButton = document.querySelector('.end-poly')
    const lineSlider = document.querySelector('.line-slider')
    var buttonShape = document.getElementsByClassName("button-shape");
    var addSelectClassShape = function () {
        removeSelectClassShape();
        this.classList.add('selected-shape');
        shape = shapesList[this.value];
        if (shape.name === "Polygon") {
            endPolygonButton.disabled = false;
        } else {
            endPolygonButton.disabled = true;
        }

        if (shape.name === "Line") {
            lineSlider.disabled = false;
        } else {
            lineSlider.disabled = true;
        }
        // reset point which unrendered
        numPositions[numPolygons] = 0;
        index = start[numPolygons];
    }

    var removeSelectClassShape = function () {
        for (var i = 0; i < buttonShape.length; i++) {
            buttonShape[i].classList.remove('selected-shape')
        }
    }

    for (var i = 0; i < buttonShape.length; i++) {
        buttonShape[i].addEventListener("click", addSelectClassShape);
    }


    var a = document.getElementById("Button1")
    a.addEventListener("click", function () {
        numPolygons++;
        numPositions[numPolygons] = 0;
        start[numPolygons] = index;
        render();
    });

    var clear = document.getElementById("btnClear")
    clear.addEventListener("click", () => {
        numPolygons = 0
        numPositions = [];
        numPositions[0] = 0;
        start = [0];
        index = 0;
        theta = 0;
        render()
      });

    canvas.addEventListener("mousedown", function (event) {
        pointVec = vec2(2 * (event.clientX - canvas.offsetLeft + window.scrollX) / canvas.width - 1,
            2 * (canvas.height - (event.clientY - canvas.offsetTop + window.scrollY)) / canvas.height - 1);


        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(pointVec));

        colorVec = vec4(colors[cIndex]);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(colorVec));

        numPositions[numPolygons]++;
        index++;
        console.log(numPositions)

        if (shape.name === "Rectangular" || shape.name === "Line") {
            linePoints[numPositions[numPolygons] - 1] = pointVec;
            if (numPositions[numPolygons] === 2) {
                var rasterizedPoint = []
                if (shape.name === "Line") {
                    var thickness = (lineSlider.value / 100) * 0.095 + 0.005;
                    rasterizedPoint = getDiagonal(linePoints[0][0], linePoints[0][1], linePoints[1][0], linePoints[1][1], thickness);
                } else if (shape.name === "Rectangular") {
                    rasterizedPoint = [
                        linePoints[0],
                        vec2(linePoints[1][0], linePoints[0][1]),
                        linePoints[1],
                        vec2(linePoints[0][0], linePoints[1][1])
                    ];
                }

                numPositions[numPolygons] -= 2;
                index -= 2;

                for (let i = 0; i < rasterizedPoint.length; i++) {
                    pointVec = rasterizedPoint[i];
                    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(pointVec));

                    colorVec = vec4(colors[cIndex]);

                    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
                    gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(colorVec));

                    numPositions[numPolygons]++;
                    index++;
                }
                renderShape()
            }
        }

        function renderShape() {
            numPolygons++;
            numPositions[numPolygons] = 0;
            start[numPolygons] = index;
            render();
        }

        // Pengecekan jumlah titik
        if (numPositions[numPolygons] === shape.value) {
            renderShape();
        }
    });

    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.99, 0.96, 0.93, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    var bufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 8 * maxNumPositions, gl.STATIC_DRAW);
    var postionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(postionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(postionLoc);

    var cBufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
    gl.bufferData(gl.ARRAY_BUFFER, 16 * maxNumPositions, gl.STATIC_DRAW);
    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    thetaLoc = gl.getUniformLocation(program, "uTheta");

    document.getElementById("btnRotate").onclick = function () {
        isRotate = !isRotate;
        var btnRotate = document.getElementById("btnRotate");
        if (isRotate) {
            btnRotate.classList.add("chosen");
            btnRotate.innerHTML = "Stop Rotate";
        } else {
            btnRotate.classList.remove("chosen");
            btnRotate.innerHTML = "Start Rotate";
        }
    }
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    if (isRotate) {
        theta += 1;
    }
    gl.uniform1f(thetaLoc, theta);

    setTimeout(
        function () {requestAnimationFrame(render);},
        speedRotation
    );

    for (var i = 0; i < numPolygons; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, start[i], numPositions[i]);
    }

    if (state.name == 'Rotating'){
        theta += 0.5;
    }else{
        theta = 0.0;
    }
    gl.uniform1f(thetaLoc, theta);
    colors[7] = vec4(Math.random(), Math.random(), Math.random(), 1.0);
}

function getDiagonal(x1, y1, x2, y2, distance) {
    const run = x2 - x1
    const rise = y2 - y1
    const hyp = Math.sqrt(Math.pow(rise, 2) + Math.pow(run, 2))
    const rotation = mat2(run / hyp, -rise / hyp, rise / hyp, run / hyp)
    const rotation180 = mat2(-1, 0, 0, -1)

    const point1 = vec2(x1, y1 + distance / 2)
    const origin1 = vec2(x1, y1)
    const p1 = (add(mult(rotation, subtract(point1, origin1)), origin1))
    const p2 = (add(mult(rotation180, subtract(p1, origin1)), origin1))

    const point3 = vec2(x2, y2 - distance / 2)
    const origin2 = vec2(x2, y2)
    const p3 = (add(mult(rotation, subtract(point3, origin2)), origin2))
    const p4 = (add(mult(rotation180, subtract(p3, origin2)), origin2))

    return [
        p1,
        p2,
        p3,
        p4
    ]
}

