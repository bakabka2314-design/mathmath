document.addEventListener('DOMContentLoaded', () => {

    // 1. Element and View References
    const views = {
        home: document.getElementById('home-view'),
        practice: document.getElementById('practice-view'),
        results: document.getElementById('results-view'),
        details: document.getElementById('details-view'),
        rewards: document.getElementById('total-rewards-view'),
    };

    const buttons = {
        startPractice: document.getElementById('start-practice-btn'),
        viewDetails: document.getElementById('view-details-btn'),
        newPractice: document.getElementById('practice-again-results-btn'),
        myBonus: document.getElementById('my-bonus-btn'),
        practiceAgainDetails: document.getElementById('practice-again-details-btn'),
        practiceAgainRewards: document.getElementById('practice-again-rewards-btn'),
        viewTotalRewardsDetails: document.getElementById('view-total-rewards-details-btn'),
        nextQuestion: document.getElementById('next-question-btn'),
        modalOk: document.getElementById('modal-ok-btn'),
    };

    // 2. State Variables
    let totalCoins = 0;
    let userAchievements = [];
    let practiceHistory = [];
    let currentQuestions = [];
    let userAnswers = [];
    let currentQuestionIndex = 0;
    let achievementQueue = []; // New achievements to show in modal

    // 3. Constants
    const achievements = {
        firstStep: { name: "First Step", icon: "🎯", description: "Finish your first practice!", condition: (history) => history.length >= 1, encouragement: "You're so amazing! A true math star! 🌟" },
        coinStarter: { name: "Coin Starter", icon: "🥉", description: "Earn 50 coins in total", condition: () => totalCoins >= 50, encouragement: "You're a little genius! Keep going! 🚀" },
        mathExplorer: { name: "Math Explorer", icon: "🥈", description: "Earn 100 coins in total", condition: () => totalCoins >= 100, encouragement: "You're so excellent! Math is fun! 🌈" },
        mathMaster: { name: "Math Master", icon: "🥇", description: "Earn 150 coins in total", condition: () => totalCoins >= 150, encouragement: "Incredible! You're a math master now! 🏆" },
        mathGenius: { name: "Math Genius", icon: "👑", description: "Earn 200 coins in total", condition: () => totalCoins >= 200, encouragement: "Unbelievable! You're a true math genius! 👑" },
        perfectScore: { name: "Perfect Score", icon: "⭐", description: "Get 3/3 correct once", condition: (history) => history.some(h => h.correct === 3), encouragement: "Perfect! You hit the target! 🎯" },
        practiceStreak: { name: "Practice Streak", icon: "🔥", description: "Finish 5 practices", condition: (history) => history.length >= 5, encouragement: "On fire! Your dedication is inspiring! 🔥" },
    };

    // 4. Core Functions
    const showView = (viewName) => {
        // Hide modal if active when switching views
        document.getElementById('achievement-modal').classList.add('hidden');
        
        Object.values(views).forEach(view => view.classList.add('hidden'));
        if (views[viewName]) {
            views[viewName].classList.remove('hidden');
        }
        if (viewName === 'home') {
            renderCalendar();
        }
    };

    // Data Persistence
    const updateCoinDisplays = () => {
        document.getElementById('total-coins-home').textContent = totalCoins;
        document.getElementById('total-coins-rewards').textContent = totalCoins;
    };

    const saveData = () => {
        localStorage.setItem('mathBuddy_totalBonus', totalCoins);
        localStorage.setItem('mathBuddy_achievements', JSON.stringify(userAchievements));
        localStorage.setItem('mathBuddy_history', JSON.stringify(practiceHistory));
    };

    const loadData = () => {
        const savedCoins = localStorage.getItem('mathBuddy_totalBonus');
        const savedAchievements = localStorage.getItem('mathBuddy_achievements');
        const savedHistory = localStorage.getItem('mathBuddy_history');

        totalCoins = savedCoins ? parseInt(savedCoins, 10) : 0;
        userAchievements = savedAchievements ? JSON.parse(savedAchievements) : [];
        practiceHistory = savedHistory ? JSON.parse(savedHistory) : [];

        // Re-validate achievements to ensure they match current requirements
        checkAndUnlockAchievements();
        saveData();

        updateCoinDisplays();
        renderCalendar(); // New: Render calendar after loading history
    };

    // Calendar Logic
    const renderCalendar = () => {
        const calendarGrid = document.getElementById('calendar-grid');
        const calendarMonthLabel = document.getElementById('calendar-month');
        const practiceDaysCount = document.getElementById('practice-days-count');
        const weekdaysContainer = document.getElementById('calendar-weekdays');
        
        if (!calendarGrid || !calendarMonthLabel || !practiceDaysCount || !weekdaysContainer) return;

        calendarGrid.innerHTML = '';
        weekdaysContainer.innerHTML = '';
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        
        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"];
        calendarMonthLabel.textContent = `${monthNames[month]} ${year}`;

        // Render weekdays
        const weekdays = ['Sun', 'Mon', 'Tues', 'Wed', 'Thurs', 'Fri', 'Sat'];
        weekdays.forEach(day => {
            const dayElement = document.createElement('div');
            dayElement.textContent = day;
            weekdaysContainer.appendChild(dayElement);
        });

        // Group practice history by date
        const practicesByDate = practiceHistory.reduce((acc, record) => {
            const date = record.date.split('T')[0];
            if (!acc[date]) {
                acc[date] = { totalCorrect: 0, totalQuestions: 0 };
            }
            acc[date].totalCorrect += record.correct;
            acc[date].totalQuestions += record.total;
            return acc;
        }, {});

        const practicedDates = new Set(Object.keys(practicesByDate));
        practiceDaysCount.textContent = practicedDates.size;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 0; i < firstDayOfMonth; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day');
            emptyDay.style.visibility = 'hidden';
            calendarGrid.appendChild(emptyDay);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            let accuracyText = '';
            if (practicesByDate[dateStr]) {
                const { totalCorrect, totalQuestions } = practicesByDate[dateStr];
                const accuracy = Math.round((totalCorrect / totalQuestions) * 100);
                accuracyText = `<div class="daily-accuracy">${accuracy}%</div>`;
                dayElement.classList.add('practiced');
            }

            dayElement.innerHTML = `<span>${day}</span>${accuracyText}`;

            if (day === now.getDate()) {
                dayElement.classList.add('today');
            }

            calendarGrid.appendChild(dayElement);
        }
    };

    // Quiz Logic
    const generateQuestions = () => {
        return Array.from({ length: 3 }, () => {
            const isAdd = Math.random() > 0.5;
            const a = Math.floor(Math.random() * 10) + 1;
            const b = isAdd ? Math.floor(Math.random() * 10) : Math.floor(Math.random() * a);
            return {
                num1: a,
                num2: b,
                operator: isAdd ? '+' : '-',
                answer: isAdd ? a + b : a - b,
            };
        });
    };

    const updateProgressDots = () => {
        const dots = document.querySelectorAll('.progress-dot');
        dots.forEach((dot, index) => {
            dot.className = 'progress-dot'; // Reset classes
            if (index < currentQuestionIndex) {
                dot.classList.add('completed');
            } else if (index === currentQuestionIndex) {
                dot.classList.add('current');
            }
        });
    };

    const displayQuestion = () => {
        const question = currentQuestions[currentQuestionIndex];
        const questionCard = document.getElementById('question-card');
        questionCard.innerHTML = `
            <span>${question.num1}</span>
            <span class="operator">${question.operator}</span>
            <span>${question.num2}</span>
            <span>=</span>
            <input type="number" id="answer-input" autofocus />
        `;
        const input = document.getElementById('answer-input');
        if(input) input.focus();
        updateProgressDots();
    };

    const startPractice = () => {
        currentQuestions = generateQuestions();
        userAnswers = [];
        currentQuestionIndex = 0;
        showView('practice');
        displayQuestion();
        buttons.nextQuestion.textContent = 'Next';
    };

    const handleNextQuestion = () => {
        const answerInput = document.getElementById('answer-input');
        if (!answerInput) return;
        userAnswers[currentQuestionIndex] = answerInput.value;
        currentQuestionIndex++;

        if (currentQuestionIndex < 3) {
            displayQuestion();
            if (currentQuestionIndex === 2) {
                buttons.nextQuestion.textContent = 'Submit All';
            }
        } else {
            calculateAndShowResults();
        }
    };

    // Results and Rewards
    const checkAndUnlockAchievements = (isNewPractice = false) => {
        const newlyUnlocked = [];
        
        // Always identify achievements that meet the condition
        const eligibleAchievements = Object.keys(achievements).filter(key => 
            achievements[key].condition(practiceHistory)
        );

        // If it's a new practice (user just submitted), find what was JUST unlocked
        if (isNewPractice) {
            eligibleAchievements.forEach(key => {
                if (!userAchievements.includes(key)) {
                    newlyUnlocked.push(key);
                }
            });
        }

        // Sync state to only include eligible ones (fixes the "unlocked wrongly" issue)
        userAchievements = eligibleAchievements;
        
        return newlyUnlocked;
    };

    const showAchievementModal = () => {
        if (achievementQueue.length === 0) {
            showView('results');
            return;
        }

        const achievementKey = achievementQueue[0];
        const achievement = achievements[achievementKey];
        
        document.getElementById('modal-badge-icon').textContent = achievement.icon;
        document.getElementById('modal-reward-name').textContent = achievement.name;
        document.getElementById('modal-reward-condition').textContent = achievement.description;
        document.getElementById('modal-encouragement').textContent = achievement.encouragement;
        
        document.getElementById('achievement-modal').classList.remove('hidden');
    };

    buttons.modalOk.addEventListener('click', () => {
        achievementQueue.shift(); // Remove the current achievement
        if (achievementQueue.length > 0) {
            showAchievementModal(); // Show next one
        } else {
            // No more achievements, close modal and show results
            achievementQueue = []; // Double ensure it's empty
            document.getElementById('achievement-modal').classList.add('hidden');
            showView('results'); 
        }
    });

    
    const triggerConfetti = (correctCount) => {
        const confettiOptions = {
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 }
        };
        if (correctCount >= 2) {
            confetti({ ...confettiOptions, colors: ['#FFD700', '#FFDF00', '#GOLD'] });
        } else {
            confetti(confettiOptions);
        }
    };

    const calculateAndShowResults = () => {
        let correctCount = 0;
        userAnswers.forEach((answer, index) => {
            if (parseInt(answer, 10) === currentQuestions[index].answer) {
                correctCount++;
            }
        });

        const baseBonus = 2;
        const correctBonus = correctCount * 2;
        const totalBonus = baseBonus + correctBonus;
        
        // 1. Update latest state FIRST (Requirement 1)
        practiceHistory.push({ date: new Date().toISOString(), correct: correctCount, total: 3, bonus: totalBonus });
        totalCoins += totalBonus;
        
        // 2. Identify NEW achievements only after state update (Requirement 1 & 2)
        achievementQueue = checkAndUnlockAchievements(true);
        
        // 3. Save all data
        saveData();
        updateCoinDisplays();

        // 4. Prepare UI for Results View (in background)
        const accuracyEl = document.getElementById('accuracy-display');
        accuracyEl.textContent = `${correctCount}/3 Correct`;
        accuracyEl.classList.remove('high', 'mid', 'low');
        if (correctCount === 3) {
            accuracyEl.classList.add('high');
        } else if (correctCount >= 1) {
            accuracyEl.classList.add('mid');
        } else {
            accuracyEl.classList.add('low');
        }
        document.getElementById('bonus-calculation').textContent = `💰 +${totalBonus} coins`;

        const resultTitle = document.getElementById('result-title');
        const resultSummary = document.getElementById('result-summary');
        const bearBubble = document.getElementById('bear-bubble');

        const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

        const messagesPerfect = [
            "Perfect score! You're amazing—math genius! 🌟",
            "Full marks! Awesome job—super accurate! ⭐",
            "3/3 correct! So proud of you! Keep shining! ✨",
        ];

        const messagesTwo = [
            "Great accuracy! You did so well—keep practicing! 👍",
            "So close! Great job—practice more to be even better! 🌈",
            "Nice work! Your accuracy is high—try again! 🚀",
        ];

        const messagesTry = [
            "You're already doing great by practicing! Keep going! 💪",
            "You can do it! Try once more—you're getting better! 🌟",
            "Practice makes progress! Keep trying—you'll improve! ✨",
        ];

        if (correctCount === 3) {
            resultTitle.innerHTML = "Perfect Score! 🌟";
            if (bearBubble) bearBubble.textContent = pickRandom(messagesPerfect);
        } else if (correctCount === 2) {
            resultTitle.innerHTML = "Great Job! 👍";
            if (bearBubble) bearBubble.textContent = pickRandom(messagesTwo);
        } else {
            resultTitle.innerHTML = "Good Try! 💪";
            if (bearBubble) bearBubble.textContent = pickRandom(messagesTry);
        }

        if (resultSummary) {
            resultSummary.textContent = "";
        }

        // 5. Trigger Reward Modal if any, otherwise skip to results
        if (achievementQueue.length > 0) {
            showAchievementModal();
        } else {
            showView('results');
        }
        
        // Let's start the celebration
        triggerConfetti(correctCount);
    };

    // Detail Views
    const displayPracticeDetails = () => {
        const transcriptContainer = document.getElementById('transcript');
        transcriptContainer.innerHTML = '';
        currentQuestions.forEach((question, index) => {
            const userAnswer = userAnswers[index] || "";
            const isCorrect = parseInt(userAnswer, 10) === question.answer;
            const transcriptItem = document.createElement('div');
            transcriptItem.classList.add('transcript-item', isCorrect ? 'correct' : 'incorrect');
            
            transcriptItem.innerHTML = `
                <div class="transcript-main">
                    <span class="q-number">Q${index + 1}:</span>
                    <span class="q-text">${question.num1} ${question.operator} ${question.num2} = </span>
                    <span class="user-answer">${userAnswer}</span>
                    <span class="status-icon">${isCorrect ? '✅' : '❌'}</span>
                </div>
                ${!isCorrect ? `<div class="correct-answer-hint">The correct answer is: <strong>${question.answer}</strong></div>` : ''}
            `;
            transcriptContainer.appendChild(transcriptItem);
        });
        showView('details');
    };
    
    const animateValue = (obj, start, end, duration) => {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start);
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    };

    const displayTotalRewards = () => {
        // Sync achievements state before rendering
        checkAndUnlockAchievements();
        saveData();

        const milestoneWall = document.getElementById('milestone-wall');
        milestoneWall.innerHTML = '';
        Object.keys(achievements).forEach(key => {
            const achievement = achievements[key];
            const isUnlocked = userAchievements.includes(key);
            const badge = document.createElement('div');
            badge.classList.add('milestone-badge', isUnlocked ? 'unlocked' : 'locked');
            badge.innerHTML = `
                <div class="badge-icon">${achievement.icon}</div>
                <div class="badge-name">${achievement.name}</div>
                <div class="badge-description">${achievement.description}</div>
            `;
            milestoneWall.appendChild(badge);
        });
        const totalCoinsElement = document.getElementById('total-coins-rewards');
        animateValue(totalCoinsElement, 0, totalCoins, 1000);
        showView('rewards');
    };

    // 5. Event Listeners
    buttons.startPractice.addEventListener('click', startPractice);
    buttons.nextQuestion.addEventListener('click', handleNextQuestion);
    buttons.viewDetails.addEventListener('click', displayPracticeDetails);
    buttons.myBonus.addEventListener('click', displayTotalRewards);
    buttons.newPractice.addEventListener('click', startPractice);
    buttons.practiceAgainDetails.addEventListener('click', startPractice);
    buttons.practiceAgainRewards.addEventListener('click', startPractice);
    buttons.viewTotalRewardsDetails.addEventListener('click', displayTotalRewards);
    
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => showView('home'));
    });

    // 6. Initialization
    loadData();
    showView('home');
});
