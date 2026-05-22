import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NormalizedServiceData } from '../types/ServiceTypes';
import type { BundleEnquiryField } from '../api/BundleAPI';

export type HomeStackParamList = {
  Home: undefined;
  ServiceSearch: undefined;
  ServiceDescription: {
    serviceId: number;
    categoryId?: number;
    title?: string;
    serviceData?: NormalizedServiceData;
  };
  Health: undefined;
  SuperTopUp: undefined;
  PersonalAccident: undefined;
  Government_Document_Screen: {
    categoryId: number;
  };
  DocumentUpload: {
    order_id: number;
  };
  PackScreen: {
    packType?: 'home' | 'married' | 'job';
    bundleId?: number;
    categoryId?: number;
    title?: string;
  };
  PackEnquiryForm: {
    bundleId?: number;
    title?: string;
    description?: string;
    price?: string;
    image?: string;
    oldPrice?: string;
    offerPrice?: string;
    coins?: string;
    days?: string;
    enquiryFields?: BundleEnquiryField[];
    safetyTitle?: string;
    safetyText?: string;
  };
  SubmittedSuccessful?: {
    statusText?: string;
    title?: string;
    description?: string;
    enquiryId?: string;
  };
  CartScreen: undefined;
  Profile: undefined;
  MyOrder: undefined;
  WalletHistory: undefined;
  TodoList: undefined;
  AddAddressMap: undefined;
  PrivacyPolicy: undefined;
  TermsAndConditions: undefined;
  OrderConfirmedScreen: { order_id?: number } | undefined;

  AddressSelect: { fromCart?: boolean } | undefined;

  ServiceCheckoutScreen: {
    mode?: 'buy_now' | 'cart';
    service_id?: number;
    variant_id?: number;
    bundle_id?: number; // ✅ ADD THIS
      previewData?: any; // 👈 TEMP (recommended)

  };
};

export type ServicePreviewItem = {
  id: number | string;
  service_id: number | null;
  variant_id: number | null;

  service_name: string;
  variant_name: string;
  description: string;

  price: number;
  mrp: number;

  documents: string[];

  isBundle?: boolean;
  bundle_items?: any[];
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  Profile: undefined;
};

type ServiceItem = {
  service_id: number;
  variant_id: number;
  name: string;
  description: string;
  enquiry: number;
  price: number;
  image: string | null;
};

export type ServiceHomeResponse = {
  success: boolean;
  data: {
    quick_services: ServiceItem[];
    popular: ServiceItem[];
    recommended: ServiceItem[];
    value_added: ServiceItem[];
  };
};
