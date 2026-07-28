import { Platform } from 'react-native';

const USE_MOCK = false;

const API_BASE_URL = Platform.OS === 'android'
  ? 'http://10.0.2.2:5000/v1'
  : 'http://localhost:5000/v1';
const MOCK_DELAY_MS = 180;
const subscribers = new Set();

const createInitialState = () => ({
  activeEmployeeId: 'sakshi',
  employees: [
    {
      id: 'sakshi',
      name: 'Sakshi',
      points: 450,
      streak: 4,
      lastQuizDate: '2026-07-24',
    },
    {
      id: 'alice',
      name: 'Alice',
      points: 360,
      streak: 2,
      lastQuizDate: '2026-07-23',
    },
    {
      id: 'bob',
      name: 'Bob',
      points: 280,
      streak: 0,
      lastQuizDate: null,
    },
  ],
  rewards: [
    { id: 'coffee', name: 'Coffee Voucher', emoji: '☕', cost: 120, stock: 8 },
    { id: 'hoodie', name: 'Team Hoodie', emoji: '🧥', cost: 300, stock: 3 },
    { id: 'movie', name: 'Movie Pass', emoji: '🎬', cost: 220, stock: 5 },
    { id: 'lunch', name: 'Lunch Coupon', emoji: '🍱', cost: 180, stock: 4 },
  ],
  quizzes: [
    // IT Questions
    {
      id: 'it-quiz-001',
      domain: 'IT',
      rewardPoints: 150,
      question: "A colleague asks you to share your password to quickly deploy a bug fix. What is the correct response?",
      options: [
        "Refuse and offer to deploy the fix yourself.",
        "Write the password on a sticky note.",
        "Send it via slack direct message.",
        "Tell them the password verbally."
      ],
      correctIndex: 0,
      explanation: "IT security policy strictly prohibits sharing credentials. Offering to deploy it yourself maintains compliance. 🔒",
      translations: {
        en: {
          question: "A colleague asks you to share your password to quickly deploy a bug fix. What is the correct response?",
          options: [
            "Refuse and offer to deploy the fix yourself.",
            "Write the password on a sticky note.",
            "Send it via slack direct message.",
            "Tell them the password verbally."
          ],
          explanation: "IT security policy strictly prohibits sharing credentials. Offering to deploy it yourself maintains compliance. 🔒"
        },
        hi: {
          question: "एक सहकर्मी आपसे बग फिक्स करने के लिए अपना पासवर्ड साझा करने को कहता है। सही प्रतिक्रिया क्या है?",
          options: [
            "अस्वीकार करें और खुद फिक्स को लागू करने की पेशकश करें।",
            "पासवर्ड को स्टिकी नोट पर लिख दें।",
            "इसे स्लैक डायरेक्ट मैसेज के जरिए भेजें।",
            "उन्हें मौखिक रूप से पासवर्ड बताएं।"
          ],
          explanation: "आईटी सुरक्षा नीति क्रेडेंशियल साझा करने की सख्त मनाही करती है। खुद फिक्स लागू करने से सुरक्षा बनी रहती है। 🔒"
        },
        mr: {
          question: "एका सहकाऱ्याने तुम्हाला बग फिक्स करण्यासाठी तुमचा पासवर्ड शेअर करण्यास सांगितले. योग्य उत्तर काय असेल?",
          options: [
            "नकार द्या आणि स्वतः फिक्स लागू करण्याची..."
          ],
          explanation: "आयटी सुरक्षा धोरण क्रेडेंशियल शेअर करण्यास सक्त मनाई करते. स्वतः फिक्स लागू केल्याने सुरक्षा टिकून राहते. 🔒"
        }
      }
    },
    {
      id: 'it-quiz-002',
      domain: 'IT',
      rewardPoints: 150,
      question: "You notice a critical security patch is available for a third-party library. When should this be updated?",
      options: [
        "Immediately, following the company's hotfix testing procedures.",
        "At the end of the quarterly cycle.",
        "Only if a client notices an issue.",
        "Ignore it unless it breaks current features."
      ],
      correctIndex: 0,
      explanation: "Security vulnerability patches should be applied as soon as tested to protect company and user data. 🛡️",
      translations: {
        en: {
          question: "You notice a critical security patch is available for a third-party library. When should this be updated?",
          options: [
            "Immediately, following the company's hotfix testing procedures.",
            "At the end of the quarterly cycle.",
            "Only if a client notices an issue.",
            "Ignore it unless it breaks current features."
          ],
          explanation: "Security vulnerability patches should be applied as soon as tested to protect company and user data. 🛡️"
        },
        hi: {
          question: "आप देखते हैं कि एक थर्ड-पार्टी लाइब्रेरी के लिए एक महत्वपूर्ण सुरक्षा पैच उपलब्ध है। इसे कब अपडेट किया जाना चाहिए?",
          options: [
            "तुरंत, कंपनी की हॉटफिक्स परीक्षण प्रक्रियाओं के बाद।",
            "तिमाही चक्र के अंत में।",
            "केवल तभी जब कोई क्लाइंट किसी समस्या पर ध्यान दे।",
            "इसे अनदेखा करें जब तक कि यह वर्तमान सुविधाओं को न तोड़ दे।"
          ],
          explanation: "कंपनी और उपयोगकर्ता डेटा की सुरक्षा के लिए परीक्षण के तुरंत बाद सुरक्षा पैच लागू किया जाना चाहिए। 🛡️"
        },
        mr: {
          question: "तुम्हाला एका थर्ड-पार्टी लायब्ररीसाठी एक महत्त्वाचा सुरक्षा पॅच उपलब्ध असल्याचे समजले. तो कधी अपडेट करावा?",
          options: [
            "ताबडतोब, कंपनीच्या हॉटफिक्स चाचणी प्रक्रियेचे पालन करून.",
            "त्रैमासिक चक्राच्या शेवटी.",
            "फक्त क्लायंटला काही अडचण आली तरच.",
            "सध्याचे फीचर्स बिघडत नसल्यास दुर्लक्ष करा."
          ],
          explanation: "कंपनी आणि युझर डेटा सुरक्षित ठेवण्यासाठी चाचणी केल्यानंतर ताबडतोब सुरक्षा पॅच लागू करणे आवश्यक आहे. 🛡️"
        }
      }
    },
    // CA Questions
    {
      id: 'ca-quiz-001',
      domain: 'CA',
      rewardPoints: 150,
      question: "When your manager asks for your work report, what is the best thing to do?",
      options: [
        "Give a clear and honest update of your work.",
        "Hide your mistakes and say everything is done.",
        "Do not reply and switch off your phone.",
        "Ask another person to do your report."
      ],
      correctIndex: 0,
      explanation: "Honesty builds trust. Telling the truth about your work status helps the team support you. 🤝",
      translations: {
        en: {
          question: "When your manager asks for your work report, what is the best thing to do?",
          options: [
            "Give a clear and honest update of your work.",
            "Hide your mistakes and say everything is done.",
            "Do not reply and switch off your phone.",
            "Ask another person to do your report."
          ],
          explanation: "Honesty builds trust. Telling the truth about your work status helps the team support you. 🤝"
        },
        hi: {
          question: "जब आपका मैनेजर आपके काम की रिपोर्ट मांगता है, तो सबसे अच्छा काम क्या है?",
          options: [
            "अपने काम की सही और ईमानदारी से जानकारी दें।",
            "अपनी गलतियों को छुपाएं और कहें कि सब हो गया है।",
            "कोई जवाब न दें और अपना फोन बंद कर लें।",
            "किसी दूसरे व्यक्ति से कहें कि वह आपकी रिपोर्ट बना दे।"
          ],
          explanation: "ईमानदारी से भरोसा बनता है। अपने काम की सही स्थिति बताने से पूरी टीम आपकी मदद कर सकती है। 🤝"
        },
        mr: {
          question: "जेव्हा तुमचे मॅनेजर तुमच्या कामाचा रिपोर्ट मागतात, तेव्हा सर्वात योग्य गोष्ट कोणती?",
          options: [
            "तुमच्या कामाची खरी आणि प्रामाणिक माहिती द्या.",
            "तुमच्या चुका लपवा आणि सर्व काम पूर्ण झाल्याचे सांगा.",
            "काहीही उत्तर देऊ नका आणि फोन बंद करा.",
            "दुसऱ्या व्यक्तीला तुमचा रिपोर्ट बनवायला सांगा."
          ],
          explanation: "बरोबर! प्रामाणिकपणामुळे विश्वास निर्माण होतो. कामाची खरी माहिती दिल्याने संपूर्ण टीम तुम्हाला मदत करू शकते. 🤝"
        }
      }
    },
    {
      id: 'ca-quiz-002',
      domain: 'CA',
      rewardPoints: 150,
      question: "You spent money on office work but lost the paper bill receipt. How can you show the accounts officer?",
      options: [
        "Show a digital mobile bank payment message or statement.",
        "Shout and argue with the accounts officer.",
        "Make a fake hand-written paper bill.",
        "Take money secretly from the office cash box."
      ],
      correctIndex: 0,
      explanation: "Accounts officers need proof for taxes. A digital bank message is clean and legal. 🧾",
      translations: {
        en: {
          question: "You spent money on office work but lost the paper bill receipt. How can you show the accounts officer?",
          options: [
            "Show a digital mobile bank payment message or statement.",
            "Shout and argue with the accounts officer.",
            "Make a fake hand-written paper bill.",
            "Take money secretly from the office cash box."
          ],
          explanation: "Accounts officers need proof for taxes. A digital bank message is clean and legal. 🧾"
        },
        hi: {
          question: "आपने ऑफिस के काम पर पैसे खर्च किए लेकिन पेपर बिल रसीद खो दी। आप अकाउंटेंट को कैसे साबित करेंगे?",
          options: [
            "मोबाइल पर बैंक से पैसे कटने का मैसेज या बैंक स्टेटमेंट दिखाएंगे।",
            "अकाउंटेंट से बहस और लड़ाई करेंगे।",
            "कागज पर हाथ से नकली बिल बना देंगे।",
            "ऑफिस के पैसे वाले गल्ले से चुपचाप पैसे निकाल लेंगे।"
          ],
          explanation: "टैक्स के लिए सबूत जरूरी है। बैंक का डिजिटल मैसेज दिखाना सुरक्षित और कानूनी तरीका है। 🧾"
        },
        mr: {
          question: "तुम्ही ऑफिसच्या कामासाठी पैसे खर्च केले पण मूळ कागदी बिल गमावले. तुम्ही अकाउंटेंटला कसे दाखवणार?",
          options: [
            "मोबाईलवरील बँक पेमेंटचा मेसेज किंवा बँक स्टेटमेंट दाखवणार.",
            "अकाउंटेंटशी वाद घालणार आणि भांडण करणार.",
            "कागदावर हाताने बनवलेले खोटे बिल देणार.",
            "ऑफिसच्या पैशांच्या कप्प्यातून चोरून पैसे काढणार."
          ],
          explanation: "कराच्या नियमांसाठी पुरावा आवश्यक असतो. बँकेचा डिजिटल मेसेज किंवा बँक स्टेटमेंट दाखवणे कायदेशीर ठरते. 🧾"
        }
      }
    },
    // CS Questions
    {
      id: 'cs-quiz-001',
      domain: 'CS',
      rewardPoints: 150,
      question: "A director asks to hold a board meeting without sending formal notices to all members. What is the correct advice?",
      options: [
        "Formal notice must be sent to all directors as per compliance requirements.",
        "Hold the meeting and send notices later.",
        "Skip notices if all directors verbally agree.",
        "Proceed since directors have special powers."
      ],
      correctIndex: 0,
      explanation: "Under Company Secretary guidelines, all board meetings must have formal, timely notice sent to remain legally valid. 📋",
      translations: {
        en: {
          question: "A director asks to hold a board meeting without sending formal notices to all members. What is the correct advice?",
          options: [
            "Formal notice must be sent to all directors as per compliance requirements.",
            "Hold the meeting and send notices later.",
            "Skip notices if all directors verbally agree.",
            "Proceed since directors have special powers."
          ],
          explanation: "Under Company Secretary guidelines, all board meetings must have formal, timely notice sent to remain legally valid. 📋"
        },
        hi: {
          question: "एक निदेशक सभी सदस्यों को औपचारिक नोटिस भेजे बिना बोर्ड बैठक आयोजित करने के लिए कहता है। सही सलाह क्या है?",
          options: [
            "अनुपालन आवश्यकताओं के अनुसार सभी निदेशकों को औपचारिक नोटिस भेजा जाना चाहिए।",
            "बैठक आयोजित करें और बाद में नोटिस भेजें।",
            "यदि सभी निदेशक मौखिक रूप से सहमत हैं तो नोटिस न भेजें।",
            "आगे बढ़ें क्योंकि निदेशकों के पास विशेष शक्तियां हैं।"
          ],
          explanation: "कंपनी सचिव दिशानिर्देशों के तहत, कानूनी रूप से वैध रहने के लिए सभी बोर्ड बैठकों के लिए औपचारिक, समय पर नोटिस भेजना आवश्यक है। 📋"
        },
        mr: {
          question: "एका संचालकाने सर्व सदस्यांना अधिकृत नोटीस न पाठवता बोर्डाची बैठक घेण्यास सांगितले. योग्य सल्ला काय असेल?",
          options: [
            "नियम व अटींनुसार सर्व संचालकांना अधिकृत नोटीस पाठवणे बंधनकारक आहे.",
            "बैठक घ्या आणि नोटीस नंतर पाठवा.",
            "सर्व संचालक तोंडी सहमत असल्यास नोटीस देणे टाळा.",
            "संचालकांकडे विशेष अधिकार असल्याने पुढे जा."
          ],
          explanation: "कंपनी सेक्रेटरी मार्गदर्शक तत्त्वांनुसार, कायदेशीररित्या वैध राहण्यासाठी सर्व बोर्ड बैठकांसाठी अधिकृत आणि वेळेवर नोटीस पाठवणे आवश्यक आहे. 📋"
        }
      }
    }
  ],
  submissionsByDate: {},
});

let mockState = createInitialState();

const clone = value => JSON.parse(JSON.stringify(value));

const getTodayKey = () => new Date().toISOString().slice(0, 10);

const getTomorrowMidnightMs = () => {
  const next = new Date();
  next.setHours(24, 0, 0, 0);
  return next.getTime();
};

const getCountdownMs = () => Math.max(getTomorrowMidnightMs() - Date.now(), 0);

const getPreviousDateKey = () => {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toISOString().slice(0, 10);
};

const getSubmissionMapForToday = () => {
  const todayKey = getTodayKey();
  if (!mockState.submissionsByDate[todayKey]) {
    mockState.submissionsByDate[todayKey] = {};
  }
  return mockState.submissionsByDate[todayKey];
};

const notify = () => {
  const snapshot = getRewardsSnapshot();
  subscribers.forEach(listener => listener(snapshot));
};

const simulate = data =>
  new Promise(resolve => {
    setTimeout(() => resolve(clone(data)), MOCK_DELAY_MS);
  });

const getSortedEmployees = () =>
  [...mockState.employees].sort((first, second) => {
    if (second.points !== first.points) {
      return second.points - first.points;
    }
    return second.streak - first.streak;
  });

const getActiveEmployee = () =>
  mockState.employees.find(employee => employee.id === mockState.activeEmployeeId) ||
  mockState.employees[0];

const getTodayQuestions = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1)) / 86400000);
  const startIdx = (dayOfYear * 5) % mockState.quizzes.length;
  const list = [];
  for (let i = 0; i < 5; i++) {
    const qIdx = (startIdx + i) % mockState.quizzes.length;
    list.push(mockState.quizzes[qIdx]);
  }
  return list;
};

const buildQuizState = employeeId => {
  const todaySubmissions = getSubmissionMapForToday();
  const employee = mockState.employees.find(item => item.id === employeeId);
  const employeeSubmissions = todaySubmissions[employeeId] || [];
  
  const todayQuizzes = getTodayQuestions();
  const isLocked = employeeSubmissions.length === 5;
  const activeIdx = isLocked ? 4 : employeeSubmissions.length;
  const activeQuiz = todayQuizzes[activeIdx];
  const lastSubmission = employeeSubmissions.length > 0 ? employeeSubmissions[employeeSubmissions.length - 1] : null;

  return {
    employee,
    questions: clone(todayQuizzes),
    submissions: clone(employeeSubmissions),
    currentQuestionIndex: isLocked ? 5 : employeeSubmissions.length,

    // Compatibility keys
    question: clone(activeQuiz),
    submission: clone(lastSubmission),
    isLocked,
    countdownMs: getCountdownMs(),
  };
};

function getRewardsSnapshot() {
  const activeEmployee = getActiveEmployee();
  return {
    activeEmployeeId: mockState.activeEmployeeId,
    activeEmployee: clone(activeEmployee),
    employees: clone(mockState.employees),
    leaderboard: clone(getSortedEmployees()),
    rewards: clone(mockState.rewards),
    quiz: buildQuizState(activeEmployee.id),
  };
}

function subscribeToRewardsUpdates(listener) {
  subscribers.add(listener);
  return () => {
    subscribers.delete(listener);
  };
}

function setActiveEmployee(employeeId) {
  if (USE_MOCK) {
    const employee = mockState.employees.find(item => item.id === employeeId);
    if (!employee) {
      return Promise.reject(new Error('Employee not found.'));
    }

    mockState.activeEmployeeId = employeeId;
    notify();
    return simulate(getRewardsSnapshot());
  }

  return fetch(`${API_BASE_URL}/daily-challenge/active-employee`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId }),
  }).then(response => response.json());
}

function initializeActiveEmployeeByName(name) {
  if (!name) {
    return getRewardsSnapshot();
  }

  const match = mockState.employees.find(
    employee => employee.name.toLowerCase() === String(name).trim().toLowerCase(),
  );

  if (match && match.id !== mockState.activeEmployeeId) {
    mockState.activeEmployeeId = match.id;
    notify();
  }

  return getRewardsSnapshot();
}

function getDailyQuizState(employeeId = mockState.activeEmployeeId) {
  if (USE_MOCK) {
    return simulate(buildQuizState(employeeId));
  }

  return fetch(`${API_BASE_URL}/daily-challenge/quiz?employeeId=${employeeId}`)
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .catch(error => {
      console.warn("getDailyQuizState failed, falling back to mock:", error.message);
      return simulate(buildQuizState(employeeId));
    });
}

function submitDailyQuiz(answerIndex, employeeId = mockState.activeEmployeeId, questionId = null) {
  if (USE_MOCK) {
    const employee = mockState.employees.find(item => item.id === employeeId);
    if (!employee) {
      return Promise.reject(new Error('Employee not found.'));
    }

    const todayQuizzes = getTodayQuestions();
    let targetQuiz = null;
    if (questionId) {
      targetQuiz = todayQuizzes.find(q => q.id === questionId);
    } else {
      const employeeSubmissions = getSubmissionMapForToday()[employeeId] || [];
      targetQuiz = todayQuizzes[employeeSubmissions.length];
    }

    if (!targetQuiz) {
      return Promise.reject(new Error('Invalid question or challenge completed.'));
    }

    const todaySubmissions = getSubmissionMapForToday();
    if (!todaySubmissions[employeeId]) {
      todaySubmissions[employeeId] = [];
    }

    const isAlreadyAnswered = todaySubmissions[employeeId].some(s => s.questionId === targetQuiz.id);
    if (isAlreadyAnswered) {
      return Promise.reject(new Error('This question has already been answered.'));
    }

    const isCorrect = answerIndex === targetQuiz.correctIndex;
    const previousDateKey = getPreviousDateKey();
    const hasAlreadyAnsweredToday = todaySubmissions[employeeId].length > 0;

    if (!hasAlreadyAnsweredToday) {
      if (employee.lastQuizDate === previousDateKey) {
        employee.streak += 1;
      } else if (employee.lastQuizDate !== getTodayKey()) {
        employee.streak = 1;
      }
    }

    const pointsAwarded = isCorrect ? targetQuiz.rewardPoints : 0;
    employee.points += pointsAwarded;
    employee.lastQuizDate = getTodayKey();

    const submissionObj = {
      questionId: targetQuiz.id,
      answerIndex,
      isCorrect,
      submittedAt: new Date().toISOString(),
      pointsAwarded,
    };

    todaySubmissions[employeeId].push(submissionObj);

    notify();
    return simulate({
      employee: clone(employee),
      submission: clone(submissionObj),
      leaderboard: clone(getSortedEmployees()),
      countdownMs: getCountdownMs(),
    });
  }

  return fetch(`${API_BASE_URL}/daily-challenge/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, answerIndex, questionId }),
  })
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .catch(error => {
      console.warn("submitDailyQuiz failed, falling back to mock:", error.message);
      // Mock fallback submission update
      const employee = mockState.employees.find(item => item.id === employeeId) || mockState.employees[0];
      const todayQuizzes = getTodayQuestions();
      const todaySubmissions = getSubmissionMapForToday();
      
      let targetQuiz = null;
      if (questionId) {
        targetQuiz = todayQuizzes.find(q => q.id === questionId);
      } else {
        const employeeSubmissions = todaySubmissions[employeeId] || [];
        targetQuiz = todayQuizzes[employeeSubmissions.length];
      }

      if (targetQuiz) {
        if (!todaySubmissions[employeeId]) {
          todaySubmissions[employeeId] = [];
        }
        
        const isAlreadyAnswered = todaySubmissions[employeeId].some(s => s.questionId === targetQuiz.id);
        if (!isAlreadyAnswered) {
          const isCorrect = answerIndex === targetQuiz.correctIndex;
          const pointsAwarded = isCorrect ? targetQuiz.rewardPoints : 0;
          employee.points += pointsAwarded;
          employee.lastQuizDate = getTodayKey();
          
          const submissionObj = {
            questionId: targetQuiz.id,
            answerIndex,
            isCorrect,
            submittedAt: new Date().toISOString(),
            pointsAwarded,
          };
          todaySubmissions[employeeId].push(submissionObj);
          notify();
        }
      }

      return simulate({
        employee: clone(employee),
        submission: todaySubmissions[employeeId] ? clone(todaySubmissions[employeeId][todaySubmissions[employeeId].length - 1]) : null,
        leaderboard: clone(getSortedEmployees()),
        countdownMs: getCountdownMs(),
      });
    });
}

function getLeaderboard() {
  if (USE_MOCK) {
    return simulate(getSortedEmployees());
  }

  return fetch(`${API_BASE_URL}/daily-challenge/leaderboard`)
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .catch(error => {
      console.warn("getLeaderboard failed, falling back to mock:", error.message);
      return simulate(getSortedEmployees());
    });
}

function getRewardsCatalog() {
  if (USE_MOCK) {
    return simulate(mockState.rewards);
  }

  return fetch(`${API_BASE_URL}/daily-challenge/rewards`)
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .catch(error => {
      console.warn("getRewardsCatalog failed, falling back to mock:", error.message);
      return simulate(mockState.rewards);
    });
}

function redeemReward(rewardId, employeeId = mockState.activeEmployeeId) {
  if (USE_MOCK) {
    const employee = mockState.employees.find(item => item.id === employeeId);
    const reward = mockState.rewards.find(item => item.id === rewardId);

    if (!employee || !reward) {
      return Promise.reject(new Error('Unable to redeem this reward.'));
    }

    if (reward.stock <= 0) {
      return Promise.reject(new Error('This reward is out of stock.'));
    }

    if (employee.points < reward.cost) {
      return Promise.reject(new Error('Not enough points to redeem this reward.'));
    }

    employee.points -= reward.cost;
    reward.stock -= 1;

    notify();
    return simulate({
      employee: clone(employee),
      reward: clone(reward),
      leaderboard: clone(getSortedEmployees()),
    });
  }

  return fetch(`${API_BASE_URL}/daily-challenge/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, rewardId }),
  })
    .then(response => {
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return response.json();
    })
    .catch(error => {
      console.warn("redeemReward failed, falling back to mock:", error.message);
      const employee = mockState.employees.find(item => item.id === employeeId) || mockState.employees[0];
      const reward = mockState.rewards.find(item => item.id === rewardId);
      if (reward && reward.stock > 0 && employee.points >= reward.cost) {
        employee.points -= reward.cost;
        reward.stock -= 1;
        notify();
      }
      return simulate({
        employee: clone(employee),
        reward: clone(reward),
        leaderboard: clone(getSortedEmployees()),
      });
    });
}

function resetMockRewardsData() {
  mockState = createInitialState();
  notify();
  return getRewardsSnapshot();
}

async function fetchRewardsSnapshot(employeeId = mockState.activeEmployeeId) {
  if (USE_MOCK) {
    return Promise.resolve(getRewardsSnapshot());
  }

  try {
    const [employeeQuizState, leaderboard, rewards] = await Promise.all([
      getDailyQuizState(employeeId),
      getLeaderboard(),
      getRewardsCatalog()
    ]);

    return {
      activeEmployeeId: employeeQuizState.employee.id,
      activeEmployee: employeeQuizState.employee,
      employees: leaderboard,
      leaderboard: leaderboard,
      rewards: rewards,
      quiz: employeeQuizState
    };
  } catch (error) {
    console.error("Error fetching remote snapshot:", error);
    return getRewardsSnapshot();
  }
}

export const api = {
  getLeaderboard,
  getRewardsCatalog,
  redeemReward,
  getDailyQuizState,
  submitDailyQuiz,
  fetchRewardsSnapshot,
};

export {
  API_BASE_URL,
  USE_MOCK,
  getRewardsSnapshot,
  subscribeToRewardsUpdates,
  setActiveEmployee,
  initializeActiveEmployeeByName,
  getDailyQuizState,
  submitDailyQuiz,
  getLeaderboard,
  getRewardsCatalog,
  redeemReward,
  resetMockRewardsData,
  fetchRewardsSnapshot,
};
