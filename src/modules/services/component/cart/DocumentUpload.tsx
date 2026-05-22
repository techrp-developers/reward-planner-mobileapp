import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenHeader from '../constant/navbar/ScreenHeaderColor';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary, type Asset as PickerAsset } from 'react-native-image-picker';
import type { HomeStackParamList } from '../../navigation/type';
import { getRequiredDocuments, uploadServiceDocument, submitServiceDocuments } from '../../api/DocumentAPI';

type NavProps = NativeStackNavigationProp<HomeStackParamList>;
type RouteT = RouteProp<HomeStackParamList, 'DocumentUpload'>;

type RequiredDoc = {
  id: number;
  label: string;
  isMandatory: boolean;
  uploaded: boolean;
  fileName: string | null;
  filePath: string | null;
};

type UploadableFile = {
  uri: string;
  type?: string;
  fileName?: string;
  fileSize?: number;
};

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const normalizeDocs = (res: any): RequiredDoc[] => {
  const rawList = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];

  return rawList
    .map((item: any, index: number) => {
      // Backend expects service_document_id for upload mapping.
      const id = Number(item?.service_document_id ?? item?.document_id ?? item?.id ?? index + 1);
      const name = String(item?.document_name ?? `Document ${index + 1}`).trim();
      const filePath = item?.file_path ? String(item.file_path) : null;

      return {
        id,
        label: name || `Document ${index + 1}`,
        isMandatory: Number(item?.is_mandatory ?? 0) === 1 || item?.is_mandatory === true,
        uploaded: Boolean(item?.uploaded) || Boolean(filePath),
        fileName: filePath ? filePath.split('/').pop() || name : null,
        filePath,
      };
    })
    .filter((item) => Number.isFinite(item.id) && item.id > 0);
};

const getReadableError = (err: any, fallback: string) =>
  String(err?.message || err?.error || err?.details || fallback);

const DocumentUpload = () => {
  const navigation = useNavigation<NavProps>();
  const route = useRoute<RouteT>();
  const order_id = Number(route.params?.order_id ?? 0);

  const [docs, setDocs] = useState<RequiredDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const loadRequiredDocs = useCallback(async () => {
    if (!Number.isFinite(order_id) || order_id <= 0) {
      setError('Invalid order id. Please retry from checkout.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await getRequiredDocuments(order_id);
      const normalized = normalizeDocs(res);
      setDocs(normalized);
      setError('');
    } catch (err: any) {
      setError(getReadableError(err, 'Unable to load required documents.'));
    } finally {
      setLoading(false);
    }
  }, [order_id]);

  useEffect(() => {
    loadRequiredDocs();
  }, [loadRequiredDocs]);

  const pendingMandatoryCount = useMemo(
    () => docs.filter((doc) => doc.isMandatory && !doc.uploaded).length,
    [docs],
  );

  const startUpload = useCallback(async (doc: RequiredDoc, file: UploadableFile) => {
    if (!file?.uri) {
      Alert.alert('Upload', 'Invalid file selected. Please try again.');
      return;
    }

    if (file.fileSize && file.fileSize > MAX_FILE_SIZE_BYTES) {
      Alert.alert('File too large', 'Max allowed size is 2MB');
      return;
    }

    const mimeType =
      file.type ||
      (file.uri?.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');

    console.log('📄 Upload request payload:', {
      order_id,
      service_document_id: doc.id,
      uri: file.uri,
      type: mimeType,
      name: file.fileName,
      size: file.fileSize,
    });

    setUploadingId(doc.id);
    try {
      await uploadServiceDocument({
        order_id,
        document_id: doc.id,
        file: {
          ...file,
          type: mimeType,
        },
      });

      // Always refetch to avoid stale optimistic state.
      await loadRequiredDocs();
      Alert.alert('Success', `${doc.label} uploaded successfully.`);
    } catch (err: any) {
      Alert.alert('Upload Failed', getReadableError(err, `Failed to upload ${doc.label}.`));
    } finally {
      setUploadingId(null);
    }
  }, [loadRequiredDocs, order_id]);

  const pickFile = useCallback(async (doc: RequiredDoc) => {
    const result = await launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 1,
      quality: 0.8,
    });

    if (result.didCancel) return;
    if (result.errorMessage) {
      Alert.alert('Upload', result.errorMessage);
      return;
    }

    const file = (result.assets?.[0] || null) as PickerAsset | null;
    if (!file?.uri) {
      Alert.alert('Upload', 'No file selected. Please try again.');
      return;
    }

    await startUpload(doc, {
      uri: file.uri,
      type: file.type,
      fileName: file.fileName,
      fileSize: file.fileSize,
    });
  }, [startUpload]);

  const handleMarkForReupload = useCallback((docId: number) => {
    setDocs((prev) =>
      prev.map((item) =>
        item.id === docId
          ? {
              ...item,
              uploaded: false,
              fileName: null,
              filePath: null,
            }
          : item,
      ),
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    if (pendingMandatoryCount > 0) {
      Alert.alert(
        'Documents Pending',
        `Please upload all mandatory documents (${pendingMandatoryCount} remaining).`,
      );
      return;
    }

    if (uploadingId !== null) {
      Alert.alert('Upload in progress', 'Please wait until upload completes before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitServiceDocuments(order_id);

      const orderRef = String(res?.data?.order_ref || `#SP-ORD-${order_id}`);
      navigation.navigate('SubmittedSuccessful', {
        statusText: 'Documents Submitted',
        title: 'Documents Uploaded Successfully',
        description: 'Our team will verify your documents and process your service order.',
        enquiryId: orderRef,
      });
    } catch (err: any) {
      Alert.alert('Submit Failed', getReadableError(err, 'Failed to submit documents. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [navigation, order_id, pendingMandatoryCount, uploadingId]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Documents Needed" onBackPress={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.centeredWrap}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Loading required documents...</Text>
        </View>
      ) : error ? (
        <View style={styles.centeredWrap}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadRequiredDocs}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.helperText}>
            Upload each required document. Mandatory documents must be uploaded before submission.
          </Text>

          {docs.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.iconContainer}>
                <MaterialCommunityIcons name="file-document" size={24} color="#A78BFA" />
              </View>

              <View style={styles.textContainer}>
                <Text style={styles.labelText}>
                  {item.label}
                  {item.isMandatory ? ' *' : ''}
                </Text>

                {item.uploaded ? (
                  <Text style={styles.fileNameText}>{item.fileName || 'Uploaded'}</Text>
                ) : (
                  <>
                    <Text style={styles.labelPlaceholder}>Not uploaded yet</Text>
                    <Text style={styles.formatText}>Formats: JPG, PNG, PDF</Text>
                  </>
                )}
              </View>

              <View style={styles.rightAction}>
                <Text style={styles.sizeText}>Max size: 2MB</Text>
                {item.uploaded ? (
                  <TouchableOpacity
                    style={styles.removeCircle}
                    onPress={() => handleMarkForReupload(item.id)}
                    disabled={submitting || uploadingId !== null}
                  >
                    <Ionicons name="close" size={12} color="white" />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickFile(item)}
                    disabled={submitting || uploadingId !== null}
                  >
                    {uploadingId === item.id ? (
                      <ActivityIndicator size="small" color="#4B5563" />
                    ) : (
                      <Ionicons name="cloud-upload-outline" size={24} color="#4B5563" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity
            style={[
              styles.submitButton,
              (submitting || pendingMandatoryCount > 0 || uploadingId !== null) && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={submitting || pendingMandatoryCount > 0 || uploadingId !== null}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                {pendingMandatoryCount > 0
                  ? `Upload ${pendingMandatoryCount} Mandatory Document${pendingMandatoryCount > 1 ? 's' : ''}`
                  : uploadingId !== null
                    ? 'Uploading...'
                    : 'Submit Documents'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  helperText: {
    fontSize: 13,
    color: '#4B5563',
    marginBottom: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  iconContainer: {
    width: 45,
    height: 45,
    backgroundColor: '#F3E8FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  labelText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '700',
    marginBottom: 2,
  },
  fileNameText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#374151',
  },
  labelPlaceholder: {
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  formatText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  rightAction: {
    alignItems: 'flex-end',
  },
  sizeText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  removeCircle: {
    width: 20,
    height: 20,
    backgroundColor: '#FCA5A5',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 8,
    backgroundColor: '#111827',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  centeredWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 13,
  },
  errorText: {
    fontSize: 14,
    color: '#B91C1C',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#111827',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default DocumentUpload;