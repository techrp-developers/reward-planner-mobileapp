export function startQuizCountdown(deadline: number, onTick: (seconds: number) => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const update = () => {
    const remaining = Math.max(0, deadline - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    onTick(seconds);

    if (seconds > 0) {
      timer = setTimeout(update, remaining - (seconds - 1) * 1000);
    }
  };

  update();
  return () => clearTimeout(timer);
}
