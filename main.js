document.addEventListener('DOMContentLoaded', () => {

    // --- Modal Handling ---
    const toolButtons = document.querySelectorAll('.btn[data-tool]');
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-button');

    // Function to open a modal
    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            modal.scrollTop = 0; // Scroll to top of modal when opened
            // Lazy load face model and reset UI
            if (modalId === 'face-modal') {
                if (!isFaceModelLoaded) {
                    initFaceClassifierModel();
                }
                resetFaceClassifierUI();
            }
        }
    };

    // Function to close a modal
    const closeModal = (modal) => {
        if (modal) {
            modal.style.display = 'none';
            // Stop any processes in modals
            if (modal.id === 'face-modal') {
                resetFaceClassifierUI(); // Ensure face classifier is reset
            }
        }
    };

    toolButtons.forEach(button => {
        button.addEventListener('click', () => {
            const toolName = button.getAttribute('data-tool');
            openModal(`${toolName}-modal`);
        });
    });

    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modal when clicking outside the content
    window.addEventListener('click', (event) => {
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });


    // --- Lotto Generator Logic ---
    const lottoNumbersContainer = document.querySelector('#lotto-modal .lotto-numbers');
    const drawButton = document.getElementById('draw-button');

    const drawLottoNumbers = () => {
        lottoNumbersContainer.innerHTML = ''; // Clear previous numbers
        drawButton.disabled = true;
        drawButton.textContent = '추첨 중...';

        const numbers = new Set();
        while (numbers.size < 6) {
            numbers.add(Math.floor(Math.random() * 45) + 1);
        }
        const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

        sortedNumbers.forEach((number, index) => {
            setTimeout(() => {
                const numberElement = document.createElement('div');
                numberElement.classList.add('lotto-number');
                numberElement.textContent = number;
                lottoNumbersContainer.appendChild(numberElement);
                // Trigger animation by adding class after appending
                setTimeout(() => numberElement.classList.add('drawn'), 10); 
            }, index * 300); // 300ms delay for each number
        });

        setTimeout(() => {
            drawButton.disabled = false;
            drawButton.textContent = 'Draw Numbers';
        }, sortedNumbers.length * 300); // Re-enable button after all animations
    };

    if (drawButton) {
        drawButton.addEventListener('click', drawLottoNumbers);
    }


    // --- Face Classifier Logic ---
    const faceModal = document.getElementById('face-modal');
    const imageUploadInput = document.getElementById('image-upload');
    const uploadedImageElement = document.getElementById('uploaded-image');
    const classifyImageButton = document.getElementById('classify-image-button');
    const labelContainer = document.querySelector('#face-modal #label-container');
    const faceLoadingSpinner = document.getElementById('face-loading-spinner');

    const TM_URL = "https://teachablemachine.withgoogle.com/models/bk89dlKo6/";
    let faceModel, maxPredictions;
    let isFaceModelLoaded = false;

    async function initFaceClassifierModel() {
        if (isFaceModelLoaded) return;
        labelContainer.innerHTML = '<div>AI 모델을 로딩 중입니다...</div>';
        faceLoadingSpinner.style.display = 'block'; // Show spinner
        try {
            const modelURL = TM_URL + "model.json";
            const metadataURL = TM_URL + "metadata.json";
            faceModel = await tmImage.load(modelURL, metadataURL);
            maxPredictions = faceModel.getTotalClasses();
            isFaceModelLoaded = true;
            labelContainer.innerHTML = '<div>모델 로딩 완료. 이미지를 업로드하세요.</div>';
        } catch (error) {
            console.error("Failed to load face classifier model:", error);
            labelContainer.innerHTML = '<div>모델 로딩에 실패했습니다.</div>';
        } finally {
            faceLoadingSpinner.style.display = 'none'; // Hide spinner
        }
    }

    imageUploadInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                uploadedImageElement.src = e.target.result;
                uploadedImageElement.style.display = 'block';
                labelContainer.innerHTML = '';
                classifyImageButton.style.display = 'inline-block';
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
        if (!isFaceModelLoaded) {
            labelContainer.innerHTML = '<div>모델이 아직 로딩되지 않았습니다.</div>';
            return;
        }
        if (uploadedImageElement.src && uploadedImageElement.src !== '#') {
            classifyImageButton.disabled = true;
            classifyImageButton.textContent = '분석 중...';
            faceLoadingSpinner.style.display = 'block'; // Show spinner
            labelContainer.innerHTML = ''; // Clear previous results

            try {
                const prediction = await faceModel.predict(uploadedImageElement);
                
                prediction.sort((a, b) => b.probability - a.probability); // Sort by probability

                prediction.forEach((p, index) => {
                    setTimeout(() => {
                        const probability = (p.probability * 100).toFixed(1);
                        const resultDiv = document.createElement('div');
                        resultDiv.style.animationDelay = `${index * 0.1}s`; // Stagger animation
                        resultDiv.innerHTML = `
                            <span>${p.className}:</span>
                            <div class="confidence-bar-container">
                                <div class="confidence-bar" style="width: ${probability}%;"></div>
                            </div>
                            <span>${probability}%</span>
                        `;
                        labelContainer.appendChild(resultDiv);
                    }, index * 150); // Stagger results display
                });

            } catch (error) {
                console.error("Prediction failed:", error);
                labelContainer.innerHTML = '<div>분류 중 오류가 발생했습니다.</div>';
            } finally {
                classifyImageButton.disabled = false;
                classifyImageButton.textContent = '이미지 분류';
                faceLoadingSpinner.style.display = 'none'; // Hide spinner
            }
        } else {
            labelContainer.innerHTML = '<div>분석할 이미지를 먼저 업로드해주세요.</div>';
        }
    });

    function resetFaceClassifierUI() {
        uploadedImageElement.src = '#';
        uploadedImageElement.style.display = 'none';
        imageUploadInput.value = ''; // Clear file input
        labelContainer.innerHTML = '';
        classifyImageButton.style.display = 'none';
        classifyImageButton.disabled = false;
        classifyImageButton.textContent = '이미지 분류';
        faceLoadingSpinner.style.display = 'none';
    }


    // --- Smooth Scrolling ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

});