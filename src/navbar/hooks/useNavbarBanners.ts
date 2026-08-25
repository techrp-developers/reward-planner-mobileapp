import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchNavbarContent,
  NavbarContentEntry,
} from "../api/NavbarContentApi";
import { normalizeLocalCmsImageUrl } from "../../config/apiConfig";
import { fetchProductContent } from "../../modules/ecommerce/api/ProductContentApi";
import { TAB_MODULE_MAP, TAB_THEME, TOP_TABS, TopTab } from "../navbarConstants";

// CMS-resolved navbar background content for Services/Payments/DineOut. A
// campaign push elsewhere can invalidate this with
// queryClient.invalidateQueries({ queryKey: navbarContentQueryKey }).
export const navbarContentQueryKey = ["content", "navbar"] as const;

// The Product tab background is sourced from the Product home resolver
// instead (its navbar_background zone), not from /content/resolved/navbar.
export const productContentQueryKey = ["content", "product"] as const;

const BANNERS_STALE_TIME = 5 * 60 * 1000;

export type NavbarBannerTheme = {
  imageUrl: string | null;
  bgColor: string;
};

export type NavbarBannerMap = Record<TopTab, NavbarBannerTheme>;

const buildFallbackBanners = (): NavbarBannerMap =>
  TOP_TABS.reduce((acc, tab) => {
    acc[tab] = { imageUrl: null, bgColor: TAB_THEME[tab].bgColor };
    return acc;
  }, {} as NavbarBannerMap);

// Backend already resolved scheduling/priority/default status — this only
// maps the winning entry's content_type onto the shape Navbar_Background
// renders. Any missing/invalid field falls back to the emergency UI color.
const resolveTabTheme = (
  tab: TopTab,
  entry: NavbarContentEntry | null | undefined
): NavbarBannerTheme => {
  const fallbackColor = TAB_THEME[tab].bgColor;

  if (!entry) {
    return { imageUrl: null, bgColor: fallbackColor };
  }

  if (entry.content_type === "image" && entry.image_url) {
    return {
      imageUrl: normalizeLocalCmsImageUrl(entry.image_url),
      bgColor: entry.color_value || fallbackColor,
    };
  }

  if (entry.content_type === "color" && entry.color_value) {
    return { imageUrl: null, bgColor: entry.color_value };
  }

  return { imageUrl: null, bgColor: fallbackColor };
};

export const useNavbarBanners = () => {
  const {
    data: navbarData,
    isLoading: isNavbarLoading,
    isError: isNavbarError,
  } = useQuery({
    queryKey: navbarContentQueryKey,
    queryFn: fetchNavbarContent,
    staleTime: BANNERS_STALE_TIME,
  });

  const {
    data: productData,
    isLoading: isProductLoading,
    isError: isProductError,
  } = useQuery({
    queryKey: productContentQueryKey,
    queryFn: fetchProductContent,
    staleTime: BANNERS_STALE_TIME,
  });

  const banners = React.useMemo<NavbarBannerMap>(() => {
    const merged = buildFallbackBanners();

    if (navbarData) {
      TOP_TABS.forEach((tab) => {
        if (tab === "Product") return;
        const module = TAB_MODULE_MAP[tab];
        merged[tab] = resolveTabTheme(tab, navbarData[module]);
      });
    }

    // Product's navbar background comes from the Product home resolver's
    // navbar_background zone, never from /content/resolved/navbar's
    // "product" entry.
    merged.Product = resolveTabTheme("Product", productData?.navbar_background ?? null);

    return merged;
  }, [navbarData, productData]);

  React.useEffect(() => {
    console.log("[CMS] Product navbar entry:", productData?.navbar_background);
    console.log("[CMS] Product raw image URL:", productData?.navbar_background?.image_url);
    console.log("[CMS] Product final image URL:", banners.Product.imageUrl);
  }, [banners.Product.imageUrl, productData?.navbar_background]);

  return {
    banners,
    isLoading: isNavbarLoading || isProductLoading,
    isError: isNavbarError || isProductError,
  };
};
