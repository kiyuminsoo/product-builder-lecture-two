const lottoNumbersContainer = document.querySelector('.lotto-numbers');
const drawButton = document.getElementById('draw-button');
const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

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
drawNumbers();
