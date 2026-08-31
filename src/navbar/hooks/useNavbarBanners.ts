import React from "react";
import {
  FALLBACK_NAVBAR_BANNER_MAP,
  fetchNavbarContent,
  NavbarBannerMap,
} from "../api/NavbarContentApi";

export function useNavbarBanners() {
  const [banners, setBanners] = React.useState<NavbarBannerMap>(
    FALLBACK_NAVBAR_BANNER_MAP,
  );

  React.useEffect(() => {
    let cancelled = false;

    fetchNavbarContent().then((data) => {
      if (!cancelled) {
        setBanners(data);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { banners };
}
