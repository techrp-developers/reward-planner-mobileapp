import React, { useCallback, useState } from 'react';
import { BackHandler, Image, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { quizLeaderboard, quizQuestions } from '../data/quizPreview';

type Page = 'leaderboard' | 'question' | 'result';
const facts = [
  { icon: 'clipboard-list', title: '5 Questions', text: 'Each quiz has\n5 exciting questions.', color: '#368BFF' },
  { icon: 'timer-outline', title: 'Time Limit', text: 'You have only\n15 seconds per question.', color: '#27D7A0' },
  { icon: 'gift', title: '2 Rewards Each', text: 'Earn 2 rewards for\nevery correct answer.', color: '#BB65F4' },
];

export default function QuizScreen() {
  const navigation = useNavigation();
  const [page, setPage] = useState<Page>('leaderboard');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [retried, setRetried] = useState(false);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const question = quizQuestions[questionIndex];
  const correct = selected === question.correctIndex;
  const wrong = selected !== null && !correct;

  const goBack = useCallback(() => {
    if (page !== 'leaderboard') setPage('leaderboard');
    else navigation.goBack();
  }, [navigation, page]);

  useFocusEffect(useCallback(() => {
    const listener = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => listener.remove();
  }, [goBack]));

  const start = () => {
    setQuestionIndex(0);
    setSelected(null);
    setRetried(false);
    setFirstTryScore(0);
    setPage('question');
  };

  const advance = () => {
    if (selected === null) return;
    if (wrong) {
      setRetried(true);
      setSelected(null);
      return;
    }
    if (!retried) setFirstTryScore(score => score + 1);
    if (questionIndex === quizQuestions.length - 1) setPage('result');
    else {
      setQuestionIndex(index => index + 1);
      setSelected(null);
      setRetried(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#080B13" />
      {page === 'leaderboard' ? (
        <ScrollView contentContainerStyle={styles.landing} showsVerticalScrollIndicator={false}>
          <View style={styles.brandRow}>
            <Text style={styles.brand}>Quivio <Text style={styles.gold}>🏆</Text></Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close quiz" onPress={goBack} style={styles.touchTarget}><Text style={styles.skip}>Skip</Text></Pressable>
          </View>
          <View style={styles.hero}>
            <Image source={require('../assets/quiz-host.png')} style={styles.host} resizeMode="contain" accessibilityLabel="Quivio host in a purple suit" />
            <View style={styles.facts}>
              {facts.map(fact => (
                <LinearGradient key={fact.title} colors={['#101B35', '#060B17']} style={[styles.fact, { borderColor: fact.color }]}>
                  <Icon name={fact.icon} size={38} color={fact.color} />
                  <View style={styles.factCopy}>
                    <Text style={styles.factTitle}>{fact.title}</Text>
                    <Text style={styles.factText}>{fact.text}</Text>
                  </View>
                </LinearGradient>
              ))}
            </View>
          </View>
          <LinearGradient colors={['#071A32', '#030812']} style={styles.arena}>
            <View style={styles.trophy}><Icon name="trophy" size={40} color="#FFCB42" /></View>
            <Text style={styles.playTitle}>Play Smart Quiz Every Day</Text>
            <Text style={styles.tagline}>Boost knowledge daily, win challenges,{ '\n' }become smarter every day.</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Start sample quiz" onPress={start} style={styles.startWrap}>
              <LinearGradient colors={['#FFE363', '#FFB800', '#FF9C00']} style={styles.start}>
                <Text style={styles.startText}>Start</Text><Icon name="play-outline" size={25} color="#121212" />
              </LinearGradient>
            </Pressable>
            <View style={styles.leaderboard}>
              <Text accessibilityRole="header" style={styles.leaderTitle}>Leaderboard 🏆</Text>
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableHeading, styles.rank]}>Rank</Text>
                  <Text style={[styles.tableHeading, styles.player]}>Player</Text>
                  <Text style={[styles.tableHeading, styles.score]}>Score</Text>
                </View>
                {quizLeaderboard.map((player, index) => (
                  <View key={player.name} style={styles.tableRow}>
                    <View style={styles.rank}>
                      {index < 3 ? <Icon name="medal" size={25} color={['#FFD253', '#CBD4E0', '#D98A48'][index]} /> : <Text style={styles.cell}>4</Text>}
                    </View>
                    <View style={[styles.player, styles.playerRow]}>
                      <View style={[styles.avatar, { backgroundColor: player.color }]}><Text style={styles.initial}>{player.name[0]}</Text></View>
                      <Text style={styles.cell}>{player.name}</Text>
                    </View>
                    <Text style={[styles.cell, styles.score]}>{player.score}</Text>
                  </View>
                ))}
              </View>
            </View>
            <Text style={styles.previewNote}>Preview · Sample rankings and rewards</Text>
          </LinearGradient>
        </ScrollView>
      ) : page === 'question' ? (
        <ScrollView key={questionIndex} contentContainerStyle={styles.questionPage} showsVerticalScrollIndicator={false}>
          <View style={styles.questionHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back to leaderboard" onPress={goBack} style={styles.back}><Icon name="chevron-left" color="#FFFFFF" size={28} /></Pressable>
            <Text accessibilityRole="header" style={styles.questionCount}>Question {questionIndex + 1} of {quizQuestions.length}</Text>
          </View>
          <View style={styles.progress} accessibilityLabel={`Question ${questionIndex + 1} of ${quizQuestions.length}`}>
            {quizQuestions.map((_, index) => <View key={index} style={[styles.segment, index <= questionIndex && styles.segmentActive]} />)}
          </View>
          <View style={styles.timerSpace}>
            <View style={styles.timer} accessibilityLabel="15 seconds, static preview">
              <Text style={styles.timerValue}>00:15</Text><Text style={styles.seconds}>Seconds</Text>
            </View>
          </View>
          <Text accessibilityRole="header" style={styles.question}>{question.question}</Text>
          <View style={styles.options}>
            {question.options.map((option, index) => {
              const isSelected = selected === index;
              const stateStyle = isSelected ? (correct ? styles.correct : styles.incorrect) : undefined;
              const textStyle = isSelected ? (correct ? styles.correctText : styles.incorrectText) : undefined;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="button"
                  accessibilityLabel={`${String.fromCharCode(65 + index)}. ${option}${isSelected ? (correct ? ', correct' : ', incorrect') : ''}`}
                  accessibilityState={{ selected: isSelected, disabled: selected !== null }}
                  disabled={selected !== null}
                  onPress={() => setSelected(index)}
                  style={[styles.option, stateStyle]}
                >
                  <View style={[styles.letterCircle, isSelected && stateStyle]}><Text style={[styles.letter, textStyle]}>{String.fromCharCode(65 + index)}</Text></View>
                  <Text style={[styles.optionText, textStyle]}>{option}</Text>
                  {isSelected && <Icon name={correct ? 'check' : 'close'} size={21} color={correct ? '#40D335' : '#FF343F'} />}
                </Pressable>
              );
            })}
          </View>
          <Text accessibilityLiveRegion="polite" style={styles.feedback}>{selected === null ? ' ' : correct ? 'Correct! Well done.' : 'Not quite. Give it another try.'}</Text>
          <Pressable accessibilityRole="button" accessibilityState={{ disabled: selected === null }} disabled={selected === null} onPress={advance} style={[styles.action, selected === null && styles.disabledAction, wrong && styles.retryAction]}>
            <Text style={styles.actionText}>{wrong ? 'Try Again' : questionIndex === quizQuestions.length - 1 ? 'Finish' : 'Continue'}</Text>
          </Pressable>
        </ScrollView>
      ) : (
        <View style={styles.result}>
          <Icon name="trophy" size={88} color="#FFCB42" />
          <Text accessibilityRole="header" style={styles.resultTitle}>Quiz complete!</Text>
          <Text style={styles.resultScore}>{firstTryScore} / {quizQuestions.length}</Text>
          <Text style={styles.resultCopy}>Correct on your first try.{'\n'}Keep playing, keep learning.</Text>
          <Text style={styles.previewNote}>Practice round · No rewards credited</Text>
          <Pressable accessibilityRole="button" onPress={start} style={styles.action}><Text style={styles.actionText}>Play Again</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={goBack} style={styles.touchTarget}><Text style={styles.skip}>Back to Leaderboard</Text></Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#080B13' },
  landing: { paddingHorizontal: 20, paddingBottom: 20, maxWidth: 540, width: '100%', alignSelf: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#FFFFFF', fontSize: 23, fontWeight: '700' },
  gold: { color: '#FFCB42' },
  touchTarget: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  skip: { color: '#EDEEF4', fontSize: 14 },
  hero: { flexDirection: 'row', height: 294, marginHorizontal: -10 },
  host: { width: '44%', height: '112%', zIndex: 1 },
  facts: { flex: 1, gap: 9, paddingTop: 12, paddingRight: 10, paddingBottom: 16 },
  fact: { flex: 1, borderWidth: 1, borderRadius: 16, flexDirection: 'row', alignItems: 'center', padding: 10, gap: 8 },
  factCopy: { flex: 1 },
  factTitle: { color: '#FFFFFF', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  factText: { color: '#CDD5E4', fontSize: 10, lineHeight: 15 },
  arena: { borderWidth: 1, borderColor: '#168BFF', borderRadius: 28, padding: 9, paddingTop: 30, shadowColor: '#008CFF', shadowOpacity: 0.45, shadowRadius: 14, shadowOffset: { width: 0, height: 0 } },
  trophy: { position: 'absolute', top: -23, alignSelf: 'center' },
  playTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  tagline: { color: '#CCD1DC', textAlign: 'center', fontSize: 11, lineHeight: 15, marginTop: 5 },
  startWrap: { alignSelf: 'center', width: '68%', marginVertical: 14, borderRadius: 26, borderWidth: 1, borderColor: '#FFEB97', overflow: 'hidden' },
  start: { minHeight: 44, flexDirection: 'row', gap: 14, alignItems: 'center', justifyContent: 'center' },
  startText: { fontSize: 19, fontWeight: '700', color: '#111111' },
  leaderboard: { borderWidth: 1, borderColor: '#2476C5', borderRadius: 18, padding: 6 },
  leaderTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center', paddingVertical: 6 },
  table: { borderWidth: 1, borderColor: '#1C3049', borderRadius: 10, overflow: 'hidden' },
  tableRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#1C3049', minHeight: 31 },
  tableHeading: { color: '#B9C2D1', fontSize: 10, paddingVertical: 4 },
  rank: { width: '19%', alignItems: 'center', textAlign: 'center' },
  player: { flex: 1, paddingLeft: 8 },
  score: { width: '23%', textAlign: 'center' },
  playerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 1, borderRightWidth: 1, borderColor: '#1C3049', paddingVertical: 3 },
  avatar: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  initial: { color: '#14213C', fontSize: 12, fontWeight: '700' },
  cell: { color: '#F4F6FC', fontSize: 12 },
  previewNote: { color: '#94A3B8', fontSize: 10, textAlign: 'center', marginVertical: 8 },
  questionPage: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, maxWidth: 540, width: '100%', alignSelf: 'center' },
  questionHeader: { minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 44 },
  back: { position: 'absolute', left: 0, width: 44, height: 44, justifyContent: 'center' },
  questionCount: { color: '#FFFFFF', fontSize: 18, fontWeight: '500', textAlign: 'center' },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 16 },
  segment: { width: 27, height: 8, borderRadius: 5, backgroundColor: '#D9D9D9' },
  segmentActive: { backgroundColor: '#388BCD' },
  timerSpace: { flex: 1, minHeight: 156, justifyContent: 'center', alignItems: 'center', paddingVertical: 24 },
  timer: { width: 108, height: 108, borderRadius: 54, borderWidth: 6, borderColor: '#388BCD', alignItems: 'center', justifyContent: 'center' },
  timerValue: { color: '#F7FFFF', fontSize: 25, fontVariant: ['tabular-nums'] },
  seconds: { color: '#FFFFFF', fontSize: 15, letterSpacing: 2 },
  question: { color: '#FAFAFF', fontSize: 22, fontWeight: '600', textAlign: 'center', lineHeight: 30, marginBottom: 34, marginTop: 10 },
  options: { gap: 20 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 65, padding: 10, borderWidth: 1, borderColor: '#388BCD', borderRadius: 11, backgroundColor: '#142031' },
  letterCircle: { width: 45, height: 45, borderRadius: 23, borderWidth: 1, borderColor: '#60BFFF', backgroundColor: '#091D35', justifyContent: 'center', alignItems: 'center' },
  letter: { color: '#60BFFF', fontSize: 20, fontWeight: '700' },
  optionText: { flex: 1, color: '#FFFFFF', fontSize: 21 },
  correct: { backgroundColor: '#142F15', borderColor: '#40D335' },
  incorrect: { backgroundColor: '#300C19', borderColor: '#FF343F' },
  correctText: { color: '#40D335' },
  incorrectText: { color: '#FF343F' },
  feedback: { minHeight: 20, color: '#C9D3E0', fontSize: 12, textAlign: 'center', marginTop: 12 },
  action: { minHeight: 60, borderRadius: 30, backgroundColor: '#00DFED', alignItems: 'center', justifyContent: 'center', padding: 14, marginTop: 22, width: '100%' },
  disabledAction: { backgroundColor: '#E5E5E5' },
  retryAction: { backgroundColor: '#FFD0DA', borderWidth: 1, borderColor: '#FF343F' },
  actionText: { color: '#030B12', fontSize: 21, fontWeight: '600' },
  result: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 14, maxWidth: 540, width: '100%', alignSelf: 'center' },
  resultTitle: { color: '#FFFFFF', fontSize: 30, fontWeight: '700' },
  resultScore: { color: '#00DFED', fontSize: 48, fontWeight: '700' },
  resultCopy: { color: '#CCD1DC', fontSize: 16, textAlign: 'center', lineHeight: 24 },
});
