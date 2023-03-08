"use strict";

var canvas;
var gl;

var maxNumPositions = 200;
var index = 0;

var cindex = 0;

var colors = [
    vec4(0.0, 0.0, 0.0, 1.0),  // black
    vec4(1.0, 0.0, 0.0, 1.0),  // red
    vec4(1.0, 1.0, 0.0, 1.0),  // yellow
    vec4(0.0, 1.0, 0.0, 1.0),  // green
    vec4(0.0, 0.0, 1.0, 1.0),  // blue
    vec4(1.0, 0.0, 1.0, 1.0),  // magenta
    vec4(0.0, 1.0, 1.0, 1.0)   // cyan
];

var shapesList = [
    "Garis",
    "Segitiga",
    "Segiempat",
    "Segibanyak",
    "Lingkaran",
    "Bintang",
];
var pointVec, colorVec;
var shape = shapesList[0];
var numPolygons = 0;
var numPositions = [];
numPositions[0] = 0;
var start = [0];

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
        cindex = this.value;
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

    var buttonShape = document.getElementsByClassName("button-shape");
    var addSelectClassShape = function () {
        removeSelectClassShape();
        this.classList.add('selected-shape');
        shape = shapesList[this.value];
        console.log(shape);
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

    canvas.addEventListener("mousedown", function (event) {
        pointVec = vec2(2 * (event.clientX - canvas.offsetLeft + window.scrollX) / canvas.width - 1,
            2 * (canvas.height - (event.clientY - canvas.offsetTop + window.scrollY)) / canvas.height - 1);


        gl.bindBuffer(gl.ARRAY_BUFFER, bufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 8 * index, flatten(pointVec));

        colorVec = vec4(colors[cindex]);

        gl.bindBuffer(gl.ARRAY_BUFFER, cBufferId);
        gl.bufferSubData(gl.ARRAY_BUFFER, 16 * index, flatten(colorVec));

        numPositions[numPolygons]++;
        index++;
    });



    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.8, 0.8, 0.8, 1.0);
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
}

function render() {

    gl.clear(gl.COLOR_BUFFER_BIT);

    for (var i = 0; i < numPolygons; i++) {
        gl.drawArrays(gl.TRIANGLE_FAN, start[i], numPositions[i]);
    }
}
