import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import { launchCamera } from 'react-native-image-picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DOCUMENTS,
  useLoan,
  type DocumentKey,
} from '../../context/LoanContext';
import type { LoanStackParamList } from '../../navigation/types';
import { money } from '../../utils/loanMath';
import { validateLoanDocument } from '../../utils/documentValidation';
import { Button, Copy, PreviewTools, useLoanColors } from '../LoanUI';
import {
  LoanOnboardingLayout,
  onboardingStyles as base,
} from '../LoanOnboardingLayout';

type Props<T extends keyof LoanStackParamList> = NativeStackScreenProps<
  LoanStackParamList,
  T
>;
const ART = require('../../assets/loan-documents.png');
const DOCUMENT_ICONS: Record<DocumentKey, string> = {
  pan: 'badge',
  aadhaar: 'fingerprint',
  salary: 'receipt-long',
  bank: 'account-balance',
};

function DocumentIntro({
  label,
  title,
  subtitle,
  illustration = false,
}: {
  label: string;
  title: string;
  subtitle: string;
  illustration?: boolean;
}) {
  const c = useLoanColors();
  return (
    <View style={base.center}>
      <Text style={[styles.eyebrow, { color: c.accent }]}>{label}</Text>
      {illustration ? (
        <Image
          accessible={false}
          source={ART}
          resizeMode="contain"
          style={styles.introArt}
        />
      ) : null}
      <Text accessibilityRole="header" style={[base.title, { color: c.text }]}>
        {title}
      </Text>
      <Text style={[base.subtitle, { color: c.muted }]}>{subtitle}</Text>
    </View>
  );
}

export function LoanDocumentsScreen({ navigation }: Props<'LoanDocuments'>) {
  const { documents, setDocuments, setDetailsReady } = useLoan();
  const c = useLoanColors();
  const [errors, setErrors] = useState<Partial<Record<DocumentKey, string>>>(
    {},
  );
  const [busyKey, setBusyKey] = useState<DocumentKey | null>(null);
  const [selected, setSelected] = useState<DocumentKey | null>(null);
  const locked = useRef(false);
  const active = useRef(true);
  const pendingSource = useRef<{ key: DocumentKey; camera: boolean } | null>(
    null,
  );
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      pendingSource.current = null;
    };
  }, []);
  const count = DOCUMENTS.filter(doc => documents[doc.key]).length;
  const selectedDocument = DOCUMENTS.find(doc => doc.key === selected);
  const upload = async (key: DocumentKey, camera: boolean) => {
    if (locked.current || !active.current) {
      return;
    }
    locked.current = true;
    setBusyKey(key);
    setSelected(null);
    try {
      let file: {
        name?: string | null;
        uri?: string;
        size?: number | null;
        type?: string | null;
      };
      if (camera) {
        const result = await launchCamera({
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 2200,
          maxHeight: 2200,
          saveToPhotos: false,
        });
        if (result.didCancel) {
          return;
        }
        if (result.errorCode) {
          throw new Error(
            'Camera unavailable. Allow camera access or choose a file instead.',
          );
        }
        const photo = result.assets?.[0];
        file = photo
          ? {
              name: photo.fileName || `${key}.jpg`,
              uri: photo.uri,
              size: photo.fileSize,
              type: photo.type,
            }
          : undefined;
      } else {
        const [result] = await pick({
          type: [types.pdf, types.images],
          allowMultiSelection: false,
        });
        file = result;
      }
      const issue = validateLoanDocument(file);
      if (issue) {
        throw new Error(issue);
      }
      if (!active.current) {
        return;
      }
      setDetailsReady(false);
      setDocuments(previous => ({
        ...previous,
        [key]: { name: file.name || `${key}.pdf`, uri: file.uri },
      }));
      setErrors(previous => ({ ...previous, [key]: undefined }));
    } catch (error) {
      if (!active.current) {
        return;
      }
      if (
        isErrorWithCode(error) &&
        error.code === errorCodes.OPERATION_CANCELED
      ) {
        return;
      }
      setErrors(previous => ({
        ...previous,
        [key]:
          error instanceof Error
            ? error.message
            : 'Could not add this document. Please try again.',
      }));
    } finally {
      locked.current = false;
      if (active.current) {
        setBusyKey(null);
      }
    }
  };
  const chooseSource = (camera: boolean) => {
    if (!selected) {
      return;
    }
    // Native pickers must wait for the sheet's presentation to end on Apple devices.
    if (Platform.OS === 'ios') {
      pendingSource.current = { key: selected, camera };
      setBusyKey(selected);
      setSelected(null);
    } else {
      return upload(selected, camera);
    }
  };
  const next = () => {
    if (count === 4 && !busyKey) {
      navigation.navigate('LoanVerification');
    }
  };
  return (
    <LoanOnboardingLayout
      onBack={() => navigation.goBack()}
      previewNote="Preview only · Documents stay on your device"
      footer={
        <Button
          label="Continue"
          disabled={count !== 4 || !!busyKey}
          onPress={next}
        />
      }
    >
      <DocumentIntro
        label="01 / YOUR DOCUMENTS"
        title="Upload Documents"
        subtitle="Add the essentials upfront. We’ll use them to prepare your details for review."
        illustration
      />
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Required documents
        </Text>
        <View style={[styles.counter, { backgroundColor: c.tint }]}>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.counterText, { color: c.accent }]}
          >
            {count} of 4 added
          </Text>
        </View>
      </View>
      {DOCUMENTS.map(doc => {
        const added = documents[doc.key];
        return (
          <View key={doc.key}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${added ? 'Replace' : 'Add'} ${doc.title}`}
              accessibilityState={{ disabled: !!busyKey }}
              disabled={!!busyKey}
              onPress={() => setSelected(doc.key)}
              style={({ pressed }) => [
                styles.document,
                {
                  backgroundColor: c.card,
                  borderColor: errors[doc.key]
                    ? '#BD425B'
                    : added
                    ? c.accent
                    : c.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <View style={[styles.documentIcon, { backgroundColor: c.tint }]}>
                <MaterialIcons
                  name={DOCUMENT_ICONS[doc.key]}
                  size={25}
                  color={c.accent}
                />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.documentTitle, { color: c.text }]}>
                  {doc.title}
                </Text>
                <Text
                  style={[styles.documentHint, { color: c.muted }]}
                  numberOfLines={1}
                >
                  {added?.name || doc.hint}
                </Text>
                <Text style={[styles.documentAction, { color: c.accent }]}>
                  {added ? 'Added · Tap to replace' : 'Upload or take a photo'}
                </Text>
              </View>
              {busyKey === doc.key ? (
                <ActivityIndicator color={c.accent} />
              ) : (
                <MaterialIcons
                  name={added ? 'check-circle' : 'file-upload'}
                  size={22}
                  color={c.accent}
                />
              )}
            </Pressable>
            {errors[doc.key] ? <Copy error>{errors[doc.key]}</Copy> : null}
          </View>
        );
      })}
      <View style={styles.fileGuide}>
        <MaterialIcons
          name="photo-size-select-large"
          size={15}
          color={c.muted}
        />
        <Text style={[styles.fileGuideText, { color: c.muted }]}>
          PDF, JPG or PNG · Up to 10 MB each{'\n'}Keep all corners visible and
          avoid glare.
        </Text>
      </View>
      <View style={[styles.infoPanel, { backgroundColor: c.tint }]}>
        <MaterialIcons name="lock-outline" size={19} color={c.accent} />
        <Text style={[styles.infoText, { color: c.accent }]}>
          For this preview, use sample documents. Your files are not uploaded or
          checked by a lender.
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!busyKey }}
        disabled={!!busyKey}
        onPress={() => {
          setDetailsReady(false);
          setDocuments(
            Object.fromEntries(
              DOCUMENTS.map(doc => [
                doc.key,
                { name: `Sample ${doc.title}.pdf`, sample: true },
              ]),
            ),
          );
          setErrors({});
        }}
        style={styles.sampleLink}
      >
        <MaterialIcons name="auto-awesome" size={15} color={c.accent} />
        <Text style={[styles.sampleText, { color: c.accent }]}>
          Use sample documents
        </Text>
      </Pressable>
      <Modal
        visible={selected !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
        onDismiss={() => {
          const source = pendingSource.current;
          pendingSource.current = null;
          if (source) {
            return upload(source.key, source.camera);
          }
        }}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.uploadSheet, { backgroundColor: c.card }]}>
            <View style={styles.sheetHeader}>
              <View style={styles.flex}>
                <Text style={[styles.sheetTitle, { color: c.text }]}>
                  {documents[selected || 'pan'] ? 'Replace' : 'Add'}{' '}
                  {selectedDocument?.title}
                </Text>
                <Text style={[styles.sheetSubtitle, { color: c.muted }]}>
                  Choose a clear, readable copy.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close document options"
                onPress={() => setSelected(null)}
                hitSlop={12}
              >
                <MaterialIcons name="close" size={24} color={c.accent} />
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose a file"
              onPress={() => chooseSource(false)}
              style={[styles.sheetOption, { borderColor: c.border }]}
            >
              <MaterialIcons name="upload-file" size={25} color={c.accent} />
              <View style={styles.flex}>
                <Text style={[styles.optionTitle, { color: c.text }]}>
                  Choose a file
                </Text>
                <Text style={[styles.optionSubtitle, { color: c.muted }]}>
                  PDF, JPG or PNG · Maximum 10 MB
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={c.muted} />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Take a photo"
              onPress={() => chooseSource(true)}
              style={[styles.sheetOption, { borderColor: c.border }]}
            >
              <MaterialIcons name="photo-camera" size={25} color={c.accent} />
              <View style={styles.flex}>
                <Text style={[styles.optionTitle, { color: c.text }]}>
                  Take a photo
                </Text>
                <Text style={[styles.optionSubtitle, { color: c.muted }]}>
                  Capture the document in good light
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={c.muted} />
            </Pressable>
            <Text style={[styles.sheetNote, { color: c.muted }]}>
              Preview only. Nothing is sent to a lender.
            </Text>
          </View>
        </View>
      </Modal>
    </LoanOnboardingLayout>
  );
}

const CHECKS = [
  {
    title: 'Reading your documents',
    detail: 'Bringing your information together',
    icon: 'document-scanner',
  },
  {
    title: 'Verifying PAN & Aadhaar',
    detail: 'Reviewing identity information',
    icon: 'badge',
  },
  {
    title: 'Fetching employment details',
    detail: 'Preparing your work and income details',
    icon: 'work-outline',
  },
  {
    title: 'Validating bank statement',
    detail: 'Reviewing the statement information',
    icon: 'account-balance',
  },
];

export function LoanVerificationScreen({
  navigation,
}: Props<'LoanVerification'>) {
  const { documents, loadSampleDetails, setDetailsReady } = useLoan();
  const c = useLoanColors();
  const [done, setDone] = useState(0);
  const [failed, setFailed] = useState(false);
  const documentsReady = DOCUMENTS.every(doc => documents[doc.key]);
  useEffect(() => {
    setDetailsReady(false);
  }, [setDetailsReady]);
  useEffect(() => {
    if (!documentsReady || failed || done >= CHECKS.length) {
      return;
    }
    const timer = setTimeout(() => setDone(value => value + 1), 800);
    return () => clearTimeout(timer);
  }, [documentsReady, failed, done]);
  useEffect(() => {
    if (!documentsReady || failed || done !== CHECKS.length) {
      return;
    }
    const timer = setTimeout(() => {
      loadSampleDetails();
      navigation.replace('LoanFetched');
    }, 650);
    return () => clearTimeout(timer);
  }, [documentsReady, done, failed, loadSampleDetails, navigation]);
  return (
    <LoanOnboardingLayout
      onBack={() => navigation.goBack()}
      previewNote="Verification preview · No OCR or lender checks are performed"
      footer={
        failed || !documentsReady ? (
          <Button
            label="Review documents"
            onPress={() => navigation.replace('LoanDocuments')}
          />
        ) : undefined
      }
    >
      <DocumentIntro
        label="02 / PREPARING YOUR DETAILS"
        title={
          !documentsReady
            ? 'Add your documents first'
            : failed
            ? 'A detail needs your attention'
            : 'Verification in Progress'
        }
        subtitle={
          !documentsReady
            ? 'Add all four required documents to begin.'
            : failed
            ? 'We couldn’t match a detail. Please review your documents and try again.'
            : 'We’re bringing your information together, so there’s less for you to enter.'
        }
      />
      <View style={styles.verificationArt}>
        <View style={[styles.artHalo, { backgroundColor: c.tint }]} />
        <Image
          accessible={false}
          source={ART}
          resizeMode="contain"
          style={styles.verificationImage}
        />
        <View
          style={[
            styles.artStatus,
            { backgroundColor: c.card, borderColor: c.border },
          ]}
        >
          {failed ? (
            <MaterialIcons name="priority-high" size={23} color={c.accent} />
          ) : (
            <ActivityIndicator color={c.accent} size="small" />
          )}
        </View>
      </View>
      <View style={styles.progressHeader}>
        <Text style={[styles.sectionTitle, { color: c.text }]}>
          Document review
        </Text>
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.progressCount, { color: c.accent }]}
        >
          {done} of 4 complete
        </Text>
      </View>
      <View
        style={[
          styles.progressCard,
          { backgroundColor: c.card, borderColor: c.border },
        ]}
      >
        {CHECKS.map((check, index) => {
          const complete = index < done;
          const current = documentsReady && !failed && index === done;
          return (
            <View
              key={check.title}
              style={[
                styles.checkRow,
                index < 3 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: c.border,
                },
              ]}
            >
              <View
                style={[
                  styles.checkIcon,
                  {
                    backgroundColor: c.tint,
                    opacity: complete || current ? 1 : 0.45,
                  },
                ]}
              >
                <MaterialIcons
                  name={complete ? 'check' : check.icon}
                  size={21}
                  color={c.accent}
                />
              </View>
              <View style={styles.flex}>
                <Text
                  style={[
                    styles.checkTitle,
                    { color: complete || current ? c.text : c.muted },
                  ]}
                >
                  {check.title}
                </Text>
                <Text style={[styles.checkDetail, { color: c.muted }]}>
                  {complete
                    ? 'Preview complete'
                    : current
                    ? check.detail
                    : failed && index === done
                    ? 'Needs review'
                    : 'Up next'}
                </Text>
              </View>
              {complete ? (
                <MaterialIcons name="check-circle" size={18} color={c.accent} />
              ) : current ? (
                <ActivityIndicator color={c.accent} size="small" />
              ) : (
                <View style={[styles.waitDot, { backgroundColor: c.border }]} />
              )}
            </View>
          );
        })}
      </View>
      <View style={[styles.infoPanel, { backgroundColor: c.tint }]}>
        <MaterialIcons name="schedule" size={19} color={c.accent} />
        <Text style={[styles.infoText, { color: c.accent }]}>
          This may take a few moments. Your details will appear on the next
          screen for you to review.
        </Text>
      </View>
      {documentsReady ? (
        <PreviewTools>
          {failed ? (
            <Button
              secondary
              label="Enter details manually"
              onPress={() => navigation.replace('LoanPersonal')}
            />
          ) : (
            <Button
              secondary
              label="Preview a verification mismatch"
              onPress={() => setFailed(true)}
            />
          )}
        </PreviewTools>
      ) : null}
    </LoanOnboardingLayout>
  );
}

export function LoanFetchedScreen({ navigation }: Props<'LoanFetched'>) {
  const { personal, employment, detailsReady } = useLoan();
  const c = useLoanColors();
  const details = [
    { label: 'Full name', value: personal.name, icon: 'person-outline' },
    { label: 'PAN number', value: personal.pan, icon: 'badge' },
    { label: 'Employment type', value: employment.type, icon: 'work-outline' },
    {
      label: 'Monthly income',
      value: money(Number(employment.income) || 0),
      icon: 'payments',
    },
    { label: 'Company name', value: employment.company, icon: 'business' },
  ];
  return (
    <LoanOnboardingLayout
      onBack={() => navigation.goBack()}
      previewNote="Sample results · No information was extracted from your files"
      footer={
        <Button
          label={detailsReady ? 'Continue' : 'Return to documents'}
          onPress={() =>
            navigation.navigate(detailsReady ? 'LoanPersonal' : 'LoanDocuments')
          }
        />
      }
    >
      <View style={styles.successMark}>
        <View style={[styles.successHalo, { backgroundColor: c.tint }]}>
          <View style={[styles.successCircle, { backgroundColor: c.accent }]}>
            <MaterialIcons
              name={detailsReady ? 'check' : 'description'}
              size={39}
              color={c.isDark ? '#302037' : '#FFFFFF'}
            />
          </View>
        </View>
      </View>
      <DocumentIntro
        label="03 / READY TO REVIEW"
        title={
          detailsReady
            ? 'Details Fetched Successfully!'
            : 'Your review is not ready yet'
        }
        subtitle={
          detailsReady
            ? 'Your details are ready. Review the information below before moving to the next step.'
            : 'Complete the document review to prepare your personal and employment details.'
        }
      />
      {detailsReady ? (
        <>
          <View
            style={[
              styles.resultCard,
              { backgroundColor: c.card, borderColor: c.border },
            ]}
          >
            <View style={[styles.resultHeader, { backgroundColor: c.tint }]}>
              <View style={styles.flex}>
                <Text style={[styles.resultTitle, { color: c.text }]}>
                  Auto-filled details
                </Text>
                <Text style={[styles.resultSubtitle, { color: c.muted }]}>
                  Sample information for your review
                </Text>
              </View>
              <MaterialIcons name="auto-awesome" size={20} color={c.accent} />
            </View>
            <View style={styles.resultRows}>
              {details.map((detail, index) => (
                <View
                  key={detail.label}
                  style={[
                    styles.resultRow,
                    index < 4 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: c.border,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={detail.icon}
                    size={20}
                    color={c.accent}
                  />
                  <View style={styles.flex}>
                    <Text style={[styles.resultLabel, { color: c.muted }]}>
                      {detail.label}
                    </Text>
                    <Text
                      selectable
                      style={[styles.resultValue, { color: c.text }]}
                    >
                      {detail.value || 'Not provided'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
          <View style={[styles.infoPanel, { backgroundColor: c.tint }]}>
            <MaterialIcons name="edit-note" size={21} color={c.accent} />
            <Text style={[styles.infoText, { color: c.accent }]}>
              Something to update? You can edit your personal and employment
              details on the next screen.
            </Text>
          </View>
        </>
      ) : null}
    </LoanOnboardingLayout>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 13,
  },
  introArt: { width: 132, height: 110, marginBottom: 8 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 26,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600' },
  counter: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  counterText: { fontSize: 12, fontWeight: '600' },
  document: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 15,
    borderWidth: 1,
    borderRadius: 18,
    marginBottom: 11,
  },
  documentIcon: {
    width: 46,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  documentTitle: { fontSize: 16, fontWeight: '600' },
  documentHint: { fontSize: 12, lineHeight: 20, marginTop: 4 },
  documentAction: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 5,
  },
  fileGuide: {
    flexDirection: 'row',
    gap: 7,
    alignItems: 'flex-start',
    paddingHorizontal: 3,
    marginTop: 3,
    marginBottom: 9,
  },
  fileGuideText: { flex: 1, fontSize: 12, lineHeight: 20 },
  infoPanel: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 15,
    padding: 14,
    marginTop: 17,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 20 },
  sampleLink: {
    flexDirection: 'row',
    alignSelf: 'center',
    alignItems: 'center',
    gap: 6,
    padding: 14,
    marginTop: 3,
  },
  sampleText: { fontSize: 13, fontWeight: '600' },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#1E112B88',
  },
  uploadSheet: {
    padding: 24,
    paddingBottom: 38,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 23,
  },
  sheetTitle: { fontSize: 21, fontWeight: '700' },
  sheetSubtitle: { fontSize: 14, lineHeight: 22, marginTop: 6 },
  sheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 17,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 12,
  },
  optionTitle: { fontSize: 16, fontWeight: '600' },
  optionSubtitle: { fontSize: 13, marginTop: 5, lineHeight: 21 },
  sheetNote: { fontSize: 12, textAlign: 'center', marginTop: 8 },
  verificationArt: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 167,
    marginTop: 10,
  },
  artHalo: { position: 'absolute', width: 130, height: 130, borderRadius: 65 },
  verificationImage: { width: 170, height: 160 },
  artStatus: {
    position: 'absolute',
    bottom: 6,
    right: '28%',
    width: 41,
    height: 41,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    marginBottom: 14,
  },
  progressCount: { fontSize: 11, fontWeight: '600' },
  progressCard: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 16 },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 17,
  },
  checkIcon: {
    width: 37,
    height: 37,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTitle: { fontSize: 13, fontWeight: '600', lineHeight: 20 },
  checkDetail: { fontSize: 11, lineHeight: 18, marginTop: 4 },
  waitDot: { width: 7, height: 7, borderRadius: 4, marginHorizontal: 5 },
  successMark: { alignItems: 'center', marginTop: 14, marginBottom: 24 },
  successHalo: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCircle: {
    width: 73,
    height: 73,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCard: {
    borderRadius: 23,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 26,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 19,
    paddingVertical: 17,
  },
  resultTitle: { fontSize: 17, fontWeight: '600' },
  resultSubtitle: { fontSize: 11, marginTop: 6 },
  resultRows: { paddingHorizontal: 19 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    paddingVertical: 16,
  },
  resultLabel: { fontSize: 11, marginBottom: 5 },
  resultValue: { fontSize: 15, fontWeight: '600', lineHeight: 23 },
});
