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
const imageUploadInput = document.getElementById('image-upload');
const uploadedImageElement = document.getElementById('uploaded-image');
const classifyImageButton = document.getElementById('classify-image-button');
const labelContainer = document.getElementById('label-container');

// Teachable Machine variables
const URL = "https://teachablemachine.withgoogle.com/models/bk89dlKo6/";
let model, maxPredictions;
let isModelLoaded = false;

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
    }
}

skipButton.addEventListener('click', () => {
    formSection.style.display = 'none';
    lottoSection.style.display = 'block';
    faceClassifierSection.style.display = 'none'; // Hide face classifier section
    loadDisqus();
});

faceClassifierButton.addEventListener('click', async () => {
    formSection.style.display = 'none';
    lottoSection.style.display = 'none';
    faceClassifierSection.style.display = 'block'; // Show face classifier section
    if (!isModelLoaded) {
        await initTeachableMachineModel();
    }
    resetFaceClassifierUI();
});

async function initTeachableMachineModel() {
    const modelURL = URL + "model.json";
    const metadataURL = URL + "metadata.json";

    try {
        model = await tmImage.load(modelURL, metadataURL);
        maxPredictions = model.getTotalClasses();
        isModelLoaded = true;
        // console.log("Teachable Machine model loaded successfully.");
    } catch (error) {
        console.error("Failed to load Teachable Machine model:", error);
        labelContainer.innerHTML = '<div>모델 로딩 실패. 콘솔을 확인하세요.</div>';
    }
}

imageUploadInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            uploadedImageElement.src = e.target.result;
            uploadedImageElement.style.display = 'block';
            labelContainer.innerHTML = ''; // Clear previous predictions
            classifyImageButton.style.display = 'block'; // Show classify button
        };
        reader.readAsDataURL(file);
    } else {
        uploadedImageElement.src = '#';
        uploadedImageElement.style.display = 'none';
        labelContainer.innerHTML = '';
        classifyImageButton.style.display = 'none';
    }
});

classifyImageButton.addEventListener('click', async () => {
    if (!isModelLoaded) {
        labelContainer.innerHTML = '<div>모델이 로딩되지 않았습니다. 잠시 후 다시 시도해주세요.</div>';
        await initTeachableMachineModel(); // Try loading again
        if (!isModelLoaded) return;
    }
    if (uploadedImageElement.src && uploadedImageElement.src !== window.location.href + '#') {
        classifyImageButton.disabled = true;
        classifyImageButton.textContent = '분류 중...';
        await predictImage();
        classifyImageButton.disabled = false;
        classifyImageButton.textContent = '이미지 분류';
    } else {
        labelContainer.innerHTML = '<div>이미지를 먼저 업로드해주세요.</div>';
    }
});

async function predictImage() {
    if (!uploadedImageElement.src || uploadedImageElement.style.display === 'none') {
        labelContainer.innerHTML = '<div>분류할 이미지가 없습니다.</div>';
        return;
    }
    
    // Create a temporary canvas to draw the image to the correct size for prediction
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const imageSize = 224; // Teachable Machine models typically expect 224x224 input

    canvas.width = imageSize;
    canvas.height = imageSize;

    // Draw the image onto the canvas, scaling it
    ctx.drawImage(uploadedImageElement, 0, 0, imageSize, imageSize);

    try {
        const prediction = await model.predict(canvas);
        labelContainer.innerHTML = ''; // Clear previous labels
        for (let i = 0; i < maxPredictions; i++) {
            const classPrediction =
                prediction[i].className + ": " + (prediction[i].probability * 100).toFixed(2) + "%";
            const div = document.createElement('div');
            div.textContent = classPrediction;
            labelContainer.appendChild(div);
        }
    } catch (error) {
        console.error("Prediction failed:", error);
        labelContainer.innerHTML = '<div>분류 중 오류가 발생했습니다.</div>';
    }
}

function resetFaceClassifierUI() {
    uploadedImageElement.src = '#';
    uploadedImageElement.style.display = 'none';
    imageUploadInput.value = ''; // Clear file input
    labelContainer.innerHTML = '';
    classifyImageButton.style.display = 'none';
    classifyImageButton.disabled = false;
    classifyImageButton.textContent = '이미지 분류';
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
