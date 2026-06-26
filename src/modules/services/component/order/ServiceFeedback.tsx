import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { submitServiceFeedback } from '../../api/OrderAPI';
import type { HomeStackParamList } from '../../navigation/type';

type Nav = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'ServiceFeedback'>;

const PURPLE = '#7C3AED';

const EXPERIENCE_LABELS = ['Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
const EASE_LABELS = ['Very Difficult', 'Difficult', 'Neutral', 'Easy', 'Very Easy'];
const EXPERT_LABELS = ['Very Poor', 'Poor', 'Neutral', 'Good', 'Excellent'];
const EMOJIS = ['😖', '☹️', '😐', '🙂', '😍'];

const COMPLETION_OPTIONS = [
  { label: 'Faster than expected', value: 'faster_than_expected' },
  { label: 'On time', value: 'on_time' },
  { label: 'Delayed', value: 'delayed' },
];

const CONFIDENCE_OPTIONS = [
  { label: 'Yes, completely', value: 'yes_completely' },
  { label: 'Mostly', value: 'mostly' },
  { label: 'Not really', value: 'not_really' },
];

const REUSE_OPTIONS = [
  { label: 'Definitely', value: 'definitely' },
  { label: 'Maybe', value: 'maybe' },
  { label: 'Unlikely', value: 'unlikely' },
];

export default function ServiceFeedback() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteT>();
  const {
    service_order_id,
    parent_order_id,
    order_ref,
    service_name,
    variant_name,
    image_url,
  } = route.params;

  const [rating, setRating] = useState(0);
  const [easeRating, setEaseRating] = useState(0);
  const [expertRating, setExpertRating] = useState(0);
  const [completionTime, setCompletionTime] = useState('');
  const [confidence, setConfidence] = useState('');
  const [reuseIntent, setReuseIntent] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitDisabled = rating === 0 || submitting;

  const handleSubmit = async () => {
    if (!rating) {
      Alert.alert('Rating required', 'Please rate your overall service experience.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitServiceFeedback({
        service_order_id,
        rating,
        ease_rating: easeRating || undefined,
        expert_rating: expertRating || undefined,
        completion_time: completionTime || undefined,
        confidence: confidence || undefined,
        reuse_intent: reuseIntent || undefined,
        comment,
      });

      if (res?.success) {
        Alert.alert('Thank you!', 'Your feedback has been submitted successfully.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('ServiceOrderDetail', { parent_order_id }),
          },
        ]);
        return;
      }

      Alert.alert('Submission failed', res?.message || 'Unable to submit feedback.');
    } catch (err: any) {
      Alert.alert('Submission failed', err?.message || 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header
        title="Service Feedback"
        onBack={() => navigation.goBack()}
        onHelp={() => Alert.alert('Help', 'Tell us how your completed service went.')}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <ServiceSummaryCard
          serviceName={service_name}
          variantName={variant_name}
          orderRef={order_ref}
          imageUrl={image_url}
        />

        <StarRatingCard
          title="How was your experience with this service?"
          rating={rating}
          onChange={setRating}
        />

        <EmojiScaleCard
          title="How easy was it to complete this service on our app?"
          value={easeRating}
          labels={EASE_LABELS}
          onChange={setEaseRating}
        />

        <EmojiScaleCard
          title="How was your experience with our Service Expert?"
          value={expertRating}
          labels={EXPERT_LABELS}
          onChange={setExpertRating}
        />

        <OptionCard
          title="Was your service completed within the expected time?"
          options={COMPLETION_OPTIONS}
          value={completionTime}
          onChange={setCompletionTime}
        />

        <OptionCard
          title="Did you feel confident that your service was handled correctly?"
          options={CONFIDENCE_OPTIONS}
          value={confidence}
          onChange={setConfidence}
        />

        <OptionCard
          title="Would you use this service again?"
          options={REUSE_OPTIONS}
          value={reuseIntent}
          onChange={setReuseIntent}
        />

        <View style={styles.commentSection}>
          <Text style={styles.commentTitle}>Anything you’d like us to improve?</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Type here"
            placeholderTextColor="#B8B2C4"
            multiline
            textAlignVertical="top"
            style={styles.commentInput}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          disabled={submitDisabled}
          onPress={handleSubmit}
        >
          <LinearGradient
            colors={['#8665FF', '#5B47A3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.submitButton, submitDisabled && styles.submitButtonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({
  title,
  onBack,
  onHelp,
}: {
  title: string;
  onBack: () => void;
  onHelp: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="chevron-left" size={30} color="#6B7280" />
      </TouchableOpacity>

      <Text style={styles.headerTitle}>{title}</Text>

      <TouchableOpacity style={styles.helpButton} onPress={onHelp} activeOpacity={0.8}>
        <MaterialCommunityIcons name="message-text-outline" size={18} color="#E879D6" />
        <Text style={styles.helpText}>Help</Text>
      </TouchableOpacity>
    </View>
  );
}

function ServiceSummaryCard({
  serviceName,
  variantName,
  orderRef,
  imageUrl,
}: {
  serviceName: string;
  variantName?: string;
  orderRef: string;
  imageUrl?: string | null;
}) {
  return (
    <View style={styles.summaryCard}>
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.serviceImage} resizeMode="cover" />
        ) : (
          <MaterialCommunityIcons name="file-document-outline" size={32} color={PURPLE} />
        )}
      </View>

      <View style={styles.summaryCopy}>
        <Text style={styles.serviceName} numberOfLines={2}>{serviceName}</Text>
        <Text style={styles.variantName} numberOfLines={2}>
          {variantName || 'Tell us about your completed service'}
        </Text>
        <View style={styles.orderRefRow}>
          <Text style={styles.orderRef}>Order ID - #{orderRef}</Text>
          <MaterialCommunityIcons name="content-copy" size={16} color="#4F46E5" />
        </View>
      </View>
    </View>
  );
}

function StarRatingCard({
  title,
  rating,
  onChange,
}: {
  title: string;
  rating: number;
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map(value => (
          <TouchableOpacity
            key={value}
            style={styles.starItem}
            activeOpacity={0.75}
            onPress={() => onChange(value)}
          >
            <MaterialCommunityIcons
              name={value <= rating ? 'star' : 'star-outline'}
              size={40}
              color="#E879D6"
            />
            <Text style={[styles.starLabel, value === rating && styles.selectedLabel]}>
              {EXPERIENCE_LABELS[value - 1]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function EmojiScaleCard({
  title,
  value,
  labels,
  onChange,
}: {
  title: string;
  value: number;
  labels: string[];
  onChange: (value: number) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.emojiRow}>
        {[1, 2, 3, 4, 5].map(option => {
          const selected = option === value;
          return (
            <TouchableOpacity
              key={option}
              style={styles.emojiItem}
              activeOpacity={0.75}
              onPress={() => onChange(option)}
            >
              <Text style={[styles.emoji, !selected && styles.emojiMuted]}>
                {EMOJIS[option - 1]}
              </Text>
              <Text style={[styles.emojiLabel, selected && styles.selectedLabel]}>
                {labels[option - 1]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.scaleTrack}>
        <View style={[styles.scaleFill, { width: `${Math.max(value, 1) * 20}%` }]} />
        <View style={[styles.scaleThumb, { left: `${Math.max(value - 1, 0) * 25}%` }]} />
      </View>
    </View>
  );
}

function OptionCard({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ label: string; value: string }>;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.optionList}>
        {options.map(option => {
          const selected = option.value === value;
          return (
            <TouchableOpacity
              key={option.value}
              style={styles.optionRow}
              activeOpacity={0.75}
              onPress={() => onChange(option.value)}
            >
              <View style={[styles.radio, selected && styles.radioActive]}>
                {selected ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFEFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#ECE8F3',
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    color: '#4B4658',
    fontWeight: '900',
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: '#FFF',
  },
  helpText: {
    color: '#E879D6',
    fontSize: 13,
    fontWeight: '900',
  },
  scroll: {
    padding: 16,
    paddingBottom: 34,
    gap: 10,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ECE8F3',
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0ECFF',
    overflow: 'hidden',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
  },
  summaryCopy: {
    flex: 1,
    marginLeft: 12,
  },
  serviceName: {
    fontSize: 16,
    color: '#4B4658',
    fontWeight: '900',
    lineHeight: 21,
  },
  variantName: {
    fontSize: 13,
    color: '#5F5A69',
    marginTop: 5,
    lineHeight: 18,
  },
  orderRefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  orderRef: {
    fontSize: 13,
    color: '#6B6475',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECE8F3',
    padding: 16,
  },
  cardTitle: {
    fontSize: 15,
    color: '#4B4658',
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 16,
  },
  starRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  starItem: {
    alignItems: 'center',
    flex: 1,
  },
  starLabel: {
    marginTop: 8,
    fontSize: 11,
    color: '#6B6475',
    fontWeight: '700',
    textAlign: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  emojiItem: {
    flex: 1,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  emojiMuted: {
    opacity: 0.38,
  },
  emojiLabel: {
    fontSize: 11,
    color: '#6B6475',
    fontWeight: '700',
    textAlign: 'center',
  },
  selectedLabel: {
    color: PURPLE,
    fontWeight: '900',
  },
  scaleTrack: {
    height: 5,
    backgroundColor: '#D9C7FF',
    borderRadius: 99,
    marginTop: 18,
  },
  scaleFill: {
    height: 5,
    backgroundColor: '#8665FF',
    borderRadius: 99,
  },
  scaleThumb: {
    position: 'absolute',
    top: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#EEE7FF',
    borderWidth: 3,
    borderColor: '#9A78FF',
  },
  optionList: {
    gap: 13,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  radioActive: {
    borderColor: PURPLE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },
  optionText: {
    fontSize: 14,
    color: '#5F5A69',
    fontWeight: '700',
  },
  commentSection: {
    marginTop: 2,
  },
  commentTitle: {
    fontSize: 15,
    color: '#4B4658',
    fontWeight: '900',
    marginBottom: 10,
  },
  commentInput: {
    minHeight: 132,
    borderWidth: 1,
    borderColor: '#D9E5E5',
    borderRadius: 8,
    padding: 14,
    color: '#111827',
    fontSize: 14,
    backgroundColor: '#FFF',
  },
  submitButton: {
    height: 54,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '900',
  },
});
