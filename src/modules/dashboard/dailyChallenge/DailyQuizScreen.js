// src/screens/DailyQuizScreen.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  ScrollView,
} from 'react-native';
import { getDailyQuizState, submitDailyQuiz } from '../../../services/api';

const formatCountdown = countdownMs => {
  const totalSeconds = Math.max(Math.floor(countdownMs / 1000), 0);
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

const getFunnyLabel = lang => {
  if (lang === 'hi') return '😜 मजाकिया';
  if (lang === 'mr') return '😜 मजेशीर';
  return '😜 Funny';
};

const SASSY_CORRECT = [
  "Boom! You absolute wizard. Go ahead, take a 2-hour coffee break, you've earned it! 🧙‍♂️",
  "Ding ding ding! Correct! Your salary remains the same, but hey, digital coins! 🪙",
  "Correct! Did you copy-paste that off StackOverflow or do you actually know what you're doing? 🧐",
  "Right on the money! Your brain is clearly in a production-ready state today! 🧠",
  "Genius! We should frame this answer and hang it in the corporate breakroom. 🖼️"
];

const SASSY_INCORRECT = [
  "Yikes! Even ChatGPT would refuse to compile that code. 🤖",
  "Incorrect! Somewhere, a senior developer just sighed and ordered a double espresso. ☕",
  "Oh honey, no. Did you write this with your eyes closed? 🙈",
  "Oops! Your answer is as stable as a production build deployed at 4:59 PM on a Friday. 🌪️",
  "Wrong! But don't worry, we won't tell your manager. (Unless they pay us). 🤫"
];

export default function DailyQuizScreen({ activeEmployee, initialQuizState, onDataChange }) {
  const [quizState, setQuizState] = useState(initialQuizState);
  const [currentViewStep, setCurrentViewStep] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [countdownMs, setCountdownMs] = useState(initialQuizState?.countdownMs || 0);
  const [sassMode, setSassMode] = useState(true);
  const [quizLanguage, setQuizLanguage] = useState('en'); // 'en', 'hi', 'mr'

  const bounceScale = useRef(new Animated.Value(1)).current;
  const shakeX = useRef(new Animated.Value(0)).current;

  // Sync state with initial state changes
  useEffect(() => {
    if (initialQuizState) {
      setQuizState(initialQuizState);
      setCountdownMs(initialQuizState.countdownMs);
      
      const subsCount = initialQuizState.submissions ? initialQuizState.submissions.length : 0;
      const nextUnanswered = subsCount === 5 ? 4 : subsCount;
      setCurrentViewStep(nextUnanswered);
      
      const existingSub = initialQuizState.submissions ? initialQuizState.submissions[nextUnanswered] : null;
      setSelectedIndex(existingSub ? existingSub.answerIndex : null);
    }
  }, [initialQuizState]);

  // Adjust selection when current viewed step changes
  useEffect(() => {
    if (quizState?.submissions) {
      const existingSub = quizState.submissions[currentViewStep];
      setSelectedIndex(existingSub ? existingSub.answerIndex : null);
    } else {
      setSelectedIndex(null);
    }
  }, [currentViewStep, quizState]);

  // Countdown timer ticking logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownMs(prev => Math.max(prev - 1000, 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCorrectAnimation = () => {
    bounceScale.setValue(1);
    Animated.sequence([
      Animated.spring(bounceScale, {
        toValue: 1.05,
        useNativeDriver: true,
        friction: 4,
        tension: 120,
      }),
      Animated.spring(bounceScale, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 110,
      }),
    ]).start();
  };

  const handleIncorrectAnimation = () => {
    Vibration.vibrate(80);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -10, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 10, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  };

  // Get active question details based on currently viewed step
  const activeQuestion = useMemo(() => {
    if (!quizState?.questions || quizState.questions.length === 0) return null;
    return quizState.questions[currentViewStep];
  }, [quizState, currentViewStep]);

  // Check if viewed step is already submitted
  const activeSubmission = useMemo(() => {
    if (!quizState?.submissions || !activeQuestion) return null;
    return quizState.submissions.find(s => s.questionId === activeQuestion.id) || null;
  }, [quizState, activeQuestion]);

  const handleSubmit = async () => {
    if (selectedIndex === null || submitting || activeSubmission || !activeQuestion) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await submitDailyQuiz(selectedIndex, activeEmployee.id, activeQuestion.id);
      const refreshedQuizState = await getDailyQuizState(activeEmployee.id);

      const isCorrect = selectedIndex === activeQuestion.correctIndex;
      if (isCorrect) {
        handleCorrectAnimation();
      } else {
        handleIncorrectAnimation();
      }

      setQuizState(refreshedQuizState);
      setCountdownMs(refreshedQuizState.countdownMs);
      onDataChange?.();
    } catch (error) {
      console.warn("Submit failed:", error);
    } finally {
      setSubmitting(false);
    }
  };

  // Sassy comments generator
  const sassyComment = useMemo(() => {
    if (!activeSubmission || !activeQuestion) return null;
    const list = activeSubmission.isCorrect ? SASSY_CORRECT : SASSY_INCORRECT;
    const numericId = parseInt(String(activeQuestion.id).replace(/\D/g, ''), 10) || 1;
    const index = numericId % list.length;
    return list[index];
  }, [activeSubmission, activeQuestion]);

  // Translate active question details
  const activeQuizText = useMemo(() => {
    if (!activeQuestion) return null;

    const translations = activeQuestion.translations;
    if (translations && translations[quizLanguage]) {
      return translations[quizLanguage];
    }

    return {
      question: activeQuestion.question,
      options: activeQuestion.options,
      explanation: activeQuestion.explanation
    };
  }, [activeQuestion, quizLanguage]);

  // Calculate score stats for today
  const scoreStats = useMemo(() => {
    if (!quizState?.submissions) return { score: 0, points: 0 };
    const correctCount = quizState.submissions.filter(s => s.isCorrect).length;
    const pointsSum = quizState.submissions.reduce((acc, curr) => acc + (curr.pointsAwarded || 0), 0);
    return { score: correctCount, points: pointsSum };
  }, [quizState]);

  if (!quizState || !quizState.questions || quizState.questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading challenges...</Text>
      </View>
    );
  }

  const totalSubmissions = quizState.submissions ? quizState.submissions.length : 0;
  const isChallengeFullyCompleted = totalSubmissions === 5;

  // 1. Completion Celebration Screen Redesign
  if (isChallengeFullyCompleted && currentViewStep === 4 && activeSubmission) {
    return (
      <View style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 85 }}>
          {/* Header Row */}
          <View style={styles.topMetaRow}>
            <View style={styles.eyebrowBadge}>
              <Text style={styles.eyebrowText}>DAILY CHALLENGE COMPLETION</Text>
            </View>
          </View>

          {/* Glowing Circular Level Dashboard */}
          <View style={styles.celebrationCard}>
            <View style={styles.glowingOuterRing}>
              <View style={styles.scoreDialContainer}>
                <Text style={styles.scoreHugeText}>{scoreStats.score}</Text>
                <Text style={styles.scoreMaxLabel}>/ 5 CORRECT</Text>
              </View>
            </View>

            <Text style={styles.congratsTitle}>Outstanding Performance! ⚡</Text>
            <Text style={styles.congratsSubtitle}>
              You have successfully completed today's daily knowledge challenges.
            </Text>

            {/* Streak & Points display */}
            <View style={styles.statsCardGrid}>
              <View style={styles.statGlassCard}>
                <Text style={styles.statCardLabel}>TOTAL SCORE</Text>
                <Text style={styles.statCardVal}>+{scoreStats.points} PTS</Text>
              </View>
              <View style={styles.statGlassCard}>
                <Text style={styles.statCardLabel}>STREAK MULTIPLIER</Text>
                <Text style={styles.statCardVal}>🔥 {activeEmployee.streak} Days</Text>
              </View>
            </View>

            <View style={styles.countdownGlassBox}>
              <Text style={styles.countdownGlassLabel}>Next Quiz Unlocks In</Text>
              <Text style={styles.countdownGlassTime}>{formatCountdown(countdownMs)}</Text>
            </View>

            {/* 5-Step Journey Navigation (Review Mode) */}
            <Text style={styles.reviewTrackHeading}>REVIEW TODAY'S SCENARIOS</Text>
            <View style={styles.journeyWrapper}>
              <View style={styles.journeyTrackLine} />
              <View style={styles.journeyStepsRow}>
                {quizState.questions.map((q, idx) => {
                  const sub = quizState.submissions[idx];
                  const isCorrect = sub ? sub.isCorrect : false;
                  return (
                    <TouchableOpacity
                      key={q.id}
                      activeOpacity={0.8}
                      style={[
                        styles.journeyNodeCircle,
                        sub && (isCorrect ? styles.journeyNodeCorrect : styles.journeyNodeIncorrect),
                      ]}
                      onPress={() => setCurrentViewStep(idx)}
                    >
                      <Text style={styles.journeyNodeText}>{isCorrect ? '✓' : '✗'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    );
  }

  // 2. Main 5-Question Quiz Screen Redesign
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ scale: bounceScale }, { translateX: shakeX }],
        },
      ]}
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 85 }}>
        {/* Header Metadata */}
        <View style={styles.topMetaRow}>
          <View style={styles.eyebrowBadge}>
            <Text style={styles.eyebrowText}>CHALLENGE {currentViewStep + 1} OF 5</Text>
          </View>
          <View style={styles.sassToggleMiniRow}>
            <Text style={styles.sassToggleLabel}>{getFunnyLabel(quizLanguage)}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.sassToggleBtn, sassMode ? styles.sassToggleBtnActive : styles.sassToggleBtnInactive]}
              onPress={() => setSassMode(!sassMode)}
            >
              <Text style={styles.sassToggleBtnText}>{sassMode ? 'ON' : 'OFF'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 5-Step Journey Navigation Map */}
        <View style={styles.journeyWrapper}>
          <View style={styles.journeyTrackLine} />
          <View style={styles.journeyStepsRow}>
            {quizState.questions.map((q, idx) => {
              const sub = quizState.submissions[idx];
              const isCorrect = sub ? sub.isCorrect : false;
              const isCurrent = currentViewStep === idx;
              const isUpcoming = idx > totalSubmissions;

              return (
                <TouchableOpacity
                  key={q.id}
                  activeOpacity={0.8}
                  disabled={isUpcoming}
                  style={[
                    styles.journeyNodeCircle,
                    sub && (isCorrect ? styles.journeyNodeCorrect : styles.journeyNodeIncorrect),
                    isCurrent && styles.journeyNodeCurrent,
                    isUpcoming && styles.journeyNodeUpcoming,
                  ]}
                  onPress={() => setCurrentViewStep(idx)}
                >
                  <Text style={styles.journeyNodeText}>
                    {sub ? (isCorrect ? '✓' : '✗') : idx + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Language Selector Row */}
        <View style={styles.langContainerRow}>
          <Text style={styles.langLabelText}>🌐 Language:</Text>
          <View style={styles.langSelectorRow}>
            {['en', 'hi', 'mr'].map(lang => (
              <TouchableOpacity
                key={lang}
                style={[styles.langBadge, quizLanguage === lang && styles.langBadgeActive]}
                onPress={() => setQuizLanguage(lang)}
              >
                <Text style={[styles.langBadgeText, quizLanguage === lang && styles.langBadgeTextActive]}>
                  {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Interactive Domain Question Card */}
        {activeQuestion && activeQuizText && (
          <View style={styles.quizInnerCard}>
            {/* Domain & Point Badge Row */}
            <View style={styles.cardHeaderRow}>
              <View style={styles.domainBadge}>
                <Text style={styles.domainBadgeText}>📂 {activeQuestion.domain}</Text>
              </View>
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsBadgeText}>💎 +{activeQuestion.rewardPoints} PTS</Text>
              </View>
            </View>

            {/* Question Text */}
            <Text style={styles.questionText}>{activeQuizText.question}</Text>

            {/* Translucent Glass Option list */}
            <View style={styles.optionsList}>
              {activeQuizText.options.map((option, index) => {
                const isSelected = selectedIndex === index;
                const isSubmitted = Boolean(activeSubmission);
                const isCorrect = activeQuestion.correctIndex === index;
                const isWrongSelection =
                  isSubmitted && activeSubmission.answerIndex === index && !activeSubmission.isCorrect;

                const letter = String.fromCharCode(65 + index);

                return (
                  <TouchableOpacity
                    key={option}
                    activeOpacity={0.88}
                    style={[
                      styles.optionCard,
                      isSelected && styles.optionCardSelected,
                      isSubmitted && isCorrect && styles.optionCardCorrect,
                      isWrongSelection && styles.optionCardWrong,
                    ]}
                    disabled={isSubmitted}
                    onPress={() => {
                      if (selectedIndex === index) {
                        setSelectedIndex(null);
                      } else {
                        setSelectedIndex(index);
                      }
                    }}
                  >
                    {/* Left Letter Badge */}
                    <View style={[
                      styles.optionLetterBadge,
                      isSelected && styles.optionLetterBadgeSelected,
                      isSubmitted && isCorrect && styles.optionLetterBadgeCorrect,
                      isWrongSelection && styles.optionLetterBadgeWrong,
                    ]}>
                      <Text style={[
                        styles.optionLetterText,
                        isSelected && styles.optionLetterTextSelected,
                      ]}>{letter}</Text>
                    </View>

                    {/* Option Text */}
                    <Text style={[
                      styles.optionText,
                      isSelected && styles.optionTextSelected,
                      isSubmitted && isCorrect && styles.optionTextCorrect,
                      isWrongSelection && styles.optionTextWrong,
                    ]}>
                      {option}
                    </Text>

                    {/* Right Radio Indicator */}
                    <View style={[
                      styles.radioCircle,
                      isSelected && styles.radioCircleSelected,
                      isSubmitted && isCorrect && styles.radioCircleCorrect,
                      isWrongSelection && styles.radioCircleWrong,
                    ]}>
                      {isSelected && !isSubmitted && <View style={styles.radioInnerDot} />}
                      {isSubmitted && isCorrect && <Text style={styles.radioInnerCheck}>✓</Text>}
                      {isWrongSelection && <Text style={styles.radioInnerCross}>✗</Text>}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Submit Button */}
        {!activeSubmission && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.submitButton,
              selectedIndex === null && styles.submitButtonDisabled,
            ]}
            disabled={selectedIndex === null || submitting}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              {submitting ? 'COMPILE IN PROGRESS...' : 'SUBMIT ANSWER ⚡'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Explanations & Next Steps */}
        {activeSubmission && (
          <View style={styles.explanationSection}>
            <View
              style={[
                styles.resultBanner,
                activeSubmission.isCorrect ? styles.correctBanner : styles.incorrectBanner,
              ]}
            >
              <Text style={styles.resultBannerText}>
                {sassMode && sassyComment ? sassyComment : activeSubmission.isCorrect ? 'Correct!' : 'Incorrect.'}
              </Text>
            </View>

            <Text style={styles.explanationHeading}>Why this matters</Text>
            <View style={styles.explanationCodeBox}>
              <View style={styles.explanationCodeHeader}>
                <View style={styles.explanationCodeDotRed} />
                <View style={styles.explanationCodeDotYellow} />
                <View style={styles.explanationCodeDotGreen} />
                <Text style={styles.explanationCodeTitle}>compiler_output.log</Text>
              </View>
              <Text style={styles.explanationCodeText}>{activeQuizText.explanation}</Text>
            </View>

            {/* Next Question Navigation */}
            <TouchableOpacity
              activeOpacity={0.9}
              style={styles.nextStepButton}
              onPress={() => {
                if (currentViewStep < 4) {
                  setCurrentViewStep(prev => prev + 1);
                } else if (totalSubmissions === 5) {
                  setCurrentViewStep(4);
                }
              }}
            >
              <Text style={styles.nextStepButtonText}>
                {currentViewStep < 4 ? 'NEXT CHALLENGE ➡️' : 'VIEW COMPLETION REPORT 🏆'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 16,
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  eyebrowBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  eyebrowText: {
    fontFamily: 'System',
    fontSize: 9,
    fontWeight: '900',
    color: '#a78bfa',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  sassToggleMiniRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sassToggleLabel: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  sassToggleBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sassToggleBtnActive: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },
  sassToggleBtnInactive: {
    borderColor: 'rgba(255, 255, 255, 0.15)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  sassToggleBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  journeyWrapper: {
    marginVertical: 18,
    paddingHorizontal: 8,
    justifyContent: 'center',
    position: 'relative',
  },
  journeyTrackLine: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1,
  },
  journeyStepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  journeyNodeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1b0e3d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a78bfa',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  journeyNodeCurrent: {
    borderColor: '#ffffff',
    backgroundColor: '#4c1d95',
    transform: [{ scale: 1.15 }],
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  journeyNodeUpcoming: {
    backgroundColor: '#0c0722',
    borderColor: 'rgba(255, 255, 255, 0.05)',
    opacity: 0.5,
  },
  journeyNodeCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
    shadowColor: '#10b981',
  },
  journeyNodeIncorrect: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  journeyNodeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  langContainerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  langLabelText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    fontWeight: '700',
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 6,
  },
  langBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  langBadgeActive: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.15)',
  },
  langBadgeText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '700',
  },
  langBadgeTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  quizInnerCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 18,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  domainBadge: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  domainBadgeText: {
    color: '#c084fc',
    fontSize: 11,
    fontWeight: '800',
  },
  pointsBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  pointsBadgeText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '800',
  },
  questionText: {
    fontFamily: 'System',
    fontSize: 19,
    lineHeight: 25,
    color: '#ffffff',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsList: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  optionCardSelected: {
    borderColor: '#a78bfa',
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
  },
  optionCardCorrect: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionCardWrong: {
    borderColor: '#ef4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  optionLetterBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetterBadgeSelected: {
    backgroundColor: '#a78bfa',
  },
  optionLetterBadgeCorrect: {
    backgroundColor: '#10b981',
  },
  optionLetterBadgeWrong: {
    backgroundColor: '#ef4444',
  },
  optionLetterText: {
    fontFamily: 'System',
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  optionLetterTextSelected: {
    color: '#12072e',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'transparent',
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: '#a78bfa',
  },
  radioCircleCorrect: {
    borderColor: '#10b981',
  },
  radioCircleWrong: {
    borderColor: '#ef4444',
  },
  radioInnerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#a78bfa',
  },
  radioInnerCheck: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
  },
  radioInnerCross: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '900',
  },
  optionText: {
    fontFamily: 'System',
    fontSize: 14.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 19,
    fontWeight: '600',
    flex: 1,
  },
  optionTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  optionTextCorrect: {
    color: '#10b981',
    fontWeight: '700',
  },
  optionTextWrong: {
    color: '#ef4444',
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  submitButtonText: {
    color: '#12072e',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  explanationSection: {
    marginTop: 10,
  },
  resultBanner: {
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
  },
  correctBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  incorrectBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  resultBannerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  explanationHeading: {
    fontFamily: 'System',
    fontSize: 14,
    fontWeight: '800',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 6,
  },
  explanationCodeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  explanationCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 6,
    marginBottom: 8,
  },
  explanationCodeDotRed: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  explanationCodeDotYellow: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginRight: 4,
  },
  explanationCodeDotGreen: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 8,
  },
  explanationCodeTitle: {
    fontSize: 10,
    fontFamily: 'System',
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
  },
  explanationCodeText: {
    fontFamily: 'System',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 18,
  },
  nextStepButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  nextStepButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  celebrationCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 24,
    alignItems: 'center',
    marginTop: 10,
  },
  glowingOuterRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#a78bfa',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(167, 139, 250, 0.05)',
    shadowColor: '#a78bfa',
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    marginBottom: 20,
  },
  scoreDialContainer: {
    alignItems: 'center',
  },
  scoreHugeText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 52,
  },
  scoreMaxLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#a78bfa',
    letterSpacing: 0.5,
  },
  congratsTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  congratsSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  statsCardGrid: {
    flexDirection: 'row',
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  statGlassCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statCardLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '900',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statCardVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  countdownGlassBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    marginBottom: 24,
  },
  countdownGlassLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '900',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  countdownGlassTime: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
  },
  reviewTrackHeading: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '900',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
});