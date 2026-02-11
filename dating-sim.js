const questions = [
    {
        question: "주말에 데이트 상대와 무엇을 하고 싶으신가요?",
        choices: [
            { text: "조용하고 분위기 좋은 카페에서 대화하기", reaction: "오, 심도 깊은 대화를 좋아하시는군요!", scores: { typeA: 2, typeC: 1 } },
            { text: "활동적인 야외 활동 (등산, 자전거 등)", reaction: "에너지가 넘치시네요! 좋아요!", scores: { typeB: 2, typeD: 1 } },
            { text: "맛집 탐방 또는 새로운 문화 체험", reaction: "미식가이시군요! 저도 좋아요!", scores: { typeE: 2, typeF: 1 } }
        ]
    },
    {
        question: "데이트 상대가 약속에 늦었다면 어떻게 반응할까요?",
        choices: [
            { text: "괜찮다고 말하며 이해해 준다", reaction: "배려심이 깊으시네요!", scores: { typeA: 1, typeC: 2 } },
            { text: "솔직하게 아쉬움을 표현한다", reaction: "솔직한 모습이 매력적이에요!", scores: { typeB: 1, typeD: 2 } },
            { text: "늦은 이유를 먼저 물어본다", reaction: "합리적인 분이시군요!", scores: { typeE: 1, typeF: 2 } }
        ]
    },
    {
        question: "어떤 칭찬을 들을 때 가장 기분이 좋은가요?",
        choices: [
            { text: "센스 있다, 섬세하다는 칭찬", reaction: "역시 탁월한 감각을 지니셨군요!", scores: { typeC: 2, typeF: 1 } },
            { text: "재미있다, 유쾌하다는 칭찬", reaction: "활력 넘치는 모습이 보기 좋아요!", scores: { typeD: 2, typeB: 1 } },
            { text: "든든하다, 믿음직하다는 칭찬", reaction: "강인한 매력을 가지셨네요!", scores: { typeA: 1, typeE: 2 } }
        ]
    },
    {
        question: "데이트 중 어색한 침묵이 흐른다면?",
        choices: [
            { text: "새로운 화제를 찾거나 질문을 던진다", reaction: "대화의 흐름을 잘 이끌어 가시네요!", scores: { typeD: 2, typeB: 1 } },
            { text: "상대방의 눈치를 보며 반응을 기다린다", reaction: "상대방을 존중하는 모습이 아름다워요!", scores: { typeA: 2, typeC: 1 } },
            { text: "자연스럽게 다른 활동 (메뉴판 보기 등)으로 전환한다", reaction: "순발력이 좋으시네요!", scores: { typeE: 1, typeF: 2 } }
        ]
    },
    {
        question: "데이트 상대와의 첫 만남 후 가장 먼저 하는 행동은?",
        choices: [
            { text: "친구들에게 데이트 후기 공유하기", reaction: "친구들과의 유대감이 깊으시네요!", scores: { typeB: 1, typeD: 2 } },
            { text: "오늘 데이트를 복기하며 좋았던 점 떠올리기", reaction: "섬세하고 감성적인 분이시군요!", scores: { typeA: 2, typeC: 1 } },
            { text: "다음 만남을 기약하며 메시지 보내기", reaction: "적극적인 모습이 보기 좋네요!", scores: { typeE: 2, typeF: 1 } }
        ]
    },
    {
        question: "데이트 상대를 위해 준비하고 싶은 선물은?",
        choices: [
            { text: "직접 만든 정성 가득한 선물", reaction: "진심이 담긴 선물이 최고죠!", scores: { typeA: 2, typeC: 1 } },
            { text: "상대방이 평소 필요했던 실용적인 선물", reaction: "센스가 넘치시는군요!", scores: { typeE: 2, typeF: 1 } },
            { text: "함께 즐길 수 있는 특별한 경험 (공연 티켓 등)", reaction: "즐거움을 공유하려는 마음이 예뻐요!", scores: { typeB: 1, typeD: 2 } }
        ]
    },
    {
        question: "연애에 대한 당신의 생각은?",
        choices: [
            { text: "안정적이고 편안한 관계가 최고", reaction: "편안함 속에서 진정한 행복을 찾으시는군요!", scores: { typeA: 2, typeE: 1 } },
            { text: "매일매일 설레고 뜨거운 관계", reaction: "열정적인 사랑을 꿈꾸시네요!", scores: { typeB: 2, typeD: 1 } },
            { text: "서로 발전하고 성장하는 관계", reaction: "성숙한 연애관을 가지셨네요!", scores: { typeC: 1, typeF: 2 } }
        ]
    },
    {
        question: "싸웠을 때 당신의 대처 방식은?",
        choices: [
            { text: "감정이 상하더라도 대화를 통해 해결", reaction: "갈등 해결 능력이 뛰어나시네요!", scores: { typeC: 2, typeE: 1 } },
            { text: "일단 시간을 갖고 진정한 후 대화", reaction: "현명한 대처 방식이에요!", scores: { typeA: 1, typeF: 2 } },
            { text: "기분 전환을 위해 다른 활동에 몰두", reaction: "스트레스 해소 능력이 좋으시네요!", scores: { typeB: 2, typeD: 1 } }
        ]
    },
    {
        question: "데이트 상대에게 듣고 싶은 말은?",
        choices: [
            { text: "'네 덕분에 정말 행복해'", reaction: "상대방에게 행복을 주는 매력을 가지셨네요!", scores: { typeA: 2, typeC: 1 } },
            { text: "'너와 있으면 지루할 틈이 없어'", reaction: "긍정적인 에너지가 넘치시는군요!", scores: { typeB: 2, typeD: 1 } },
            { text: "'너를 존경하고 배울 점이 많아'", reaction: "내면의 아름다움을 중시하는 분이시네요!", scores: { typeE: 1, typeF: 2 } }
        ]
    },
    {
        question: "가장 선호하는 데이트 장소는?",
        choices: [
            { text: "아늑한 분위기의 레스토랑", reaction: "편안하고 로맨틱한 분위기를 좋아하시는군요!", scores: { typeA: 2, typeC: 1 } },
            { text: "새로운 것을 배울 수 있는 공방/클래스", reaction: "배움을 즐기는 지적인 분이시네요!", scores: { typeE: 2, typeF: 1 } },
            { text: "트렌디하고 핫한 거리", reaction: "세련되고 활동적인 분이시군요!", scores: { typeB: 1, typeD: 2 } }
        ]
    }
];

const results = {
    typeA: {
        name: "따뜻한 감성 분석가",
        summary: "당신은 상대방의 감정을 섬세하게 읽어내고, 안정적인 관계를 추구하는 따뜻한 감성 분석가입니다. 깊은 대화를 통해 서로를 알아가는 것을 좋아하며, 상대방에게 편안함을 주는 매력이 있습니다.",
        pros: ["뛰어난 공감 능력으로 상대에게 안정감을 줍니다.", "사려 깊은 배려로 관계를 더욱 돈독하게 만듭니다."],
        cons: "가끔 자신의 감정을 숨겨 상대방이 오해할 수 있습니다.",
        openingLines: ["오늘 어떤 하루를 보내셨나요? 궁금하네요.", "최근에 가장 즐거웠던 일은 무엇인가요?", "저는 당신과 함께하는 시간이 정말 소중해요."],
        dateCourses: ["잔잔한 음악이 흐르는 LP바에서 대화", "고즈넉한 한옥 카페에서 여유로운 시간"]
    },
    typeB: {
        name: "에너지 넘치는 매력 덩어리",
        summary: "당신은 밝고 긍정적인 에너지로 주변을 환하게 만드는 매력 덩어리입니다. 새로운 경험과 활동적인 데이트를 즐기며, 함께 있는 사람을 즐겁게 해주는 능력이 탁월합니다.",
        pros: ["긍정적인 에너지로 데이트 분위기를 주도합니다.", "다양한 활동을 즐겨 데이트가 지루할 틈이 없습니다."],
        cons: "가끔 너무 앞서나가 상대방의 의견을 놓칠 수 있습니다.",
        openingLines: ["오늘 저랑 같이 신나는 거 해볼래요?", "가장 좋아하는 액티비티는 뭐예요? 저도 같이 해보고 싶어요!", "당신이랑 있으면 매일이 특별해요!"],
        dateCourses: ["익사이팅한 스포츠 활동 (클라이밍, 볼링 등)", "힙한 감성의 스트릿 푸드 투어"]
    },
    typeC: {
        name: "섬세한 공감 능력자",
        summary: "당신은 상대방의 말에 귀 기울이고 깊이 공감하며, 섬세한 감정으로 관계를 쌓아가는 공감 능력자입니다. 상대방의 작은 변화도 놓치지 않고 알아차리는 따뜻한 마음을 가지고 있습니다.",
        pros: ["뛰어난 경청 능력으로 상대방의 마음을 편안하게 해줍니다.", "상대방의 감정을 이해하고 지지해주는 든든한 지원군입니다."],
        cons: "타인의 감정에 너무 몰입하여 지칠 때가 있습니다.",
        openingLines: ["오늘 무슨 이야기든 편하게 해주세요, 제가 들어줄게요.", "혹시 불편한 점은 없으셨나요?", "당신의 이야기가 궁금해요. 더 들려주세요."],
        dateCourses: ["고요한 갤러리/미술관 데이트", "아늑한 영화관에서 함께 감상 나누기"]
    },
    typeD: {
        name: "솔직 담백한 리더",
        summary: "당신은 솔직하고 꾸밈없는 매력으로 상대방에게 신뢰를 주는 리더형 연애 스타일입니다. 자신의 생각과 감정을 명확하게 표현하며, 관계를 주도적으로 이끌어가는 것을 선호합니다.",
        pros: ["솔직한 표현으로 오해 없이 깊은 관계를 만듭니다.", "명확한 의사 표현으로 답답함을 느낄 일이 없습니다."],
        cons: "가끔 너무 직설적인 표현으로 상대방이 상처받을 수 있습니다.",
        openingLines: ["오늘 우리 데이트 코스는 제가 정했어요!", "궁금한 거 있으면 뭐든지 솔직하게 물어봐도 좋아요.", "저는 당신의 솔직한 모습이 좋아요."],
        dateCourses: ["숨겨진 명소를 탐험하는 드라이브 데이트", "요리 클래스에서 함께 새로운 도전"]
    },
    typeE: {
        name: "든든한 믿음직한 조력자",
        summary: "당신은 상대방에게 든든한 버팀목이 되어주고, 안정적이고 신뢰할 수 있는 관계를 중요하게 생각하는 조력자입니다. 문제 해결 능력이 뛰어나며, 실질적인 도움을 주는 것을 기뻐합니다.",
        pros: ["상대방에게 언제나 든든한 버팀목이 되어줍니다.", "현실적인 문제 해결 능력으로 관계에 안정감을 더합니다."],
        cons: "가끔 너무 이성적으로만 접근하여 감성적인 교류가 부족할 수 있습니다.",
        openingLines: ["혹시 불편한 거 있으세요? 제가 도와줄게요.", "무슨 일이든 저에게 이야기해주세요. 함께 해결해나가요.", "저는 당신을 항상 지지할 거예요."],
        dateCourses: ["가구 만들기/목공 클래스에서 실용적인 취미 공유", "한적한 공원에서 산책하며 깊은 대화"]
    },
    typeF: {
        name: "지적인 매력의 탐험가",
        summary: "당신은 새로운 지식과 경험을 탐구하며, 지적인 매력으로 상대방의 호기심을 자극하는 탐험가입니다. 항상 배우고 성장하려는 자세로 관계에 신선함을 불어넣습니다.",
        pros: ["흥미로운 지식과 이야기로 대화를 풍성하게 만듭니다.", "새로운 경험을 함께하며 관계에 활력을 불어넣습니다."],
        cons: "가끔 너무 지적인 면만 강조하여 상대방이 어려워할 수 있습니다.",
        openingLines: ["요즘 흥미로운 뉴스나 책 읽은 거 있으세요?", "다음에 같이 가보고 싶은 특별한 장소가 있는데...", "저는 당신의 지적인 호기심이 좋아요."],
        dateCourses: ["과학관/박물관에서 함께 탐구", "독립 서점에서 서로의 취향 공유"]
    }
};

const history = []; // Stores chosen answers for back button functionality
let currentQuestionIndex = 0;
let scores = { typeA: 0, typeB: 0, typeC: 0, typeD: 0, typeE: 0, typeF: 0 };
let totalQuestions = questions.length;

// DOM Elements
const introModal = document.getElementById('intro-modal');
const closeModalButton = document.getElementById('close-modal');
const simulatorArea = document.getElementById('simulator-area');
const questionTextElement = document.getElementById('question-text');
const reactionTextElement = document.getElementById('reaction-text');
const choicesContainer = document.getElementById('choices-container');
const backButton = document.getElementById('back-button');
const resultArea = document.getElementById('result-area');
const resultTypeElement = document.getElementById('result-type');
const resultSummaryElement = document.getElementById('result-summary');
const resultProsElement = document.getElementById('result-pros');
const resultConsElement = document.getElementById('result-cons');
const resultOpeningLinesElement = document.getElementById('result-opening-lines');
const resultDateCoursesElement = document.getElementById('result-date-courses');
const shareButton = document.getElementById('share-button');
const restartButton = document.getElementById('restart-button');
const currentQuestionNumberElement = document.getElementById('current-question-number');
const totalQuestionsElement = document.getElementById('total-questions');
const progressBar = document.getElementById('progress-bar');

// Helper to show/hide elements
function show(element) { element.style.display = 'flex'; }
function hide(element) { element.style.display = 'none'; }

// Function to update progress bar
function updateProgressBar() {
    const progress = (currentQuestionIndex / totalQuestions) * 100;
    progressBar.style.width = `${progress}%`;
    currentQuestionNumberElement.textContent = currentQuestionIndex;
}

// Function to display question
function displayQuestion() {
    hide(resultArea);
    show(simulatorArea);
    reactionTextElement.textContent = ''; // Clear previous reaction

    if (currentQuestionIndex < totalQuestions) {
        const q = questions[currentQuestionIndex];
        questionTextElement.textContent = q.question;
        choicesContainer.innerHTML = ''; // Clear previous choices

        q.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.classList.add('choice-button');
            button.textContent = choice.text;
            button.dataset.choiceIndex = index;
            button.addEventListener('click', () => handleAnswer(choice, button));
            choicesContainer.appendChild(button);
        });
        backButton.style.display = (currentQuestionIndex > 0) ? 'block' : 'none';
        updateProgressBar();
    } else {
        showResult();
    }
}

// Function to handle answer selection
function handleAnswer(chosenChoice, button) {
    // Show reaction first
    reactionTextElement.textContent = chosenChoice.reaction;

    // Apply animation (e.g., fade out current question, fade in next)
    questionTextElement.classList.add('fade-leave-to');
    choicesContainer.classList.add('fade-leave-to');

    // Store history for back button
    history.push({
        questionIndex: currentQuestionIndex,
        previousScores: { ...scores }, // Deep copy
        chosenChoiceIndex: parseInt(button.dataset.choiceIndex)
    });

    // Apply scores
    for (const type in chosenChoice.scores) {
        scores[type] += chosenChoice.scores[type];
    }

    setTimeout(() => {
        questionTextElement.classList.remove('fade-leave-to');
        choicesContainer.classList.remove('fade-leave-to');
        currentQuestionIndex++;
        displayQuestion();
    }, 500); // Wait for fade-out animation
}

// Function to go back to previous question
function goBack() {
    if (history.length > 0) {
        const lastStep = history.pop();
        currentQuestionIndex = lastStep.questionIndex;
        scores = { ...lastStep.previousScores }; // Restore scores
        displayQuestion();
    }
}

// Function to determine and display result
function showResult() {
    hide(simulatorArea);
    show(resultArea);
    backButton.style.display = 'none'; // No back button on results

    let maxScore = -1;
    let resultType = '';

    for (const type in scores) {
        if (scores[type] > maxScore) {
            maxScore = scores[type];
            resultType = type;
        }
    }
    // Handle ties - simple pick first, could be more complex
    const finalResult = results[resultType];

    resultTypeElement.textContent = finalResult.name;
    resultSummaryElement.textContent = finalResult.summary;

    resultProsElement.innerHTML = '';
    finalResult.pros.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        resultProsElement.appendChild(li);
    });

    resultConsElement.textContent = finalResult.cons;

    resultOpeningLinesElement.innerHTML = '';
    finalResult.openingLines.forEach(l => {
        const li = document.createElement('li');
        li.textContent = l;
        resultOpeningLinesElement.appendChild(li);
    });

    resultDateCoursesElement.innerHTML = '';
    finalResult.dateCourses.forEach(d => {
        const li = document.createElement('li');
        li.textContent = d;
        resultDateCoursesElement.appendChild(li);
    });

    // Update URL for sharing
    const url = new URL(window.location.href);
    url.searchParams.set('result', resultType);
    window.history.replaceState({}, '', url);
}

// Function to restart the quiz
function restartQuiz() {
    currentQuestionIndex = 0;
    scores = { typeA: 0, typeB: 0, typeC: 0, typeD: 0, typeE: 0, typeF: 0 };
    history.length = 0; // Clear history
    reactionTextElement.textContent = ''; // Clear reaction
    const url = new URL(window.location.href);
    url.searchParams.delete('result');
    window.history.replaceState({}, '', url);
    displayQuestion();
}

// Event Listeners
closeModalButton.addEventListener('click', () => {
    hide(introModal);
    show(simulatorArea);
    // Check if result param exists on load
    const urlParams = new URLSearchParams(window.location.search);
    const initialResult = urlParams.get('result');
    if (initialResult && results[initialResult]) {
        // Pre-fill scores for the specific result type if shared link is opened
        // This is a simplified approach, a more robust solution might require storing full answer paths in URL or a different scoring mechanism for direct result links.
        // For now, we'll just show the result directly.
        showResultDirectly(initialResult);
    } else {
        displayQuestion();
    }
});

backButton.addEventListener('click', goBack);
restartButton.addEventListener('click', restartQuiz);

shareButton.addEventListener('click', () => {
    const url = new URL(window.location.href);
    // Ensure the result parameter is present in the URL
    // (It should be already set by showResult, but good to be explicit)
    if (!url.searchParams.has('result')) {
        let maxScore = -1;
        let resultType = '';
        for (const type in scores) {
            if (scores[type] > maxScore) {
                maxScore = scores[type];
                resultType = type;
            }
        }
        url.searchParams.set('result', resultType);
        window.history.replaceState({}, '', url);
    }
    navigator.clipboard.writeText(url.href)
        .then(() => alert('결과 링크가 클립보드에 복사되었습니다!'))
        .catch(err => console.error('링크 복사 실패:', err));
});

// Function to show result directly from URL
function showResultDirectly(resultKey) {
    hide(simulatorArea);
    hide(introModal); // Hide modal too if direct link
    show(resultArea);
    backButton.style.display = 'none';

    const finalResult = results[resultKey];

    resultTypeElement.textContent = finalResult.name;
    resultSummaryElement.textContent = finalResult.summary;

    resultProsElement.innerHTML = '';
    finalResult.pros.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p;
        resultProsElement.appendChild(li);
    });

    resultConsElement.textContent = finalResult.cons;

    resultOpeningLinesElement.innerHTML = '';
    finalResult.openingLines.forEach(l => {
        const li = document.createElement('li');
        li.textContent = l;
        resultOpeningLinesElement.appendChild(li);
    });

    resultDateCoursesElement.innerHTML = '';
    finalResult.dateCourses.forEach(d => {
        const li = document.createElement('li');
        li.textContent = d;
        resultDateCoursesElement.appendChild(li);
    });
}


// Initial setup on page load
document.addEventListener('DOMContentLoaded', () => {
    totalQuestionsElement.textContent = totalQuestions;
    const urlParams = new URLSearchParams(window.location.search);
    const initialResult = urlParams.get('result');

    if (initialResult && results[initialResult]) {
        // If a result parameter exists, show the result directly and hide the modal
        hide(introModal);
        showResultDirectly(initialResult);
    } else {
        // Otherwise, show the intro modal
        show(introModal);
    }
});
