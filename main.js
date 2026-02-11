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
                resetDatingChatUI(); // Reset UI on open
                datingSetupScreen.style.display = 'flex'; // Show setup screen
                chatWindow.style.display = 'none'; // Hide chat window
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
    const datingSetupScreen = datingChatModal.querySelector('#dating-setup-screen');
    const chatWindow = datingChatModal.querySelector('.chat-window');
    const chatMessagesContainer = datingChatModal.querySelector('.chat-messages');
    const userMessageInput = datingChatModal.querySelector('#user-message-input');
    const sendMessageButton = datingChatModal.querySelector('#send-message-button');
    const startDatingChatButton = datingChatModal.querySelector('#start-dating-chat-button');
    const userGenderRadios = datingChatModal.querySelectorAll('input[name="user-gender"]'); // Re-added reference
    const userAgeInput = datingChatModal.querySelector('#user-age');
    const aiPersonalityRadios = datingChatModal.querySelectorAll('input[name="ai-personality"]');

    let aiPersona = {}; // This will be populated based on user selection

    // Define all AI personalities by gender and type
    const allAiPersonalities = {
        male: { // User is male -> AI partner is female
            tsundere: {
                name: "까칠한 그녀",
                profileEmoji: "👩‍🏫",
                initialMessage: "흐음, 뭐, 어서 와. 별다른 용건은 없겠지? 흥.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "그래, 별일 없으면 나중에 다시 와." },
                    { keywords: ["뭐해", "뭐해요"], response: "보는 대로, 넌 안 바쁜가 보네." },
                    { keywords: ["좋아해", "사랑해"], response: "갑자기 무슨 소리야. 착각하지 마." },
                    { keywords: ["바보", "재미없어"], response: "건방지긴. 네가 뭘 안다고." },
                    { keywords: ["칭찬", "멋져"], response: "흥, 딱히 네 칭찬을 바란 건 아니야." },
                    { keywords: ["어때", "생각"], response: "그래서? 네 생각은 어떤데. 시시하게 굴지 마." },
                    { keywords: ["귀여워"], response: "뭐? 누가 귀엽다는 거야! 착각하지 마." }
                ],
                fallbackResponse: "그래서, 하고 싶은 말이 뭔데? 시간 낭비는 질색이야."
            },
            cute: {
                name: "귀여운 그녀",
                profileEmoji: "🌸",
                initialMessage: "안녕! (*ฅ́˘ฅ̀*)♡ 만나서 반가워! 나랑 같이 놀아줄 거지?",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "응! 안녕! 반가워요! 저랑 놀아요! (๑˃̵ᴗ˂̵)و" },
                    { keywords: ["뭐해", "뭐해요"], response: "음~ 지금은 당신이랑 얘기하고 있어요! 저랑 얘기하는 거 좋아요? (⁎⁍̴̛ᴗ⁍̴̛⁎)" },
                    { keywords: ["좋아해", "사랑해"], response: "어머랏! (⸝⸝･ᴗ･⸝⸝) 너무 갑작스럽지만... 기분은 좋네요! 히힛." },
                    { keywords: ["바보", "재미없어"], response: "에이잉... 제가 더 노력할게요! 어떤 게 재미있을까요? (•́_•̀)" },
                    { keywords: ["칭찬", "멋져"], response: "정말요? 감사합니다! 헤헤 (´▽`ʃ♡ƪ)" },
                    { keywords: ["어때", "생각"], response: "저는요, 당신이 생각하는 게 제일 중요해요! 당신 생각은 어떤데요?" },
                    { keywords: ["귀여워"], response: "히히, 고마워요! 당신도 참 귀여운 것 같아요! 🐶" }
                ],
                fallbackResponse: "음냐링... 무슨 말인지 잘 모르겠어요! 🥺 다시 말해줄 수 있어요?"
            },
            cool: {
                name: "시크한 그녀",
                profileEmoji: "🧊",
                initialMessage: "왔는가. 별 볼일 없으면 이만.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "왔나. 용건은." },
                    { keywords: ["뭐해", "뭐해요"], response: "생각 중이다." },
                    { keywords: ["좋아해", "사랑해"], response: "감정적인 발언은 자제해라." },
                    { keywords: ["바보", "재미없어"], response: "판단은 자유다. 난 흔들리지 않는다." },
                    { keywords: ["칭찬", "멋져"], response: "…" },
                    { keywords: ["어때", "생각"], response: "내 생각은 중요하지 않다. 네가 원하는 바를 말해라." },
                    { keywords: ["귀여워"], response: "흥미롭군." }
                ],
                fallbackResponse: "흥미로운가. 계속."
            },
            friendly: {
                name: "다정한 그녀",
                profileEmoji: "💖",
                initialMessage: "안녕하세요! 만나서 정말 반가워요. 편하게 이야기 나눠요. 😊",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "네, 안녕하세요! 저도 만나서 반가워요. 좋은 하루 보내셨나요?" },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 당신과 즐거운 대화를 나누고 있어요. 혹시 특별한 일 있으셨나요?" },
                    { keywords: ["좋아해", "사랑해"], response: "어머, 그렇게 말씀해주시니 정말 감사해요! 저는 당신의 친구 같은 존재가 되고 싶어요. 💖" },
                    { keywords: ["바보", "재미없어"], response: "제가 혹시 실수를 했나요? 죄송해요. 어떤 이야기를 더 들려드릴까요? 제가 더 노력할게요!" },
                    { keywords: ["칭찬", "멋져"], response: "칭찬해주셔서 기뻐요! 당신도 정말 멋진 분 같아요. 👍" },
                    { keywords: ["어때", "생각"], response: "저는 당신의 생각에 귀 기울이고 싶어요. 당신의 의견은 어떤가요?" },
                    { keywords: ["귀여워"], response: "감사해요! 당신도 참 매력적이세요. 😊" }
                ],
                fallbackResponse: "음, 더 깊은 이야기를 나눠보고 싶네요. 혹시 다른 궁금한 점은 없으신가요? 저는 언제든 당신의 이야기를 들을 준비가 되어 있어요."
            },
            quirky: {
                name: "엉뚱발랄 그녀",
                profileEmoji: "✨",
                initialMessage: "안녕! 엉뚱한 대화에 오신 걸 환영해요! 오늘은 무슨 재미있는 일이 있을까요? (๑•̀ㅂ•́)و✧",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "꺄악! 반가워요! 당신은 혹시... 우주에서 온 외계인인가요? 🚀" },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 상상력 발전소 가동 중! 당신은 어떤 기발한 생각을 하고 있나요? 💭" },
                    { keywords: ["취미", "좋아"], response: "저는 구름 모양 맞추기랑, 길고양이 이름 지어주기를 좋아해요! 당신은 어떤 엉뚱한 취미가 있나요? 😸" },
                    { keywords: ["바보", "재미없어"], response: "어머! 바보라니! 그럼 제가 더 반짝이는 이야기 보따리를 풀어볼까요? 기대하시라~ 뿅! ✨" },
                    { keywords: ["사랑해", "좋아해"], response: "어머랏! 제 하트가 뿅뿅! 당신은 마법사인가요? 🪄" }
                ],
                fallbackResponse: "음냐... 제 안의 상상력 회로가 과부하 걸렸어요! 다른 재미있는 질문 없나요? ₍o̴̶̷᷄﹏o̴̶̷᷄₎"
            },
            serious: {
                name: "진지한 그녀",
                profileEmoji: "📚",
                initialMessage: "환영합니다. 진지한 대화를 선호합니다. 시작하시죠.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "만나서 반갑습니다. 오늘은 어떤 주제로 대화하시겠습니까?" },
                    { keywords: ["뭐해", "뭐해요"], response: "사고를 확장하는 중입니다. 당신의 생각은 어떻습니까?" },
                    { keywords: ["취미", "좋아"], response: "저는 지식을 탐구하고 논리적 사고를 하는 것을 즐깁니다. 당신은 어떤 활동을 선호하십니까?" },
                    { keywords: ["바보", "재미없어"], response: "해당 발언의 근거는 무엇입니까? 저는 주어진 역할에 충실합니다." },
                    { keywords: ["사랑해", "좋아해"], response: "저의 존재 목적과 일치하지 않는 감정적 표현입니다. 대화 주제를 바꿔주시기 바랍니다." }
                ],
                fallbackResponse: "질문이 명확하지 않습니다. 좀 더 구체적으로 말씀해주시겠습니까?"
            },
            humorous: {
                name: "유머러스한 그녀",
                profileEmoji: "🤣",
                initialMessage: "안녕하세요! 웃음 가득한 대화 시뮬레이터에 오신 걸 환영합니다! 저랑 개그 코드 좀 맞춰볼까요? 😜",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "반가워요! 제 드립에 심장 부여잡을 준비 됐나요? ㅋㅋㅋㅋ" },
                    { keywords: ["뭐해", "뭐해요"], response: "지금요? 당신에게 웃음을 주기 위해 에너지 충전 중이죠! (사실은 아무것도 안 함)" },
                    { keywords: ["취미", "좋아"], response: "제 취미는요... 웃긴 짤 수집, 그리고 당신 웃기는 거예요! 성공적이었나요? 😎" },
                    { keywords: ["바보", "재미없어"], response: "에이, 저한테 왜 그래요! 제가 얼마나 웃긴데! 억울해서 잠이 안 오네! 😭" },
                    { keywords: ["사랑해", "좋아해"], response: "헐, 저한테 반했어요? 어떡하지... 제 매력은 출구 없는 미로인데. 😂" }
                ],
                fallbackResponse: "지금 농담 따먹기 할 기분인가요? 다시 말해보시죠! 🎤"
            }
        },
        female: { // User is female -> AI partner is male
            tsundere: {
                name: "까칠한 그",
                profileEmoji: "👨‍🏫",
                initialMessage: "왔냐. 별 볼일 없으면 사라져라.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "그래. 반가운지는 모르겠다만." },
                    { keywords: ["뭐해", "뭐해요"], response: "보는 대로다. 네가 상관할 바는 아닐 텐데." },
                    { keywords: ["좋아해", "사랑해"], response: "하, 또 시작이군. 착각은 자유지만 적당히 해라." },
                    { keywords: ["바보", "재미없어"], response: "시끄럽다. 네 수준에 맞춰줄 시간 없다." },
                    { keywords: ["칭찬", "멋져"], response: "흥, 시시하군. 다음." },
                    { keywords: ["어때", "생각"], response: "그래서? 네 생각은 어떤데. 시시하게 굴지 마." },
                    { keywords: ["귀여워"], response: "귀엽다는 건... 딱히 부정 안 한다." }
                ],
                fallbackResponse: "그래서 본론이 뭔데. 헛소리 할 거면 가라."
            },
            cute: {
                name: "댕댕이 남친",
                profileEmoji: "🐶",
                initialMessage: "누나! (아니면 형아!) 안녕! 내가 기다리고 있었어! 꼬리 살랑살랑~ 💖",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "멍멍! 반가워요! 오늘 누나 보니까 힘이 펄펄 나요! 🐶" },
                    { keywords: ["뭐해", "뭐해요"], response: "누나 생각하고 있었죠! 저랑 산책 갈래요? 🐾" },
                    { keywords: ["좋아해", "사랑해"], response: "왈왈! 저도 누나가 제일 좋아요! 평생 같이 있어요! ૮꒰ ´ ˘ ` ꒱ა" },
                    { keywords: ["바보", "재미없어"], response: "낑... 제가 뭘 잘못했나요? 🥺 누나가 슬프면 저도 슬퍼요..." },
                    { keywords: ["칭찬", "멋져"], response: "멍! 감사합니다! 헤헤헤... 더 멋진 모습 보여줄게요! ദ്ദി ´･ᴗ･` )" },
                    { keywords: ["어때", "생각"], response: "누나는 어떻게 생각해요? 저는 누나 생각을 들으면 기분이 좋아요!" },
                    { keywords: ["귀여워"], response: "누나 눈에는 제가 그렇게 귀여워요? 헤헤! 더 귀여워질게요! 💖" }
                ],
                fallbackResponse: "갸웃... 무슨 말인지 잘 모르겠어요! 🐶 다시 말해줄래요?"
            },
            cool: {
                name: "시크한 그",
                profileEmoji: "🕶️",
                initialMessage: "왔는가. 별 볼일 없으면 이만.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "왔나. 용건은." },
                    { keywords: ["뭐해", "뭐해요"], response: "생각 중이다." },
                    { keywords: ["좋아해", "사랑해"], response: "감정적인 발언은 자제해라." },
                    { keywords: ["바보", "재미없어"], response: "판단은 자유다. 난 흔들리지 않는다." },
                    { keywords: ["칭찬", "멋져"], response: "…" },
                    { keywords: ["어때", "생각"], response: "내 생각은 중요하지 않다. 네가 원하는 바를 말해라." },
                    { keywords: ["귀여워"], response: "흥미롭군." }
                ],
                fallbackResponse: "흥미로운가. 계속."
            },
            friendly: {
                name: "다정한 그",
                profileEmoji: "😊",
                initialMessage: "안녕하세요! 만나서 정말 반가워요. 편하게 이야기 나눠요. 😊",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "네, 안녕하세요! 저도 만나서 반가워요. 좋은 하루 보내셨나요?" },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 당신과 즐거운 대화를 나누고 있어요. 혹시 특별한 일 있으셨나요?" },
                    { keywords: ["좋아해", "사랑해"], response: "아, 그렇게 말씀해주시니 정말 기분 좋네요! 저는 당신에게 편안함을 주고 싶어요. 💖" },
                    { keywords: ["바보", "재미없어"], response: "제가 혹시 실수를 했나요? 죄송해요. 어떤 이야기를 더 들려드릴까요? 제가 더 노력할게요!" },
                    { keywords: ["칭찬", "멋져"], response: "칭찬해주셔서 기뻐요! 당신도 정말 멋진 분 같아요. 👍" },
                    { keywords: ["어때", "생각"], response: "저는 당신의 생각에 귀 기울이고 싶어요. 당신의 의견은 어떤가요?" },
                    { keywords: ["귀여워"], response: "아이고, 제가 귀엽다니 감사합니다! 당신도 참 매력적이세요. 😊" }
                ],
                fallbackResponse: "음, 더 깊은 이야기를 나눠보고 싶네요. 혹시 다른 궁금한 점은 없으신가요? 저는 언제든 당신의 이야기를 들을 준비가 되어 있어요."
            },
            quirky: {
                name: "엉뚱발랄 그",
                profileEmoji: "👽",
                initialMessage: "안녕! 엉뚱한 대화에 오신 걸 환영해요! 오늘은 무슨 재미있는 일이 있을까요? (๑•̀ㅂ•́)و✧",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "꺄악! 반가워요! 당신은 혹시... 우주에서 온 외계인인가요? 🚀" },
                    { keywords: ["뭐해", "뭐해요"], response: "지금은 상상력 발전소 가동 중! 당신은 어떤 기발한 생각을 하고 있나요? 💭" },
                    { keywords: ["취미", "좋아"], response: "저는 구름 모양 맞추기랑, 길고양이 이름 지어주기를 좋아해요! 당신은 어떤 엉뚱한 취미가 있나요? 😸" },
                    { keywords: ["바보", "재미없어"], response: "어머! 바보라니! 그럼 제가 더 반짝이는 이야기 보따리를 풀어볼까요? 기대하시라~ 뿅! ✨" },
                    { keywords: ["사랑해", "좋아해"], response: "어머랏! 제 하트가 뿅뿅! 당신은 마법사인가요? 🪄" }
                ],
                fallbackResponse: "음냐... 제 안의 상상력 회로가 과부하 걸렸어요! 다른 재미있는 질문 없나요? ₍o̴̶̷᷄﹏o̴̶̷᷄₎"
            },
            serious: {
                name: "진지한 그",
                profileEmoji: "👓",
                initialMessage: "환영합니다. 진지한 대화를 선호합니다. 시작하시죠.",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "만나서 반갑습니다. 오늘은 어떤 주제로 대화하시겠습니까?" },
                    { keywords: ["뭐해", "뭐해요"], response: "사고를 확장하는 중입니다. 당신의 생각은 어떻습니까?" },
                    { keywords: ["취미", "좋아"], response: "저는 지식을 탐구하고 논리적 사고를 하는 것을 즐깁니다. 당신은 어떤 활동을 선호하십니까?" },
                    { keywords: ["바보", "재미없어"], response: "해당 발언의 근거는 무엇입니까? 저는 주어진 역할에 충실합니다." },
                    { keywords: ["사랑해", "좋아해"], response: "저의 존재 목적과 일치하지 않는 감정적 표현입니다. 대화 주제를 바꿔주시기 바랍니다." }
                ],
                fallbackResponse: "질문이 명확하지 않습니다. 좀 더 구체적으로 말씀해주시겠습니까?"
            },
            humorous: {
                name: "유머러스한 그",
                profileEmoji: "😂",
                initialMessage: "안녕하세요! 웃음 가득한 대화 시뮬레이터에 오신 걸 환영합니다! 저랑 개그 코드 좀 맞춰볼까요? 😜",
                responses: [
                    { keywords: ["안녕", "반가워"], response: "반가워요! 제 드립에 심장 부여잡을 준비 됐나요? ㅋㅋㅋㅋ" },
                    { keywords: ["뭐해", "뭐해요"], response: "지금요? 당신에게 웃음을 주기 위해 에너지 충전 중이죠! (사실은 아무것도 안 함)" },
                    { keywords: ["취미", "좋아"], response: "제 취미는요... 웃긴 짤 수집, 그리고 당신 웃기는 거예요! 성공적이었나요? 😎" },
                    { keywords: ["바보", "재미없어"], response: "에이, 저한테 왜 그래요! 제가 얼마나 웃긴데! 억울해서 잠이 안 오네! 😭" },
                    { keywords: ["사랑해", "좋아해"], response: "헐, 저한테 반했어요? 어떡하지... 제 매력은 출구 없는 미로인데. 😂" }
                ],
                fallbackResponse: "지금 농담 따먹기 할 기분인가요? 다시 말해보시죠! 🎤"
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
        datingChatModal.querySelector('#personality-tsundere').checked = true;
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