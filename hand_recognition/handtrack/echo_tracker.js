const video = document.getElementById("myvideo");
const handimg = document.getElementById("handimage");
const canvas = document.getElementById("canvas");
const context = canvas.getContext("2d");
let trackButton = document.getElementById("trackbutton");
let updateNote = document.getElementById("updatenote");

let notepad = document.getElementById("notepad");
let pause = false;

let imgindex = 1
let isVideo = false;
let model = null;

// video.width = 500
// video.height = 400

const modelParams = {
    flipHorizontal: true,   // flip e.g for video  
    maxNumBoxes: 20,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.6,    // confidence threshold for predictions.
}


//up = 38, down = 40, left = 37, right = 39
//up, up, down, down, left, right, left, right, up, down, up, down, left, left, right, right
var dirScript1 = [38, 38, 40, 40, 37, 39, 37, 39, 38, 40, 38, 40, 37, 37, 39, 39];
//up, left, down, right, up, right, down, left, up
var dirScript2 = [38, 37, 40, 39, 38, 39, 40, 37, 38];
var directionScript = dirScript1;


var currentDir = 0;
var score = 0;
var capturing = false;


function playScript(num) {
	if (num == 1) {
		directionScript = dirScript1;
	}
	if (num == 2) {
		directionScript = dirScript2;
	}
	
	restartStopwatch();
	capturing = true;
	showNext();
}

function getDir(dir) {
	switch(dir) {
		case 37:
			return "LEFT";
		case 39:
			return "RIGHT";
		case 38:
			return "UP";
		case 40:
			return "DOWN";
		default:
			return "";
	}
}

function showNext() {
	document.getElementById("score").innerHTML = score;
	
	if (currentDir >= directionScript.length) {
		document.getElementById("instruction").innerHTML = "FINISHED";
		capturing = false;
		stopStopwatch();
		return;
	}
	var dir = getDir(directionScript[currentDir]);
	
	document.getElementById("instruction").innerHTML = dir;
	
}

function processResult(direction) {
    var result = "❌";

    if (direction == directionScript[currentDir]) {
        score++;
        result = "✔️";
    }

    stopwatchLap(getDir(directionScript[currentDir]), result);
    currentDir++;
    showNext();
}


function startVideo() {
    handTrack.startVideo(video).then(function (status) {
        console.log("video started", status);
        if (status) {
            updateNote.innerText = "video started! now tracking..."
            isVideo = true
            runDetection()
        } else {
            updateNote.innerText = "please enable video"
        }
    });
}

function toggleVideo() {
    if (!isVideo) {
        updateNote.innerText = "starting video"
        startVideo();
    } else {
        updateNote.innerText = "stopping video"
        handTrack.stopVideo(video)
        isVideo = false;
        updateNote.innerText = "video stopped"
    }
}


trackButton.addEventListener("click", function(){
    toggleVideo();
});


function runDetection() {
    model.detect(video).then(predictions => {
        console.log("Predictions: ", predictions);
        model.renderPredictions(predictions, canvas, context, video);
        if (isVideo) {
            requestAnimationFrame(runDetection);
        }
		
		for (let i = 0; i < predictions.length; i++) {
			//context.fillRect(predictions[i].bbox[0] + (predictions[i].bbox[2] / 2), predictions[i].bbox[1] + (predictions[i].bbox[3] / 2), 5, 5)
			//a.fillRect(e[r].bbox[0]+e[r].bbox[2]/2,e[r].bbox[1]+e[r].bbox[3]/2,5,5),
			
			let direction = false;
			if (predictions[i].bbox[0] + (predictions[i].bbox[2] / 2) < 125) {
				if (!pause) processResult(37);
				direction = true;
			}
			if (predictions[i].bbox[0] + (predictions[i].bbox[2] / 2) > 450) {
				if (!pause) processResult(39);
				direction = true;
			}
			if (predictions[i].bbox[1] + (predictions[i].bbox[3] / 2) > 350) {
				if (!pause) processResult(40);
				direction = true;
			}
			if (predictions[i].bbox[1] + (predictions[i].bbox[3] / 2) < 115) {
				if (!pause) processResult(38);
				direction = true;
			}
			
			pause = direction; //comment/uncomment for continuous predection
		}			
    });
}



// Load the model.
handTrack.load(modelParams).then(lmodel => {
    // detect objects in the image.
    model = lmodel
    updateNote.innerText = "model loaded!"
    //runDetectionImage(handimg)
    trackButton.disabled = false
});

