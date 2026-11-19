import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { FlatList, Platform, TouchableOpacity } from 'react-native';
import FastImage from '@d11/react-native-fast-image';
import Inbox from '../../src/modules/dashboard/notification/Notification';
import { getMyNotifications, markNotificationAsRead, reportNotificationOpened } from '../../src/modules/dashboard/notification/NotificationAPI';

const mockNavigate = jest.fn();
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ navigate: mockNavigate }),
  useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]),
}));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('react-native-vector-icons/MaterialCommunityIcons', () => 'Icon');
jest.mock('react-native-linear-gradient', () => require('react-native').View);
jest.mock('@d11/react-native-fast-image', () => Object.assign(() => null, {
  cacheControl: { web: 'web' },
  resizeMode: { contain: 'contain' },
}));
jest.mock('../../src/theme/ThemeContext', () => ({
  useAppTheme: () => ({ isDark: false, theme: { card: '#fff', text: '#111', secondaryText: '#555' } }),
}));
jest.mock('../../src/query/queryClient', () => ({ queryClient: { invalidateQueries: jest.fn() } }));
jest.mock('../../src/modules/ecommerce/constants/heading/OrderHeading', () => () => null);
jest.mock('../../src/modules/common/notifications/chatNotificationTarget', () => ({ openConversationIfOwned: jest.fn() }));
jest.mock('../../src/modules/dashboard/notification/NotificationAPI', () => ({
  getMyNotifications: jest.fn(),
  getNotificationBadge: jest.fn(async () => ({ count: 1 })),
  markNotificationAsRead: jest.fn(async () => ({})),
  reportNotificationOpened: jest.fn(async () => ({})),
  NOTIFICATION_PAGE_SIZE: 20,
}));
jest.mock('../../src/config/apiConfig', () => ({ SERVER_URL: 'https://rewardplanners.com' }));

const artwork = 'https://cdn.rewardplanners.com/public/notifications/offers.jpg';
const item = {
  notification_id: 1,
  title: 'Weekend reward offers',
  message: 'Redeem your points.',
  metadata: JSON.stringify({ image_url: artwork, destination_type: 'product', destination_id: 24 }),
  module: 'ecommerce',
  type: 'promotion',
  priority: 'normal',
  is_read: 0,
  created_at: '2026-11-19T08:00:00',
};

describe('Android notification inbox', () => {
  let tree: TestRenderer.ReactTestRenderer;
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
    (getMyNotifications as jest.Mock).mockResolvedValue({ success: true, data: [item] });
  });
  afterEach(async () => {
    await act(async () => tree?.unmount());
    Platform.OS = originalPlatform;
  });

  it('renders the persisted image, uses one card action and marks the row read', async () => {
    await act(async () => { tree = TestRenderer.create(<Inbox />); });
    const image = tree.root.findByType(FastImage);
    expect(image.props.source.uri).toBe(artwork);
    expect(image.props.resizeMode).toBe('contain');
    const card = tree.root.findAllByType(TouchableOpacity)
      .find(node => node.findAllByType(FastImage).length > 0)!;
    await act(async () => {
      card.props.onPress();
      card.props.onPress();
    });
    expect(markNotificationAsRead).toHaveBeenCalledWith(1);
    expect(markNotificationAsRead).toHaveBeenCalledTimes(1);
    expect(reportNotificationOpened).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('Home', {
      screen: 'ProductModule', params: { screen: 'ProductDescription', params: { productId: 24 } },
    });
    expect(tree.root.findByType(FlatList).props.data[0].is_read).toBe(1);
  });

  it('removes the image slot on load failure', async () => {
    await act(async () => { tree = TestRenderer.create(<Inbox />); });
    await act(async () => tree.root.findByType(FastImage).props.onError());
    expect(tree.root.findAllByType(FastImage)).toHaveLength(0);
    expect(tree.root.findByType(FlatList).props.data[0].title).toBe(item.title);
  });

  it('keeps an iOS row compact', async () => {
    Platform.OS = 'ios';
    await act(async () => { tree = TestRenderer.create(<Inbox />); });
    expect(tree.root.findAllByType(FastImage)).toHaveLength(0);
  });
});
