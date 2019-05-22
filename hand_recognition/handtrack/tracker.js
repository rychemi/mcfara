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

var directionTimer = false;

// video.width = 500
// video.height = 400

const modelParams = {
    flipHorizontal: true,   // flip e.g for video  
    maxNumBoxes: 20,        // maximum number of boxes to detect
    iouThreshold: 0.5,      // ioU threshold for non-max suppression
    scoreThreshold: 0.6,    // confidence threshold for predictions.
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
        
        if(!directionTimer) {
            for (let i = 0; i < predictions.length; i++) {
                //context.fillRect(predictions[i].bbox[0] + (predictions[i].bbox[2] / 2), predictions[i].bbox[1] + (predictions[i].bbox[3] / 2), 5, 5)
                //a.fillRect(e[r].bbox[0]+e[r].bbox[2]/2,e[r].bbox[1]+e[r].bbox[3]/2,5,5),
                
                let direction = false;
                if (predictions[i].bbox[0] + (predictions[i].bbox[2] / 2) < 125) {
                    if (!pause) notepad.innerHTML += "LEFT ";
                    direction = true;
                }
                if (predictions[i].bbox[0] + (predictions[i].bbox[2] / 2) > 450) {
                    if (!pause) notepad.innerHTML += "RIGHT ";
                    direction = true;
                }
                if (predictions[i].bbox[1] + (predictions[i].bbox[3] / 2) > 350) {
                    if (!pause) notepad.innerHTML += "DOWN ";
                    direction = true;
                }
                if (predictions[i].bbox[1] + (predictions[i].bbox[3] / 2) < 115) {
                    if (!pause) notepad.innerHTML += "UP ";
                    direction = true;
                }
                
                directionTimer = true;
                setTimeout(function() { directionTimer = false; }, 500);
                
                pause = direction; //comment/uncomment for continuous prediction
            }	
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

