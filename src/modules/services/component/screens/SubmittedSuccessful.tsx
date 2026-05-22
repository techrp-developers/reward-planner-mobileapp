import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { HomeStackParamList } from '../../navigation/type';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Successfully from '../constant/Successfully';

type SubmittedSuccessfulRoute = RouteProp<HomeStackParamList, 'SubmittedSuccessful'>;

function SubmittedSuccessful({ navigation }: any) {
  const route = useRoute<SubmittedSuccessfulRoute>();

  const statusText = route.params?.statusText ?? 'Enquiry Confirmed';
  const title = route.params?.title ?? 'Enquiry Submitted Successfully';
  const description =
    route.params?.description ?? 'Our team will review the details and get back to you shortly.';
  const enquiryId = route.params?.enquiryId ?? '#RP-ENQ-19472';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      {/* BACK BUTTON */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation?.goBack()}
      >
        <MaterialIcons name="chevron-left" size={32} color="#374151" />
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <Successfully
          statusText={statusText}
          title={title}
          description={description}
          enquiryId={enquiryId}
        />

        {/* APP RATING CARD */}
        <View style={styles.wrapper}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="star" size={28} color="#FACC15" />
          </View>

          <View style={styles.textWrap}>
            <Text style={styles.title}>
              Are you loving your experience with our app so far?
            </Text>
            <Text style={styles.link}>Give us a rating</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: 'absolute',
    top: 20, 
    left: 16,
    zIndex: 10, 
    padding: 8,
  },
  wrapper: {
    marginHorizontal: 16,
    marginBottom: 40, 
    backgroundColor: '#FFFADF',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE88A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    color: '#1F2937',
    fontWeight: '500',
    lineHeight: 18,
  },
  link: {
    marginTop: 4,
    fontSize: 13,
    color: '#7C3AED',
    fontWeight: '600',
  },
});

export default SubmittedSuccessful;