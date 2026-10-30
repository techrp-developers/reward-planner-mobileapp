import { queryClient } from "../../../query/queryClient";

type Listener = () => void;
const listeners = new Set<Listener>();

// The inbox keeps local list state, so it subscribes here to reload when a push
// arrives; the navbar bell is a react-query and is simply invalidated.
export const subscribeNotificationsChanged = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const notifyNotificationsChanged = () => {
  queryClient.invalidateQueries({ queryKey: ["notification"] });
  listeners.forEach(listener => listener());
};
