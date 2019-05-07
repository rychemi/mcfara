var $motionBox = $('.motion-box');

var scale = 10;	// capture resolution over motion resolution
var isActivated = false;
var lostTimeout;

var directionTimer = false;

//up = 38, down = 40, left = 37, right = 39
//up, up, down, down, left, right, left, right, up, down, up, down, left, left, right, right
var dirScript1 = [38, 38, 40, 40, 37, 39, 37, 39, 38, 40, 38, 40, 37, 37, 39, 39];
//up, left, down, right, up, right, down, left, up
var dirScript2 = [38, 37, 40, 39, 38, 39, 40, 37, 38];
var directionScript = dirScript1.concat(dirScript2);


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

function initSuccess() {
	DiffCamEngine.start();
}

function initError() {
	alert('Something went wrong.');
}

function startComplete() {
	setTimeout(activate, 500);	
}

function activate() {
	isActivated = true;
}

function capture(payload) {
	if (!isActivated) {
		return;
	}

	var box = payload.motionBox;
	if (box) {
		// video is flipped, so we're positioning from right instead of left
		var right = box.x.min * scale + 1;
		var top = box.y.min * scale + 1;
		var width = (box.x.max - box.x.min) * scale;
		var height = (box.y.max - box.y.min) * scale;

		$motionBox.css({
			display: 'block',
			right: right,
			top: top,
			width: width,
			height: height
		});

		if (capturing && !directionTimer) {
			var middleX = (box.x.max + box.x.min) / 2;
			var middleY = (box.y.max + box.y.min) / 2;
			var result = "❌";

			if (middleX > 50 || middleX < 10 || middleY < 15 || middleY > 40) {
				directionTimer = true;
				setTimeout(function() { directionTimer = false; }, 1000);
				if (middleX > 48 && directionScript[currentDir] == 37) { //left
					score++;
					result = "✔️";
				}
				if (middleX < 12 && directionScript[currentDir] == 39) {	//right
					score++;
					result = "✔️";
				}
				if (middleY < 17 && directionScript[currentDir] == 38) {	//up
					score++;
					result = "✔️";
				}
				if (middleY > 38 && directionScript[currentDir] == 40) {	//down
					score++;
					result = "✔️";
				}

				stopwatchLap(getDir(directionScript[currentDir]), result);
				currentDir++;
				showNext();
			}
		}
		
		clearTimeout(lostTimeout);
		lostTimeout = setTimeout(2000);
	}
	
}


DiffCamEngine.init({
	video: document.getElementById('video'),
	captureIntervalTime: 75,
	includeMotionBox: true,
	includeMotionPixels: true,
	initSuccessCallback: initSuccess,
	initErrorCallback: initError,
	startCompleteCallback: startComplete,
	captureCallback: capture
});
