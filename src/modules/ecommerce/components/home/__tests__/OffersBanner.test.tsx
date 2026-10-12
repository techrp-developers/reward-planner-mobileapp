import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { FlatList } from 'react-native';
import OffersBanner from '../OffersBanner';

jest.mock('../../../../common/cms/useModuleContent', () => ({
  useModuleContent: () => ({ moduleContent: null }),
  moduleContentQueryKey: jest.fn(),
}));
jest.mock('../../../../common/cms/cmsContentApi', () => ({ fetchResolvedZones: jest.fn() }));
jest.mock('../../../../../query/queryClient', () => ({ queryClient: { prefetchQuery: jest.fn() } }));

describe('CMS offer images', () => {
  let renderer: TestRenderer.ReactTestRenderer;

  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
  });

  const renderOffers = (banner: any) => {
    act(() => {
      renderer = TestRenderer.create(
        <OffersBanner module="service" moduleContent={{ offers_banner: banner }} />,
      );
    });
    return renderer.root.findByType(FlatList).props.data;
  };

  it('renders active numeric and string flags in CMS order', () => {
    const slides = renderOffers({
      content_id: 9,
      content_type: 'image',
      images: [
        { image_id: 1, image_url: 'https://example.com/one.jpg', is_active: '1', sort_order: 2 },
        { image_id: 2, image_url: 'https://example.com/two.jpg', is_active: 1, sort_order: 1 },
        { image_id: 3, image_url: 'https://example.com/hidden.jpg', is_active: 0, sort_order: 0 },
      ],
    });
    expect(slides.map((slide: any) => slide.id)).toEqual(['2', '1']);
  });

  it('renders an older single-image campaign with an empty gallery', () => {
    expect(renderOffers({
      content_id: 9,
      content_type: 'image',
      image_url: 'https://example.com/offer.jpg',
      images: [],
    })).toEqual([{ id: '9', imageUrl: 'https://example.com/offer.jpg' }]);
  });

  it('gives legacy gallery images without IDs distinct keys', () => {
    const slides = renderOffers({
      content_id: 9,
      content_type: 'image',
      images: [
        { image_id: null, image_url: 'https://example.com/one.jpg', is_active: 1, sort_order: 0 },
        { image_id: null, image_url: 'https://example.com/two.jpg', is_active: 1, sort_order: 1 },
      ],
    });
    expect(slides.map((slide: any) => slide.id)).toEqual(['9_0', '9_1']);
  });
});
