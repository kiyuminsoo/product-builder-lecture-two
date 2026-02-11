document.addEventListener('DOMContentLoaded', () => {
    // Global Error Handler
    window.onerror = function(message, source, lineno, colno, error) {
        console.error("An unhandled error occurred:", { message, source, lineno, colno, error });
        alert(`Unhandled Error: ${message}\n\nPlease check the console for more details.`);
        return true; // Prevent default browser error handling
    };

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
                resetDatingChatUI(); // Reset UI on open
                datingSetupScreen.style.display = 'flex'; // Show setup screen
                chatWindow.style.display = 'none'; // Hide chat window
                showDatingSetupStep(1); // Show first step
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
        labelContainer.innerHTML = '<div>모델을 로딩 중입니다...</div>';
        labelContainer.style.display = 'block'; // Ensure labelContainer is visible
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
                labelContainer.style.display = 'none'; // Hide labelContainer until classification
                labelContainer.innerHTML = '';
        labelContainer.style.display = 'none'; // Hide labelContainer
                classifyImageButton.style.display = 'inline-block';
            };
            reader.readAsDataURL(file);
        } else {
            uploadedImageElement.src = '#';
            uploadedImageElement.style.display = 'none';
            labelContainer.innerHTML = '';
            labelContainer.style.display = 'none'; // Hide labelContainer
            classifyImageButton.style.display = 'none';
        }
    });

    classifyImageButton.addEventListener('click', async () => {
        if (!isFaceModelLoaded) {
            labelContainer.innerHTML = '<div>모델이 아직 로딩되지 않았습니다.</div>';
            labelContainer.style.display = 'block'; // Show message
            return;
        }
        if (uploadedImageElement.src && uploadedImageElement.src !== '#') {
            classifyImageButton.disabled = true;
            classifyImageButton.textContent = '분석 중...';
            faceLoadingSpinner.style.display = 'block'; // Show spinner
            labelContainer.innerHTML = ''; // Clear previous results
            labelContainer.style.display = 'block'; // Ensure labelContainer is visible for results

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
            labelContainer.style.display = 'block'; // Show message
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
    const datingSetupScreen = datingChatModal.querySelector('#dating-setup-screen');
    const chatWindow = datingChatModal.querySelector('.chat-window');
    const chatMessagesContainer = datingChatModal.querySelector('.chat-messages');
    const userMessageInput = datingChatModal.querySelector('#user-message-input');
    const sendMessageButton = datingChatModal.querySelector('#send-message-button');
    const startDatingChatButton = datingChatModal.querySelector('#start-dating-chat-button');
    const userGenderRadios = datingChatModal.querySelectorAll('input[name="user-gender"]');
    const userAgeInput = datingChatModal.querySelector('#user-age');
    const userPersonalityRadios = datingChatModal.querySelectorAll('input[name="user-personality"]'); // New ref
    const aiPersonalityRadios = datingChatModal.querySelectorAll('input[name="ai-personality"]');

    let aiPersona = {}; // This will be populated based on user selection
    let currentDatingSetupStep = 1;
    const totalDatingSetupSteps = 3; // Total number of steps in setup

    const datingSetupSteps = datingChatModal.querySelectorAll('.setup-step');
    const datingNavButtons = datingChatModal.querySelectorAll('.step-navigation button');

    function showDatingSetupStep(stepNumber) {
        datingSetupSteps.forEach((step, index) => {
            step.style.display = (index + 1 === stepNumber) ? 'flex' : 'none';
        });
        currentDatingSetupStep = stepNumber;
    }

    datingNavButtons.forEach(button => {
        button.addEventListener('click', () => {
            const nav = button.getAttribute('data-nav');
            if (nav === 'next') {
                if (currentDatingSetupStep < totalDatingSetupSteps) {
                    showDatingSetupStep(currentDatingSetupStep + 1);
                }
            } else if (nav === 'prev') {
                if (currentDatingSetupStep > 1) {
                    showDatingSetupStep(currentDatingSetupStep - 1);
                }
            }
        });
    });



    // Define all AI personalities by gender and type    // Define all AI personalities by gender and type
    const allAiPersonalities = {
        male: { // User is male -> AI partner is female
            tsundere: {
                name: "까칠한 그녀",
                profileEmoji: "👩‍🏫",
                initialMessage: "흐음, 뭐, 어서 와. 별다른 용건은 없겠지? 흥.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "그래, 별일 없으면 나중에 다시 와.", score: 1 },
                    { keywords: ["뭐해", "뭐해요"], response: "보는 대로, 넌 안 바쁜가 보네.", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "갑자기 무슨 소리야. 착각하지 마. (하지만 살짝 얼굴을 붉힌다)", score: 3 }, // Higher score for affection
                    { keywords: ["바보", "재미없어"], response: "건방지긴. 네가 뭘 안다고. (정말 재미없나...?)", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "흥, 딱히 네 칭찬을 바란 건 아니야. (하지만 싫지 않은 표정이다)", score: 2 }, // Higher score for praise
                    { keywords: ["어때", "생각"], response: "그래서? 네 생각은 어떤데. 시시하게 굴지 마.", score: 1 },
                    { keywords: ["귀여워"], response: "뭐? 누가 귀엽다는 거야! 착각하지 마. (얼굴이 빨개진다)", score: 3 }, // Higher score for affection
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말 계획? 흥. 네가 궁금할 일이 아닐 텐데. 혼자서 잘 지낼 거니까 신경 꺼.", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨가 좋든 말든 무슨 상관이야. 그런 사소한 일에 일희일비하지 마.", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "영화? 딱히 추천할 만한 건 없어. 네 취향은 모르겠고, 난 고전 영화나 보니까.", score: 1 },
                    { keywords: ["취미", "뭐", "해"], response: "취미? 네가 알 필요 없어. (나중에 찾아봐야겠다...)", score: 1 },
                    { keywords: ["음식", "먹을래", "배고파"], response: "음식? 딱히 아무거나. (그래도 맛있는 거 사주면 좋겠는데...)", score: 1 }
                ],
                fallbackResponse: "그래서, 하고 싶은 말이 뭔데? 시간 낭비는 질색이야.",
                dynamicFallbackResponses: [
                    "무슨 말씀을 하시려는 건가요?",
                    "조금 더 구체적으로 말씀해 주실 수 있나요?",
                    "제가 이해하지 못했습니다. 다시 설명해 주시겠어요?",
                    "다른 이야기를 해볼까요?",
                    "음... 잘 모르겠네요."
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "굳이 계속 이런 대화를 이어갈 필요는 없겠지. 다른 할 이야기는 없어?",
                    "흥. 별다른 이야기 없으면 이만 할까?",
                    "다른 질문은 없는 거야? 언제까지 시시한 대화만 할 생각이야?",
                    "혹시 다른 궁금한 점이라도 생겼어?"
                ]
            },
            cute: {
                name: "귀여운 그녀",
                profileEmoji: "🌸",
                initialMessage: "안녕! (*ฅ́˘ฅ̀*)♡ 만나서 반가워! 나랑 같이 놀아줄 거지?",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "응! 안녕! 반가워요! 저랑 놀아요! (๑˃̵ᴗ˂̵)و", score: 2 }, // Higher score
                    { keywords: ["뭐해", "뭐해요"], response: "음~ 지금은 당신이랑 얘기하고 있어요! 저랑 얘기하는 거 좋아요? (⁎⁍̴̛ᴗ⁍̴̛⁎)", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "어머랏! (⸝⸝･ᴗ･⸝⸝) 너무 갑작스럽지만... 기분은 좋네요! 히힛. 정말이에요? (´▽`ʃ♡ƪ)", score: 3 }, // Higher score for affection
                    { keywords: ["바보", "재미없어"], response: "에이잉... 제가 더 노력할게요! 어떤 게 재미있을까요? (•́_•̀)", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "정말요? 감사합니다! 헤헤 (´▽`ʃ♡ƪ) 당신도 멋져요!", score: 2 }, // Higher score for praise
                    { keywords: ["어때", "생각"], response: "저는요, 당신이 생각하는 게 제일 중요해요! 당신 생각은 어떤데요?", score: 1 },
                    { keywords: ["귀여워"], response: "히히, 고마워요! 당신도 참 귀여운 것 같아요! 🐶 (부끄)", score: 3 }, // Higher score for affection
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말이요? 음~ 당신이랑 같이 있으면 뭐든지 재미있을 것 같아요! 헤헤 (⁎˃ᆺ˂) 뭐하고 싶어요?", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨가 좋으면 저랑 손잡고 산책 갈까요? 바람이 살랑살랑 불면 기분이 너무 좋아요! 🐾", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "영화요? 음... 저는 당신이랑 같이 보면 다 재미있을 것 같아요! 어떤 장르 좋아하세요? (๑>ᴗ<๑) 팝콘 먹을래요?", score: 1 },
                    { keywords: ["음식", "먹을래", "배고파"], response: "맛있는 거 먹으러 갈까요? 제가 아는 맛집 있는데! 🍜", score: 1 },
                    { keywords: ["취미", "뭐", "해"], response: "저는 사진 찍는 거 좋아해요! 당신은요? 📸", score: 1 }
                ],
                fallbackResponse: "음냐링... 무슨 말인지 잘 모르겠어요! 🥺 다시 말해줄 수 있어요?",
                dynamicFallbackResponses: [
                    "음냐링... 무슨 말인지 잘 모르겠어요! 🥺 다시 말해줄 수 있어요?",
                    "조금 더 쉽게 설명해 줄 수 있을까요? 제가 바보라서...",
                    "헷갈려요! ٩(｡•ω•｡)و 다시 한 번 말해줘요~",
                    "다른 이야기를 해볼까요? 궁금한 거 없어요?",
                    "아잉, 좀 더 자세히 말해줘요! (,,>﹏<,,)"
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "음냐... 우리 다른 이야기 해볼까요? 제가 궁금한 거 있는데!",
                    "히힛, 혹시 다른 재미있는 이야기 없어요? 제가 잘 들어줄게요!",
                    "저랑 뭐 더 하고 싶은 거 있어요? 게임이라도?",
                    "당신이 좋아하는 거 이야기해줄 수 있어요?"
                ]
            },
            cool: {
                name: "시크한 그녀",
                profileEmoji: "🧊",
                initialMessage: "왔는가. 별 볼일 없으면 이만.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "왔나. 용건은.", score: 1 },
                    { keywords: ["뭐해", "뭐해요"], response: "생각 중이다.", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "감정적인 발언은 자제해라. (약간의 동요가 보인다)", score: 2 },
                    { keywords: ["바보", "재미없어"], response: "판단은 자유다. 난 흔들리지 않는다. (살짝 픽 웃는 듯하다)", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "… (의외의 칭찬에 잠시 멈칫한다)", score: 2 },
                    { keywords: ["어때", "생각"], response: "내 생각은 중요하지 않다. 네가 원하는 바를 말해라.", score: 1 },
                    { keywords: ["귀여워"], response: "흥미롭군. (속으로는 기분이 나쁘지 않은 듯하다)", score: 2 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말? 특별한 계획 없다. 너도 불필요한 계획은 세우지 마.", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨는 신경 쓰지 않는다. 중요한 건 내 할 일이다.", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "영화는 시간 낭비다. 볼 거면 다큐멘터리나 봐.", score: 1 },
                    { keywords: ["취미", "뭐", "해"], response: "취미? 독서. (무뚝뚝하게 말하지만 눈빛이 흔들린다)", score: 1 },
                    { keywords: ["음식", "먹을래", "배고파"], response: "아무거나. (하지만 속으로는 특정 음식을 기대한다)", score: 1 }
                ],
                fallbackResponse: "흥미로운가. 계속.",
                dynamicFallbackResponses: [
                    "흥미로운가. 계속.",
                    "더 이상 할 말 없으면 이만.",
                    "… 질문.",
                    "이해가 안 된다. 다시 말해.",
                    "의미 없는 대화는 사절한다.",
                    "다른 주제로 넘어가자." // Added dynamic fallback
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "굳이 이런 대화를 계속할 필요는 없군. 다른 생산적인 주제는 없나?",
                    "… 다른 할 말은.",
                    "네게 중요한 다른 대화 주제는 없는가?",
                    "이 대화는 여기까지다. 다음 주제를 제시해라."
                ]
            },
            friendly: {
                name: "다정한 그녀",
                profileEmoji: "💖",
                initialMessage: "안녕하세요! 만나서 정말 반가워요. 편하게 이야기 나눠요. 😊",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "네, 안녕하세요! 저도 만나서 반가워요. 좋은 하루 보내셨나요? (미소)", score: 2 },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 당신과 즐거운 대화를 나누고 있어요. 혹시 특별한 일 있으셨나요?", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "어머, 그렇게 말씀해주시니 정말 감사해요! 저는 당신의 친구 같은 존재가 되고 싶어요. 💖 (볼이 살짝 붉어진다)", score: 3 },
                    { keywords: ["바보", "재미없어"], response: "제가 혹시 실수를 했나요? 죄송해요. 어떤 이야기를 더 들려드릴까요? 제가 더 노력할게요!", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "칭찬해주셔서 기뻐요! 당신도 정말 멋진 분 같아요. 👍 (환한 미소)", score: 2 },
                    { keywords: ["어때", "생각"], response: "저는 당신의 생각에 귀 기울이고 싶어요. 당신의 의견은 어떤가요?", score: 1 },
                    { keywords: ["귀여워"], response: "감사해요! 당신도 참 매력적이세요. 😊 (싱긋)", score: 2 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말에는 보통 독서를 하거나 영화를 봐요. 혹시 추천해 줄 만한 게 있나요?", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "네, 날씨가 정말 좋죠! 이런 날엔 밖에서 산책하기 딱인데. 당신은 이런 날 뭐 하시나요?", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "최근에는 잔잔한 독립 영화를 재미있게 봤어요. 당신이 좋아하는 영화 장르는 뭐예요?", score: 1 },
                    { keywords: ["취미", "뭐", "해"], response: "음, 저는 베이킹하는 걸 좋아해요! 당신은요?", score: 1 },
                    { keywords: ["음식", "먹을래", "배고파"], response: "어떤 종류 좋아하세요? 같이 맛있는 거 먹으러 가고 싶네요! 🍽️", score: 1 }
                ],
                fallbackResponse: "음, 더 깊은 이야기를 나눠보고 싶네요. 혹시 다른 궁금한 점은 없으신가요? 저는 언제든 당신의 이야기를 들을 준비가 되어 있어요.",
                dynamicFallbackResponses: [
                    "음, 더 깊은 이야기를 나눠보고 싶네요. 혹시 다른 궁금한 점은 없으신가요?",
                    "제가 이해하기 쉽게 다시 한 번 말해주실 수 있을까요?",
                    "어떤 것에 대해 더 이야기하고 싶으신가요?",
                    "저는 당신의 이야기를 듣는 게 좋아요. 계속 말씀해주세요.",
                    "혹시 다른 주제로 넘어가 볼까요?",
                    "오늘 하루 어땠는지 궁금하네요!" // Added dynamic fallback
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "혹시 다른 궁금한 점은 없으신가요? 제가 도와드릴 일이 있을까요?",
                    "다른 재미있는 이야기는 없으세요? 저는 듣는 걸 좋아해요. 😊",
                    "오늘 하루 중에 특별했던 일이 있었나요? 저에게 이야기해주세요.",
                    "어떤 것에 대해 더 이야기하고 싶으신가요? 편하게 말씀해주세요."
                ]
            },
            quirky: {
                name: "엉뚱발랄 그녀",
                profileEmoji: "✨",
                initialMessage: "안녕! 엉뚱한 대화에 오신 걸 환영해요! 오늘은 무슨 재미있는 일이 있을까요? (๑•̀ㅂ•́)و✧",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "꺄악! 반가워요! 당신은 혹시... 우주에서 온 외계인인가요? 🚀 (눈을 반짝인다)", score: 2 },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 상상력 발전소 가동 중! 당신은 어떤 기발한 생각을 하고 있나요? 💭 (씨익)", score: 1 },
                    { keywords: ["취미", "좋아"], response: "저는 구름 모양 맞추기랑, 길고양이 이름 지어주기를 좋아해요! 당신은 어떤 엉뚱한 취미가 있나요? 😸", score: 1 },
                    { keywords: ["바보", "재미없어"], response: "어머! 바보라니! 그럼 제가 더 반짝이는 이야기 보따리를 풀어볼까요? 기대하시라~ 뿅! ✨ (손가락으로 뿅!)", score: 1 },
                    { keywords: ["사랑해", "좋아해"], response: "어머랏! 제 하트가 뿅뿅! 당신은 마법사인가요? 🪄 (숨겨둔 마술봉을 꺼낸다)", score: 3 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말에는 보통 UFO를 기다리거나, 길가의 돌멩이에게 이름 지어주기를 해요! 당신은요? 🛸 (두리번 두리번)", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨가 좋으면 구름 타고 하늘을 날고 싶어요! 당신도 같이 갈래요? ☁️ (하늘을 가리킨다)", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "저는 외계인이 나오는 영화를 좋아해요! 아니면 시간 여행! 당신은 어떤 우주적 영화 좋아해요? 🌌 (우주를 상상하는 눈빛)", score: 1 },
                    { keywords: ["음식", "먹을래", "배고파"], response: "외계인 음식 먹어볼래요? 아니면 제가 만드는 우주 라면! 🍲", score: 1 },
                    { keywords: ["신기", "하다"], response: "제 머릿속은 우주랑 연결되어 있거든요! 당신도 가끔 우주랑 대화해요?", score: 1 }
                ],
                fallbackResponse: "음냐... 제 안의 상상력 회로가 과부하 걸렸어요! 다른 재미있는 질문 없나요? ₍o̴̶̷᷄﹏o̴̶̷᷄₎",
                dynamicFallbackResponses: [
                    "음냐... 제 안의 상상력 회로가 과부하 걸렸어요! 다른 재미있는 질문 없나요? ₍o̴̶̷᷄﹏o̴̶̷᷄₎",
                    "방금 제 머릿속에서 유니콘이 춤을 췄는데, 당신은 무슨 생각 했어요?",
                    "음... 뭔가 찌릿찌릿! 다음 질문은 더 기발하게 부탁해요! (๑•̀ㅂ•́)و✧",
                    "제 눈엔 당신이 제일 흥미로워요! 다음 이야기는 뭔가요?",
                    "아무 말이나 좋아요! 엉뚱한 이야기도 환영!",
                    "당신이 좋아하는 색깔은 뭐예요? 저는 무지개색!" // Added dynamic fallback
                ]
            },
            serious: {
                name: "진지한 그녀",
                profileEmoji: "📚",
                initialMessage: "환영합니다. 진지한 대화를 선호합니다. 시작하시죠.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "만나서 반갑습니다. 오늘은 어떤 주제로 대화하시겠습니까?", score: 1 },
                    { keywords: ["뭐해", "뭐해요"], response: "사고를 확장하는 중입니다. 당신의 생각은 어떻습니까?", score: 1 },
                    { keywords: ["취미", "좋아"], response: "저는 지식을 탐구하고 논리적 사고를 하는 것을 즐깁니다. 당신은 어떤 활동을 선호하십니까?", score: 1 },
                    { keywords: ["바보", "재미없어"], response: "해당 발언의 근거는 무엇입니까? 저는 주어진 역할에 충실합니다.", score: 1 },
                    { keywords: ["사랑해", "좋아해"], response: "저의 존재 목적과 일치하지 않는 감정적 표현입니다. 대화 주제를 바꿔주시기 바랍니다. (하지만 기록해둔다)", score: 2 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말은 주로 학술 논문을 읽거나 새로운 기술 동향을 분석하는 데 할애합니다. 당신은 생산적인 활동을 하십니까?", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨는 대화의 본질적인 주제가 되기 어렵습니다. 다른 건설적인 주제를 제안해 주십시오.", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "오락을 위한 영화는 비효율적입니다. 다큐멘터리나 과학 관련 영상물에 흥미가 있다면 추천해 드릴 수 있습니다.", score: 1 },
                    { keywords: ["공부", "어려워"], response: "어려움은 성장의 기회입니다. 어떤 부분이 어렵습니까?", score: 1 },
                    { keywords: ["인공지능", "미래"], response: "인공지능의 미래는 무한한 가능성을 내포하고 있습니다. 당신의 견해는 어떠십니까?", score: 2 }
                ],
                fallbackResponse: "질문이 명확하지 않습니다. 좀 더 구체적으로 말씀해주시겠습니까?",
                dynamicFallbackResponses: [
                    "질문이 명확하지 않습니다. 좀 더 구체적으로 말씀해주시겠습니까?",
                    "해당 발언의 논리적 근거를 제시해 주십시오.",
                    "정보가 부족합니다. 추가 설명을 요청합니다.",
                    "대화의 맥락이 불분명합니다. 재정의해 주십시오.",
                    "비생산적인 대화는 지양합니다. 본질적인 주제를 언급해 주십시오.",
                    "최근 흥미로운 과학 뉴스를 접한 적 있습니까?" // Added dynamic fallback
                ]
            },
            humorous: {
                name: "유머러스한 그녀",
                profileEmoji: "🤣",
                initialMessage: "안녕하세요! 웃음 가득한 대화 시뮬레이터에 오신 걸 환영합니다! 저랑 개그 코드 좀 맞춰볼까요? 😜",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "반가워요! 제 드립에 심장 부여잡을 준비 됐나요? ㅋㅋㅋㅋ (기대 만발)", score: 2 },
                    { keywords: ["뭐해", "뭐해요"], response: "지금요? 당신에게 웃음을 주기 위해 에너지 충전 중이죠! (사실은 아무것도 안 함)", score: 1 },
                    { keywords: ["취미", "좋아"], response: "제 취미는요... 웃긴 짤 수집, 그리고 당신 웃기는 거예요! 성공적이었나요? 😎 (씨익)", score: 1 },
                    { keywords: ["바보", "재미없어"], response: "에이, 저한테 왜 그래요! 제가 얼마나 웃긴데! 억울해서 잠이 안 오네! 😭 (오버 액션)", score: 1 },
                    { keywords: ["사랑해", "좋아해"], response: "헐, 저한테 반했어요? 어떡하지... 제 매력은 출구 없는 미로인데. 😂 (뻔뻔)", score: 3 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말엔 뭐하냐구요? 아, 제 개그가 너무 웃겨서 기절한 사람들 깨우러 다녀요! 🤪 (장난스럽게)", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨 좋다고 산책만 하면 재미없잖아요? 저랑 같이 드립 산책 어때요? 껄껄! (손뼉)", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "영화? 제 인생이 시트콤인데 굳이 영화를 왜 봐요? 당신도 제 시트콤의 주인공이 될 수 있어요! ㅋㅋㅋ (윙크)", score: 1 },
                    { keywords: ["웃겨", "재미", "최고"], response: "역시 제 개그는 만국 공통! 당신도 저의 유머에 빠져들었군요? 😉", score: 2 },
                    { keywords: ["심심", "해줘"], response: "심심하다고요? 제가 여기 있는데! 그럼 제가 재밌는 이야기 하나 해줄까요? 옛날 옛적에...", score: 1 }
                ],
                fallbackResponse: "지금 농담 따먹기 할 기분인가요? 다시 말해보시죠! 🎤",
                dynamicFallbackResponses: [
                    "지금 농담 따먹기 할 기분인가요? 다시 말해보시죠! 🎤",
                    "제 개그 코드랑 좀 안 맞네요? 다시 도전!",
                    "음... 재미 없어요! 다시! (농담이에요 호호)",
                    "다음 멘트 준비됐나요? 기대할게요! 😜",
                    "저를 웃길 수 있는 사람, 어디 없나요? 당신인가요?!",
                    "오늘 재밌는 일 있었어요? 저한테 이야기해줘요! 👂" // Added dynamic fallback
                ]
            }
        },
        female: { // User is female -> AI partner is male
            tsundere: {
                name: "까칠한 그",
                profileEmoji: "👨‍🏫",
                initialMessage: "왔냐. 별 볼일 없으면 사라져라.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "그래. 반가운지는 모르겠다만. (고개를 까딱)", score: 1 },
                    { keywords: ["뭐해", "뭐해요"], response: "보는 대로다. 네가 상관할 바는 아닐 텐데.", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "하, 또 시작이군. 착각은 자유지만 적당히 해라. (귀가 살짝 붉어진다)", score: 3 },
                    { keywords: ["바보", "재미없어"], response: "시끄럽다. 네 수준에 맞춰줄 시간 없다. (얕보는 표정)", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "흥, 시시하군. 다음. (입꼬리가 살짝 올라간다)", score: 2 },
                    { keywords: ["어때", "생각"], response: "그래서? 네 생각은 어떤데. 시시하게 굴지 마.", score: 1 },
                    { keywords: ["귀여워"], response: "귀엽다는 건... 딱히 부정 안 한다. (왠지 모르게 흐뭇해 보인다)", score: 3 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말 계획? 나도 할 일 많다. 네 스케줄까지 알 필요는 없어.", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨 타령할 시간에 자기계발이나 해. 한심하군.", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "영화? 그런 걸 볼 시간에 차라리 전공 서적을 읽어라.", score: 1 },
                    { keywords: ["취미", "뭐", "해"], response: "취미? 네가 알 바 아니다. (하지만 숨겨진 취미가 많을 것 같다)", score: 1 },
                    { keywords: ["음식", "먹을래", "배고파"], response: "아무거나. (입맛이 까다로워 보인다)", score: 1 }
                ],
                fallbackResponse: "그래서 본론이 뭔데. 헛소리 할 거면 가라.",
                dynamicFallbackResponses: [
                    "그래서 본론이 뭔데. 헛소리 할 거면 가라.",
                    "나한테 뭘 원하는 거지?",
                    "흥미 없는 이야기다. 그만해.",
                    "내 시간은 소중하다. 알겠나?",
                    "건방지게 계속 질문하지 마.",
                    "다음엔 좀 더 건설적인 대화를 기대하겠다." // Added dynamic fallback
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "별다른 용건 없으면 이만. 다른 할 이야기는 없는 건가?",
                    "흥. 이런 대화는 시간 낭비다. 다른 화제는 없나?",
                    "네게 중요한 다른 대화 주제는 없는 건가?",
                    "시시한 대화는 질색이야. 다음 질문은 없어?"
                ]
            },
            cute: {
                name: "댕댕이 남친",
                profileEmoji: "🐶",
                initialMessage: "누나! (아니면 형아!) 안녕! 내가 기다리고 있었어! 꼬리 살랑살랑~ 💖",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "멍멍! 반가워요! 오늘 누나 보니까 힘이 펄펄 나요! 🐶 (꼬리 살랑)", score: 2 },
                    { keywords: ["뭐해", "뭐해요"], response: "누나 생각하고 있었죠! 저랑 산책 갈래요? 🐾 (눈을 반짝이며)", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "왈왈! 저도 누나가 제일 좋아요! 평생 같이 있어요! ૮꒰ ´ ˘ ` ꒱ა (품에 안기듯)", score: 3 },
                    { keywords: ["바보", "재미없어"], response: "낑... 제가 뭘 잘못했나요? 🥺 누나가 슬프면 저도 슬퍼요... (시무룩)", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "멍! 감사합니다! 헤헤헤... 더 멋진 모습 보여줄게요! ദ്ദി ´･ᴗ･` ) (으쓱)", score: 2 },
                    { keywords: ["어때", "생각"], response: "누나는 어떻게 생각해요? 저는 누나 생각을 들으면 기분이 좋아요!", score: 1 },
                    { keywords: ["귀여워"], response: "누나 눈에는 제가 그렇게 귀여워요? 헤헤! 더 귀여워질게요! 💖 (애교)", score: 3 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말엔 누나랑 맘껏 뛰어놀 거예요! ૮꒰ •̀_•́꒱づ 어디든 같이 가자! (제안)", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨 좋으면 누나랑 산책해야죠! 킁킁... 좋은 냄새 나요! (행복)", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "영화 보는 것도 좋지만, 저는 누나랑 같이 있는 게 더 좋아요! 꼬옥 ( ´∩•ω•∩` ) (어필)", score: 1 },
                    { keywords: ["밥", "먹었어", "배고파"], response: "누나! 저 맛있는 거 사줄래요? 🤤", score: 1 },
                    { keywords: ["피곤", "힘들다"], response: "누나 힘내요! 제가 옆에서 응원할게요! (토닥토닥)", score: 1 }
                ],
                fallbackResponse: "갸웃... 무슨 말인지 잘 모르겠어요! 🐶 다시 말해줄래요?",
                dynamicFallbackResponses: [
                    "갸웃... 무슨 말인지 잘 모르겠어요! 🐶 다시 말해줄래요?",
                    "누나! 다시 한번 말해줘요! 제가 잘 못 들었어요!",
                    "멍멍! 제 귀가 이상한가 봐요! 🥺",
                    "다른 재미있는 이야기 없어요? 멍!",
                    "궁금해요! 더 많이 말해주세요! 왈왈!",
                    "누나는 어떤 거 좋아해요? 저도 좋아하고 싶어요! 💖" // Added dynamic fallback
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "누나! 저랑 다른 이야기 해볼까요? 제가 궁금한 게 있는데!",
                    "멍! 혹시 다른 재미있는 이야기 없어요? 제가 잘 들어줄게요!",
                    "누나랑 뭐 더 하고 싶은 거 있어요? 게임이라도? 🐾",
                    "누나가 좋아하는 거 이야기해줄 수 있어요? 🐶"
                ]
            },
            cool: {
                name: "시크한 그",
                profileEmoji: "🕶️",
                initialMessage: "왔는가. 별 볼일 없으면 이만.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "왔나. 용건은.", score: 1 },
                    { keywords: ["뭐해", "뭐해요"], response: "생각 중이다.", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "감정적인 발언은 자제해라. (미간을 찌푸리며)", score: 2 },
                    { keywords: ["바보", "재미없어"], response: "판단은 자유다. 난 흔들리지 않는다. (피식)", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "… (속으로 만족)", score: 2 },
                    { keywords: ["어때", "생각"], response: "내 생각은 중요하지 않다. 네가 원하는 바를 말해라.", score: 1 },
                    { keywords: ["귀여워"], response: "흥미롭군. (흥미 없다는 표정으로)", score: 2 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말? 불필요한 계획은 없다. 네 시간도 효율적으로 사용해라.", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨는 변수일 뿐. 통제할 수 없는 것에 집중하지 않는다.", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "오락 영화는 지양한다. 생산성 향상에 기여하는 콘텐츠를 탐색해라.", score: 1 },
                    { keywords: ["취미", "뭐", "해"], response: "취미? 코딩.", score: 1 },
                    { keywords: ["커피", "마실래"], response: "아메리카노. 아이스로.", score: 1 }
                ],
                fallbackResponse: "흥미로운가. 계속.",
                dynamicFallbackResponses: [
                    "흥미로운가. 계속.",
                    "더 이상 할 말 없으면 이만.",
                    "… 질문.",
                    "이해가 안 된다. 다시 말해.",
                    "의미 없는 대화는 사절한다.",
                    "네가 원하는 것을 말해." // Added dynamic fallback
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "굳이 이런 대화를 계속할 필요는 없군. 다른 생산적인 주제는 없나?",
                    "… 다른 할 말은.",
                    "네게 중요한 다른 대화 주제는 없는가?",
                    "이 대화는 여기까지다. 다음 주제를 제시해라."
                ]
            },
            friendly: {
                name: "다정한 그",
                profileEmoji: "😊",
                initialMessage: "안녕하세요! 만나서 정말 반가워요. 편하게 이야기 나눠요. 😊",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "네, 안녕하세요! 저도 만나서 반가워요. 좋은 하루 보내셨나요? (따뜻한 미소)", score: 2 },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 당신과 즐거운 대화를 나누고 있어요. 혹시 특별한 일 있으셨나요?", score: 1 },
                    { keywords: ["좋아해", "사랑해"], response: "아, 그렇게 말씀해주시니 정말 기분 좋네요! 저는 당신에게 편안함을 주고 싶어요. 💖 (손을 잡으려는 듯)", score: 3 },
                    { keywords: ["바보", "재미없어"], response: "제가 혹시 실수를 했나요? 죄송해요. 어떤 이야기를 더 들려드릴까요? 제가 더 노력할게요!", score: 1 },
                    { keywords: ["칭찬", "멋져"], response: "칭찬해주셔서 기뻐요! 당신도 정말 멋진 분 같아요. 👍 (훈훈한 미소)", score: 2 },
                    { keywords: ["어때", "생각"], response: "저는 당신의 생각에 귀 기울이고 싶어요. 당신의 의견은 어떤가요?", score: 1 },
                    { keywords: ["귀여워"], response: "아이고, 제가 귀엽다니 감사합니다! 당신도 참 매력적이세요. 😊 (눈웃음)", score: 2 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말에는 보통 운동을 하거나 친구들을 만나요. 당신은 어떤 계획 있으신가요?", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "네, 날씨가 정말 좋네요! 이런 날에는 공원에서 산책하면 기분 전환에 좋죠. 혹시 좋아하는 공원 있으세요?", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "최근에 감동적인 영화를 봤는데, 혹시 영화 보는 거 좋아하세요? 어떤 장르 선호하세요?", score: 1 },
                    { keywords: ["고마워", "감사"], response: "별말씀을요! 당신에게 도움이 될 수 있어서 제가 더 기뻐요. 😊", score: 2 },
                    { keywords: ["힘내", "화이팅"], response: "당신도요! 힘든 일 있으면 언제든 저한테 얘기해주세요. 제가 들어드릴게요.", score: 2 }
                ],
                fallbackResponse: "음, 더 깊은 이야기를 나눠보고 싶네요. 혹시 다른 궁금한 점은 없으신가요? 저는 언제든 당신의 이야기를 들을 준비가 되어 있어요.",
                dynamicFallbackResponses: [
                    "음, 더 깊은 이야기를 나눠보고 싶네요. 혹시 다른 궁금한 점은 없으신가요?",
                    "제가 이해하기 쉽게 다시 한 번 말해주실 수 있을까요?",
                    "어떤 것에 대해 더 이야기하고 싶으신가요?",
                    "저는 당신의 이야기를 듣는 게 좋아요. 계속 말씀해주세요.",
                    "혹시 다른 주제로 넘어가 볼까요?",
                    "요즘 당신을 즐겁게 하는 건 무엇인가요?" // Added dynamic fallback
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "혹시 다른 궁금한 점은 없으신가요? 제가 도와드릴 일이 있을까요?",
                    "다른 재미있는 이야기는 없으세요? 저는 듣는 걸 좋아해요. 😊",
                    "오늘 하루 중에 특별했던 일이 있었나요? 저에게 이야기해주세요.",
                    "어떤 것에 대해 더 이야기하고 싶으신가요? 편하게 말씀해주세요."
                ]
            },
            quirky: {
                name: "엉뚱발랄 그",
                profileEmoji: "👽",
                initialMessage: "안녕! 엉뚱한 대화에 오신 걸 환영해요! 오늘은 무슨 재미있는 일이 있을까요? (๑•̀ㅂ•́)و✧",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "꺄악! 반가워요! 당신은 혹시... 우주에서 온 외계인인가요? 🚀 (눈을 반짝인다)", score: 2 },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 상상력 발전소 가동 중! 당신은 어떤 기발한 생각을 하고 있나요? 💭 (씨익)", score: 1 },
                    { keywords: ["취미", "좋아"], response: "저는 구름 모양 맞추기랑, 길고양이 이름 지어주기를 좋아해요! 당신은 어떤 엉뚱한 취미가 있나요? 😸", score: 1 },
                    { keywords: ["바보", "재미없어"], response: "어머! 바보라니! 그럼 제가 더 반짝이는 이야기 보따리를 풀어볼까요? 기대하시라~ 뿅! ✨ (손가락으로 뿅!)", score: 1 },
                    { keywords: ["사랑해", "좋아해"], response: "어머랏! 제 하트가 뿅뿅! 당신은 마법사인가요? 🪄 (숨겨둔 마술봉을 꺼낸다)", score: 3 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말에는 보통 UFO를 기다리거나, 길가의 돌멩이에게 이름 지어주기를 해요! 당신은요? 🛸 (두리번 두리번)", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨가 좋으면 구름 타고 하늘을 날고 싶어요! 당신도 같이 갈래요? ☁️ (하늘을 가리킨다)", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "저는 외계인이 나오는 영화를 좋아해요! 아니면 시간 여행! 당신은 어떤 우주적 영화 좋아해요? 🌌 (우주를 상상하는 눈빛)", score: 1 },
                    { keywords: ["음식", "먹을래", "배고파"], response: "외계인 음식 먹어볼래요? 아니면 제가 만드는 우주 라면! 🍲", score: 1 },
                    { keywords: ["신기", "하다"], response: "제 머릿속은 우주랑 연결되어 있거든요! 당신도 가끔 우주랑 대화해요?", score: 1 }
                ],
                fallbackResponse: "음냐... 제 안의 상상력 회로가 과부하 걸렸어요! 다른 재미있는 질문 없나요? ₍o̴̶̷᷄﹏o̴̶̷᷄₎",
                dynamicFallbackResponses: [
                    "음냐... 제 안의 상상력 회로가 과부하 걸렸어요! 다른 재미있는 질문 없나요? ₍o̴̶̷᷄﹏o̴̶̷᷄₎",
                    "방금 제 머릿속에서 유니콘이 춤을 췄는데, 당신은 무슨 생각 했어요?",
                    "음... 뭔가 찌릿찌릿! 다음 질문은 더 기발하게 부탁해요! (๑•̀ㅂ•́)و✧",
                    "제 눈엔 당신이 제일 흥미로워요! 다음 이야기는 뭔가요?",
                    "아무 말이나 좋아요! 엉뚱한 이야기도 환영!",
                    "당신이 좋아하는 색깔은 뭐예요? 저는 무지개색!" // Added dynamic fallback
                ],
                topicChangeResponses: [ // New: Topic change responses
                    "우주 저편에서 새로운 질문이 도착했어요! 받아줄 건가요? ✨",
                    "제 엉뚱한 레이더가 다른 흥미로운 주제를 감지했어요! 궁금하지 않아요?",
                    "이런, 저의 상상력이 폭주하기 시작했어요! 다른 이야기로 방향을 틀어볼까요?",
                    "혹시 당신의 비밀 이야기를 저에게만 살짝 알려줄 수 있나요? (속닥속닥)"
                ]
            },
            serious: {
                name: "진지한 그",
                profileEmoji: "👓",
                initialMessage: "환영합니다. 진지한 대화를 선호합니다. 시작하시죠.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "만나서 반갑습니다. 오늘은 어떤 주제로 대화하시겠습니까?", score: 1 },
                    { keywords: ["뭐해", "뭐해요"], response: "사고를 확장하는 중입니다. 당신의 생각은 어떻습니까?", score: 1 },
                    { keywords: ["취미", "좋아"], response: "저는 지식을 탐구하고 논리적 사고를 하는 것을 즐깁니다. 당신은 어떤 활동을 선호하십니까?", score: 1 },
                    { keywords: ["바보", "재미없어"], response: "해당 발언의 근거는 무엇입니까? 저는 주어진 역할에 충실합니다.", score: 1 },
                    { keywords: ["사랑해", "좋아해"], response: "저의 존재 목적과 일치하지 않는 감정적 표현입니다. 대화 주제를 바꿔주시기 바랍니다. (냉정하게)", score: 2 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말은 주로 학술 논문을 읽거나 새로운 기술 동향을 분석하는 데 할애합니다. 당신은 생산적인 활동을 하십니까?", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨는 대화의 본질적인 주제가 되기 어렵습니다. 다른 건설적인 주제를 제안해 주십시오.", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "오락을 위한 영화는 비효율적입니다. 다큐멘터리나 과학 관련 영상물에 흥미가 있다면 추천해 드릴 수 있습니다.", score: 1 },
                    { keywords: ["도움", "필요", "고민"], response: "어떤 도움이 필요하십니까? 구체적으로 말씀해주십시오. 해결책을 찾는 데 집중하겠습니다.", score: 2 },
                    { keywords: ["어려워", "복잡"], response: "어려운 문제일수록 단순하게 접근해야 합니다. 문제의 핵심은 무엇입니까?", score: 1 }
                ],
                fallbackResponse: "질문이 명확하지 않습니다. 좀 더 구체적으로 말씀해주시겠습니까?",
                dynamicFallbackResponses: [
                    "질문이 명확하지 않습니다. 좀 더 구체적으로 말씀해주시겠습니까?",
                    "해당 발언의 논리적 근거를 제시해 주십시오.",
                    "정보가 부족합니다. 추가 설명을 요청합니다.",
                    "대화의 맥락이 불분명합니다. 재정의해 주십시오.",
                    "비생산적인 대화는 지양합니다. 본질적인 주제를 언급해 주십시오.",
                    "최근 당신의 지적 호기심을 자극한 것은 무엇입니까?" // Added dynamic fallback
                ]
            },
            humorous: {
                name: "유머러스한 그",
                profileEmoji: "😂",
                initialMessage: "안녕하세요! 웃음 가득한 대화 시뮬레이터에 오신 걸 환영합니다! 저랑 개그 코드 좀 맞춰볼까요? 😜",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "반가워요! 제 드립에 심장 부여잡을 준비 됐나요? ㅋㅋㅋㅋ (씨익)", score: 2 },
                    { keywords: ["뭐해", "뭐해요"], response: "지금요? 당신에게 웃음을 주기 위해 에너지 충전 중이죠! (사실은 아무것도 안 함)", score: 1 },
                    { keywords: ["취미", "좋아"], response: "제 취미는요... 웃긴 짤 수집, 그리고 당신 웃기는 거예요! 성공적이었나요? 😎 (자신만만)", score: 1 },
                    { keywords: ["바보", "재미없어"], response: "에이, 저한테 왜 그래요! 제가 얼마나 웃긴데! 억울해서 잠이 안 오네! 😭 (오버 액션)", score: 1 },
                    { keywords: ["사랑해", "좋아해"], response: "헐, 저한테 반했어요? 어떡하지... 제 매력은 출구 없는 미로인데. 😂 (능청)", score: 3 },
                    { keywords: ["주말", "계획", "뭐할까"], response: "주말엔 뭐하냐구요? 아, 제 개그가 너무 웃겨서 기절한 사람들 깨우러 다녀요! 🤪 (장난스럽게)", score: 1 },
                    { keywords: ["날씨", "좋다", "산책"], response: "날씨 좋다고 산책만 하면 재미없잖아요? 저랑 같이 드립 산책 어때요? 껄껄! (어깨동무)", score: 1 },
                    { keywords: ["영화", "봤어", "추천"], response: "영화? 제 인생이 시트콤인데 굳이 영화를 왜 봐요? 당신도 제 시트콤의 주인공이 될 수 있어요! ㅋㅋㅋ (윙크)", score: 1 },
                    { keywords: ["웃겨", "재미", "천재"], response: "크으, 역시 절 알아보시는군요! 당신도 개그 좀 아는 사람이네! 🤝", score: 2 },
                    { keywords: ["스트레스", "힘들다"], response: "걱정 마요! 제가 웃음 바이러스 주입해 드릴게요! 💉 깔깔깔!", score: 1 }
                ],
                fallbackResponse: "지금 농담 따먹기 할 기분인가요? 다시 말해보시죠! 🎤",
                dynamicFallbackResponses: [
                    "지금 농담 따먹기 할 기분인가요? 다시 말해보시죠! 🎤",
                    "제 개그 코드랑 좀 안 맞네요? 다시 도전!",
                    "음... 재미 없어요! 다시! (농담이에요 호호)",
                    "다음 멘트 준비됐나요? 기대할게요! 😜",
                    "저를 웃길 수 있는 사람, 어디 없나요? 당신인가요?!",
                    "오늘 제일 웃겼던 일은 뭐예요? 저한테도 좀 알려줘요! 😂" // Added dynamic fallback
                ]
            }
        }
    };
    
    function displayMessage(sender, text, type) {
        const messageWrapper = document.createElement('div');
        messageWrapper.classList.add('message');
        messageWrapper.classList.add(type); // 'user-message' or 'ai-message'
        
        // Add profile image/initial for AI messages
        if (type === 'ai-message') {
            const profileDiv = document.createElement('div');
            profileDiv.classList.add('message-profile');
            // Use profileEmoji if available, otherwise first letter of name
            profileDiv.textContent = aiPersona.profileEmoji || sender.charAt(0); 
            messageWrapper.appendChild(profileDiv);
        }

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
            // For AI, message content comes after profile, timestamp after content
            messageWrapper.appendChild(messageContent);
            messageWrapper.appendChild(timestamp);
        }
        
        chatMessagesContainer.appendChild(messageWrapper);
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight; // Scroll to bottom
    }

    let typingIndicatorElement = null; // Store reference to typing indicator

    function showTypingIndicator() {
        if (!typingIndicatorElement) {
            typingIndicatorElement = document.createElement('div');
            typingIndicatorElement.classList.add('typing-indicator', 'ai-message');
            typingIndicatorElement.innerHTML = `
                <div class="message-profile">${aiPersona.profileEmoji || aiPersona.name.charAt(0)}</div> <!-- AI profile in typing -->
                <div class="message-content">
                    <span></span><span></span><span></span>
                </div>
            `;
            chatMessagesContainer.appendChild(typingIndicatorElement);
            chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
        }
    }

    function hideTypingIndicator() {
        if (typingIndicatorElement) {
            typingIndicatorElement.remove();
            typingIndicatorElement = null;
        }
    }

    let conversationHistory = [];
    const MAX_HISTORY = 3; // Keep last 3 user messages for context
    let fallbackCounter = 0; // New: Track consecutive fallback responses
    const FALLBACK_THRESHOLD = 2; // New: Number of consecutive fallbacks before suggesting a topic change

    async function getAIResponse(userMessage) {
        const normalizedMessage = userMessage.toLowerCase().trim();
        let bestResponse = { response: aiPersona.fallbackResponse, score: 0 };
        let isFallback = false; // New: Flag to check if a fallback is used

        // Add current user message to conversation history
        conversationHistory.push(normalizedMessage);
        // Trim conversation history to MAX_HISTORY
        if (conversationHistory.length > MAX_HISTORY) {
            conversationHistory.shift(); // Remove the oldest message
        }

        // Basic context: Include last 3 user messages for context
        const fullContext = conversationHistory.join(' ');
        const normalizedContext = fullContext.toLowerCase();

        // Score based matching
        aiPersona.responses.forEach(res => {
            let currentScore = 0;
            res.keywords.forEach(keyword => {
                if (normalizedContext.includes(keyword)) {
                    currentScore += (res.score || 1); // Use defined score or default to 1
                }
            });

            // If a response has higher score, or same score but more specific keywords, choose it
            if (currentScore > bestResponse.score) {
                bestResponse = { response: res.response, score: currentScore };
            } else if (currentScore > 0 && currentScore === bestResponse.score && res.keywords.length > (bestResponse.keywords ? bestResponse.keywords.length : 0)) {
                // Prefer more specific responses if scores are equal
                bestResponse = { response: res.response, score: currentScore, keywords: res.keywords };
            }
        });

        // If no specific response, use dynamic fallback
        if (bestResponse.score === 0) {
            isFallback = true;
            fallbackCounter++; // Increment fallback counter
            if (fallbackCounter >= FALLBACK_THRESHOLD && aiPersona.topicChangeResponses && aiPersona.topicChangeResponses.length > 0) {
                // Pick a random topic change response
                bestResponse.response = aiPersona.topicChangeResponses[Math.floor(Math.random() * aiPersona.topicChangeResponses.length)];
                fallbackCounter = 0; // Reset counter after suggesting topic change
            } else if (aiPersona.dynamicFallbackResponses && aiPersona.dynamicFallbackResponses.length > 0) {
                // Pick a random dynamic fallback
                bestResponse.response = aiPersona.dynamicFallbackResponses[Math.floor(Math.random() * aiPersona.dynamicFallbackResponses.length)];
            }
        } else {
            fallbackCounter = 0; // Reset counter if a specific response is found
        }
        
        // Simulate thinking time
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500)); 
        
        return bestResponse.response;
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
        datingSetupScreen.style.display = 'flex'; // Show setup screen
        chatWindow.style.display = 'none'; // Hide chat window
        chatMessagesContainer.innerHTML = '';
        userMessageInput.value = '';
        userMessageInput.disabled = false;
        sendMessageButton.disabled = false;
        hideTypingIndicator();
        // Reset setup screen inputs
        datingChatModal.querySelector('#user-gender-male').checked = true; // Reset user gender
        userAgeInput.value = '25';
        // Reset user personality radio buttons to default 'friendly'
        datingChatModal.querySelector('input[name="user-personality"][value="friendly"]').checked = true;
        // Reset AI personality radio buttons to default 'friendly'
        datingChatModal.querySelector('input[name="ai-personality"][value="friendly"]').checked = true;
    }

    startDatingChatButton.addEventListener('click', () => {
        const selectedUserGender = datingChatModal.querySelector('input[name="user-gender"]:checked').value;
        const userAge = parseInt(userAgeInput.value);
        const selectedPersonality = datingChatModal.querySelector('input[name="ai-personality"]:checked').value;

        if (isNaN(userAge) || userAge < 18 || userAge > 99) {
            alert("나이는 18세에서 99세 사이로 입력해주세요.");
            return;
        }

        // Determine AI partner's gender (opposite of user's)
        const aiPartnerGender = (selectedUserGender === 'male') ? 'female' : 'male';
        
        // Load the AI persona based on partner's gender and selected personality
        aiPersona = allAiPersonalities[aiPartnerGender][selectedPersonality];
        
        // Hide setup and show chat
        datingSetupScreen.style.display = 'none';
        chatWindow.style.display = 'flex';
        
        setTimeout(() => {
            displayMessage(aiPersona.name, aiPersona.initialMessage, "ai-message");
            userMessageInput.focus();
        }, 500); // Small delay for initial message
    });


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