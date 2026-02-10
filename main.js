// The link to your model provided by Teachable Machine export panel
const URL = "https://teachablemachine.withgoogle.com/models/bk89dlKo6/";

let model, webcam, labelContainer, maxPredictions;
let isPredicting = false; // Flag to control prediction loop

const startButton = document.getElementById("start-button");
const webcamContainer = document.getElementById("webcam-container");
const videoElement = document.getElementById("webcam");

// Load the image model and setup the webcam
async function init() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    // Load the model and metadata
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(200, 200, flip); // width, height, flip
    await webcam.setup({ facingMode: "user" }); // Use user-facing camera
    webcam.canvas.style.display = 'none'; // Hide the canvas as we'll use the video element

    // Append webcam video to the DOM
    webcamContainer.appendChild(videoElement);
    videoElement.srcObject = webcam.stream;
    
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) {
        // Create a div for each class prediction
        labelContainer.appendChild(document.createElement("div"));
    }

    startButton.textContent = "Stop Classification";
    isPredicting = true;
    window.requestAnimationFrame(loop);
}

async function loop() {
    if (isPredicting) {
        webcam.update(); // update the webcam frame
        await predict();
        window.requestAnimationFrame(loop);
    }
}

// Run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    // We will use the video element directly for prediction
    const prediction = await model.predict(videoElement);
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

startButton.addEventListener('click', () => {
    if (!isPredicting) {
        init(); // Start the webcam and prediction
    } else {
        stopPrediction(); // Stop the webcam and prediction
    }
});

function stopPrediction() {
    isPredicting = false;
    if (webcam) {
        webcam.stop(); // Stop the webcam stream
        videoElement.srcObject = null; // Clear the video element source
    }
    startButton.textContent = "Start Classification";
    labelContainer.innerHTML = ''; // Clear labels
}

// Initialize on page load (optional, or wait for button click)
// init(); 
// The user will click the button to start, so no auto-init.
