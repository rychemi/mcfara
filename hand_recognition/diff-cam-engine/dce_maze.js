var $motionBox = $('.motion-box');

var scale = 10;	// capture resolution over motion resolution
var isActivated = false;
var lostTimeout;

var directionTimer = false;

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

		if (!directionTimer) {
			var middleX = (box.x.max + box.x.min) / 2;
			var middleY = (box.y.max + box.y.min) / 2;

			if (middleX > 50 || middleX < 10 || middleY < 15 || middleY > 40) {
				directionTimer = true;
				setTimeout(function() { directionTimer = false; }, 500);
				if (middleX > 48) { //left
					move(37);
				}
				if (middleX < 12) {	//right
					move(39);
				}
				if (middleY < 17) {	//up
					move(38);
				}
				if (middleY > 38) {	//down
					move(40);
				}
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
