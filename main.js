const lottoNumbersContainer = document.querySelector('.lotto-numbers');
const drawButton = document.getElementById('draw-button');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

const formSection = document.getElementById('form-section');
const lottoSection = document.getElementById('lotto-section');
const skipButton = document.getElementById('skip-button');

// New elements for face classifier
const faceClassifierButton = document.getElementById('face-classifier-button');
const faceClassifierSection = document.getElementById('face-classifier-section');
const startClassificationButton = document.getElementById('start-classification-button');
const webcamElement = document.getElementById('webcam'); // Renamed to avoid conflict with TM webcam object
const labelContainer = document.getElementById('label-container');

// Teachable Machine variables
const URL = "https://teachablemachine.withgoogle.com/models/bk89dlKo6/";
let model, tmWebcam, maxPredictions; // Renamed webcam to tmWebcam
let isPredicting = false;

// Function to set the theme
function setTheme(theme) {
    if (theme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '라이트 모드 전환';
    } else {
        body.classList.remove('dark-mode');
        themeToggle.textContent = '다크 모드 전환';
    }
    localStorage.setItem('theme', theme);
}

// Check for saved theme preference or system preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    setTheme(savedTheme);
} else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    // If no saved theme, check system preference
    setTheme('dark');
} else {
    setTheme('light'); // Default to light mode
}

// Event listener for theme toggle button
themeToggle.addEventListener('click', () => {
    if (body.classList.contains('dark-mode')) {
        setTheme('light');
    } else {
        setTheme('dark');
    }
});

// Function to load Disqus comments dynamically
function loadDisqus() {
    if (window.DISQUS) {
        window.DISQUS.reset({
            reload: true,
            config: function () {
                this.page.url = window.location.href;
                this.page.identifier = 'lotto-page-unique-identifier';
            }
        });
    } else {
        // Fallback for initial load if DISQUS object is not ready
        // The script in index.html should handle initial loading if lottoSection is visible
    }
}

skipButton.addEventListener('click', () => {
    formSection.style.display = 'none';
    lottoSection.style.display = 'block';
    faceClassifierSection.style.display = 'none'; // Hide face classifier section
    stopPrediction(); // Stop any ongoing prediction
    loadDisqus();
});

faceClassifierButton.addEventListener('click', () => {
    formSection.style.display = 'none';
    lottoSection.style.display = 'none';
    faceClassifierSection.style.display = 'block'; // Show face classifier section
    // No auto-init for Teachable Machine, user clicks button
});

startClassificationButton.addEventListener('click', () => {
    if (!isPredicting) {
        initTeachableMachine(); // Start the webcam and prediction
    } else {
        stopPrediction(); // Stop the webcam and prediction
    }
});

async function initTeachableMachine() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    const flip = true;
    tmWebcam = new tmImage.Webcam(200, 200, flip);
    await tmWebcam.setup({ facingMode: "user" });
    tmWebcam.canvas.style.display = 'none'; // Hide TM's canvas, use video element

    webcamElement.srcObject = tmWebcam.stream; // Assign TM stream to video element
    
    labelContainer.innerHTML = ''; // Clear previous labels
    for (let i = 0; i < maxPredictions; i++) {
        labelContainer.appendChild(document.createElement("div"));
    }

    startClassificationButton.textContent = "분류 중지";
    isPredicting = true;
    window.requestAnimationFrame(loopTeachableMachine);
}

async function loopTeachableMachine() {
    if (isPredicting) {
        tmWebcam.update();
        await predict();
        window.requestAnimationFrame(loopTeachableMachine);
    }
}

async function predict() {
    const prediction = await model.predict(webcamElement); // Use webcamElement for prediction
    for (let i = 0; i < maxPredictions; i++) {
        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);
        labelContainer.childNodes[i].innerHTML = classPrediction;
    }
}

function stopPrediction() {
    isPredicting = false;
    if (tmWebcam) {
        tmWebcam.stop();
        webcamElement.srcObject = null;
    }
    startClassificationButton.textContent = "분류 시작";
    labelContainer.innerHTML = '';
}


function drawNumbers() {
    lottoNumbersContainer.innerHTML = '';

    // ERL Bridge Model: Define 'Hot Numbers' based on a hypothetical analysis.
    // These numbers will have a higher 'gravitational pull' in our model.
    const hotNumbers = [1, 7, 10, 14, 19, 21, 27, 34, 38, 43, 45];
    const weight = 3; // How much 'heavier' the hot numbers are.

    for (let i = 0; i < 5; i++) {
        const lottoRow = document.createElement('div');
        lottoRow.classList.add('lotto-row');

        // Create a weighted pool of numbers.
        const weightedPool = [];
        for (let j = 1; j <= 45; j++) {
            weightedPool.push(j); // Add every number once.
            if (hotNumbers.includes(j)) {
                for (let k = 0; k < weight - 1; k++) {
                    weightedPool.push(j); // Add the 'hot' numbers extra times.
                }
            }
        }

        const numbers = new Set();
        while (numbers.size < 6) {
            const randomIndex = Math.floor(Math.random() * weightedPool.length);
            const randomNumber = weightedPool[randomIndex];
            numbers.add(randomNumber);
        }

        const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

        sortedNumbers.forEach((number, index) => {
            const numberElement = document.createElement('div');
            numberElement.classList.add('lotto-number');
            numberElement.textContent = number;
            // Apply staggered animation delay
            numberElement.style.animationDelay = `${index * 0.1}s`;
            lottoRow.appendChild(numberElement);
        });
        lottoNumbersContainer.appendChild(lottoRow);
    }
}

drawButton.addEventListener('click', drawNumbers);

// Initial draw
// If lottoSection is not hidden (e.g., direct access), draw numbers
if (lottoSection.style.display !== 'none') {
    drawNumbers();
    loadDisqus(); // Load Disqus if lotto section is visible on initial load
}
