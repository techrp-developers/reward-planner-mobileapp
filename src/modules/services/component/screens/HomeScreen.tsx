import React from 'react';
import { ScrollView, View, StyleSheet, Text } from 'react-native';

import Banner from '../constant/Banner';
import ServicesHome from '../home/ServicesHome';
import BannerSliderManual from '../home/BannerSliderManual';
import ServiceCard from '../constant/ServiceCard';
import MostBookedServices from '../home/MostBookedServices';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import { HomeStackParamList } from '../../navigation/type';
import { useServiceHome } from '../../hooks/useServiceHome';
const fallbackImage = require('../../assete/gov_documet/aadhar card.png');
const DrivingSvg = require('../../assete/gov_documet/driving_licence.png');
const AadhaarSvg = require('../../assete/gov_documet/aadhar card.png');
const PanSvg = require('../../assete/gov_documet/pan_card.png');
import EasyServiceCard from '../home/EasyService';
import BundleService from '../home/BundleService';

const homeServices = [
  {
    title: 'Driving Licence Renewal',
    subTitle: 'Licence No : MH14 2025 439210',
    price: '₹654',
    dueText: 'Due in 12 days',
    image: DrivingSvg,
  },
  {
    title: 'Aadhaar Card Update',
    subTitle: 'Name / DOB Correction',
    price: '₹199',
    image: AadhaarSvg,
  },
  {
    title: 'PAN Card Services',
    subTitle: 'New / Correction',
    price: '₹299',
    image: PanSvg,
  },
];



export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<HomeStackParamList>>();

const { data } = useServiceHome();

const quickServices = data?.data?.quick_services || [];
const popularServices = data?.data?.popular || [];
  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Banner />
        <ServicesHome />
        <BannerSliderManual />

        {/* STATIC SERVICE SLIDER */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalContent}
        >
          {homeServices.map((item, index) => (
            <ServiceCard key={index} {...item} />
          ))}
        </ScrollView>

        {/* ✅ MOST BOOKED (DYNAMIC) */}
        {popularServices.length > 0 && (
          <MostBookedServices data={popularServices} />
        )}

        {/* ✅ QUICK SERVICES (DYNAMIC) */}
        {quickServices.length > 0 && (
          <View style={styles.quickEasyContainer}>
            <Text style={styles.sectionHeader}>Quick & Easy Services</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {quickServices.map((item) => (
                <EasyServiceCard
                  key={`${item.service_id}-${item.variant_id}`}
                  title={item.name}
                  image={
                    item.image && item.image.trim() !== ''
                      ? { uri: item.image }
                      : fallbackImage
                  }
                  price={String(item.price)}
                  oldPrice={String(item.price)}
                  users="10K"
                  coins="50"
                  onPress={() =>
                    navigation.navigate('ServiceDescription', {
                      serviceId: item.service_id,
                      title: item.name,
                    })
                  }
                />
              ))}
            </ScrollView>
          </View>
        )}

        <BundleService />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 15,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  horizontalContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  // MATCHING THE QUICK & EASY SECTION FROM IMAGE
  quickEasyContainer: {
    backgroundColor: '#F2F3FF', // Requested background color
    marginTop: 20,
    paddingVertical: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: '#374151',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  quickEasyScroll: {
    paddingHorizontal: 16,
  },
});



