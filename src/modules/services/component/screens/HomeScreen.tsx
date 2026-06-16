import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';

import Banner from '../constant/Banner';
import ServicesHome from '../home/ServicesHome';
import BannerSliderManual from '../home/BannerSliderManual';
import ServiceCard from '../constant/ServiceCard';
import MostBookedServices from '../home/MostBookedServices';
import QuickServices from '../home/QuickServices';
import BundleService from '../home/BundleService';
import ExclusiveOffers from '../home/ExclusiveOffers';

const DrivingSvg = require('../../assete/gov_documet/driving_licence.png');
const AadhaarSvg = require('../../assete/gov_documet/aadhar card.png');
const PanSvg = require('../../assete/gov_documet/pan_card.png');

const homeServices = [
  {
    title: 'Driving Licence Renewal',
    subTitle: 'Renewal / Address Change',
    price: '₹654',
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
        <MostBookedServices />

        {/* ✅ QUICK SERVICES (DYNAMIC GRID) */}
        <QuickServices />
        <ExclusiveOffers/>

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
});



