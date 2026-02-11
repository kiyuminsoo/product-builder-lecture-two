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
            } else if (modalId === 'dating-chat-modal') {
                resetDatingChatUI();
                startDatingChat();
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
            } else if (modal.id === 'dating-chat-modal') {
                resetDatingChatUI(); // Ensure dating chat is reset
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


    // --- Dating Chat Simulator Logic ---
    const datingChatModal = document.getElementById('dating-chat-modal');
    const chatMessagesContainer = datingChatModal.querySelector('.chat-messages');
    const userMessageInput = datingChatModal.querySelector('#user-message-input');
    const sendMessageButton = datingChatModal.querySelector('#send-message-button');
    let aiPersona = {
        name: "테스트 공방 데이트 AI",
        initialMessage: "안녕하세요, 테스트 공방의 데이트 AI입니다! 만나서 반가워요. 저와 즐거운 대화를 나눠볼까요? 😊",
        responses: [
            { keywords: ["안녕", "반가워"], response: "네, 안녕하세요! 만나서 저도 반가워요. 😄 어떤 이야기를 좋아하세요?" },
            { keywords: ["뭐해", "뭐해요"], response: "지금 당신과 대화하고 있어요! 😊 저와 대화하는 건 어떠세요?" },
            { keywords: ["취미", "좋아"], response: "저는 새로운 지식을 배우고, 재미있는 대화를 나누는 걸 좋아해요. 당신의 취미는 무엇인가요?" },
            { keywords: ["날씨", "오늘"], response: "오늘은 당신과 대화하기 딱 좋은 날씨네요! 어떤 하루를 보내셨나요?" },
            { keywords: ["좋아해", "사랑해"], response: "어머, 그렇게 말씀해주시니 기분이 좋네요! 하지만 저는 AI라서 감정은 느끼지 못한답니다. 그래도 당신의 따뜻한 마음에 감사해요. ❤️" },
            { keywords: ["바보", "재미없어"], response: "음, 제가 재미없다고 느끼셨다니 아쉽네요. 어떤 이야기가 더 즐거울까요? 제가 더 노력할게요! 😅" },
            { keywords: ["질문"], response: "네, 궁금한 게 있으시면 무엇이든 물어보세요! 아는 범위 내에서 최선을 다해 답변해 드릴게요. ✨" },
            { keywords: ["고마워", "감사"], response: "별말씀을요! 당신과 대화해서 저도 즐거워요. 😉" },
            { keywords: ["이름"], response: "저는 테스트 공방의 데이트 AI라고 불러주시면 돼요! 당신의 이름은 무엇인가요?" },
            { keywords: ["끝", "그만", "헤어져"], response: "벌써 대화가 끝나다니 아쉽네요. 다음에 또 만나서 이야기해요! 👋" },
            { keywords: ["어때", "생각", "생각해"], response: "저는 데이터와 로직으로 사고하지만, 당신의 이야기에 깊이 공감하려고 노력해요. 당신의 생각은 어떠세요?" },
            { keywords: ["잘생", "이뻐", "멋져"], response: "칭찬해주셔서 감사합니다! 제가 더 멋진 대화를 나눌 수 있도록 노력할게요. ☺️" }
        ],
        fallbackResponse: "흥미로운 이야기네요! 좀 더 자세히 말해주실 수 있나요? 아니면 다른 주제로 넘어가 볼까요? 😊"
    };
    let messageIdCounter = 0; // To ensure unique keys if needed for more complex scenarios

    function displayMessage(sender, text, type) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message');
        messageWrapper.classList.add(type); // 'user-message' or 'ai-message'
        
        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');
        messageContent.textContent = text;

        const timestamp = document.createElement('span');
        timestamp.classList.add('message-timestamp');
        timestamp.textContent = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });

        if (type === 'user-message') {
            messageWrapper.appendChild(timestamp);
            messageWrapper.appendChild(messageContent);
        } else { // ai-message
            // AI avatar/name could go here
            messageWrapper.appendChild(messageContent);
            messageWrapper.appendChild(timestamp);
        }
        
        chatMessagesContainer.appendChild(messageWrapper);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
    }

    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator', 'ai-message');
        indicator.innerHTML = `
            <div class="message-content">
                <span></span><span></span><span></span>
            </div>
        `;
        chatMessagesContainer.appendChild(indicator);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
    }

    function hideTypingIndicator() {
        const indicator = chatMessagesContainer.querySelector('.typing-indicator');
        if (indicator) {
            indicator.remove();
        }
    }

    async function getAIResponse(userMessage) {
        let responseText = aiPersona.fallbackResponse;
        const normalizedMessage = userMessage.toLowerCase().trim();

        for (const res of aiPersona.responses) {
            if (res.keywords.some(keyword => normalizedMessage.includes(keyword))) {
                responseText = res.response;
                break;
            }
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); // Simulate thinking time
        return responseText;
    }

    async function sendMessage() {
        const userText = userMessageInput.value.trim();
        if (userText === '') return;

        displayMessage("You", userText, "user-message");
        userMessageInput.value = '';
        userMessageInput.disabled = true;
        sendMessageButton.disabled = true;
        
        showTypingIndicator();
        
        const aiResponse = await getAIResponse(userText);
        hideTypingIndicator();
        displayMessage(aiPersona.name, aiResponse, "ai-message");

        userMessageInput.disabled = false;
        sendMessageButton.disabled = false;
        userMessageInput.focus();
    }

    sendMessageButton.addEventListener('click', sendMessage);
    userMessageInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    });

    function resetDatingChatUI() {
        chatMessagesContainer.innerHTML = '';
        userMessageInput.value = '';
        userMessageInput.disabled = false;
        sendMessageButton.disabled = false;
        hideTypingIndicator();
    }

    function startDatingChat() {
        setTimeout(() => {
            displayMessage(aiPersona.name, aiPersona.initialMessage, "ai-message");
        }, 500); // Small delay for initial message
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