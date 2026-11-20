import { useMemo } from "react";
import { useAuth } from "../../common/auth/context/AuthContext";
import {
  HEALTH_FOCUS_CARDS,
  HEALTH_METRICS,
  HEALTH_QUICK_ACTIONS,
} from "../constants/home";
import { formatHealthGreeting } from "../utils/formatHealth";

export const useHealthHome = () => {
  const { user } = useAuth();

  return useMemo(
    () => ({
      title: formatHealthGreeting(user?.name),
      subtitle:
        "Build preventive care, habits and medical support into one calm space.",
      metrics: HEALTH_METRICS,
      quickActions: HEALTH_QUICK_ACTIONS,
      focusCards: HEALTH_FOCUS_CARDS,
    }),
    [user?.name],
  );
};
