import React, {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { fs, rs } from '../../../utils/responsive';

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#A855F7', '#EC4899', '#FDE047', '#FFFFFF'];

const BURST_COUNT        = 4;
const SPARKS_PER_BURST   = 18;
const BURST_STAGGER_MS   = 320;
const BURST_DURATION_MS  = 1300;
const CONFETTI_COUNT     = 36;
const CONFETTI_DURATION  = 2800;
const BANNER_DURATION_MS = 2600;
const TOTAL_DURATION_MS  = Math.max(
  CONFETTI_DURATION,
  BURST_STAGGER_MS * (BURST_COUNT - 1) + BURST_DURATION_MS,
  BANNER_DURATION_MS,
) + 100;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CrackerCelebrationHandle {
  // Plays the celebration; `message` is shown as a banner in the middle.
  fire: (message?: string) => void;
}

interface Spark {
  dx: number;
  dy: number;
  size: number;
  color: string;
}

interface Burst {
  x: number;
  y: number;
  delay: number;
  sparks: Spark[];
}

interface Confetti {
  x: number;
  start: number;
  fall: number;
  sway: number;
  spin: number;
  width: number;
  height: number;
  color: string;
}

// ─── Single cracker burst ─────────────────────────────────────────────────────

const CrackerBurst = memo(({ burst }: { burst: Burst }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: BURST_DURATION_MS,
      delay: burst.delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [progress, burst.delay]);

  const flashScale   = progress.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.2, 1.6, 2] });
  const flashOpacity = progress.interpolate({ inputRange: [0, 0.05, 0.3], outputRange: [0, 0.9, 0], extrapolate: 'clamp' });
  const sparkOpacity = progress.interpolate({ inputRange: [0, 0.05, 0.7, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={[styles.burstOrigin, { left: burst.x, top: burst.y }]}>
      <Animated.View
        style={[
          styles.flash,
          { opacity: flashOpacity, transform: [{ scale: flashScale }] },
        ]}
      />
      {burst.sparks.map((spark, i) => (
        <Animated.View
          key={i}
          style={[
            styles.spark,
            {
              width: spark.size,
              height: spark.size,
              borderRadius: spark.size / 2,
              backgroundColor: spark.color,
              opacity: sparkOpacity,
              transform: [
                { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [0, spark.dx] }) },
                // Sparks fly out, then gravity pulls them down a little.
                { translateY: progress.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, spark.dy, spark.dy + rs(40)] }) },
                { scale: progress.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0.3, 1.1, 0.5] }) },
              ],
            },
          ]}
        />
      ))}
    </View>
  );
});

// ─── Falling confetti ─────────────────────────────────────────────────────────

const ConfettiRain = memo(({ pieces, height }: { pieces: Confetti[]; height: number }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: CONFETTI_DURATION,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <>
      {pieces.map((piece, i) => (
        <Animated.View
          key={i}
          style={[
            styles.confetti,
            {
              left: piece.x,
              width: piece.width,
              height: piece.height,
              backgroundColor: piece.color,
              opacity: progress.interpolate({ inputRange: [piece.start, piece.start + 0.05, 0.85, 1], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }),
              transform: [
                { translateY: progress.interpolate({ inputRange: [piece.start, 1], outputRange: [-rs(20), height * piece.fall], extrapolate: 'clamp' }) },
                { translateX: progress.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [0, piece.sway, 0, -piece.sway, 0] }) },
                { rotate: progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${piece.spin}deg`] }) },
              ],
            },
          ]}
        />
      ))}
    </>
  );
});

// ─── Banner ───────────────────────────────────────────────────────────────────

const CelebrationBanner = memo(({ message }: { message: string }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: BANNER_DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [progress]);

  return (
    <View style={styles.bannerWrap}>
      <Animated.View
        style={[
          styles.banner,
          {
            opacity: progress.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [{ scale: progress.interpolate({ inputRange: [0, 0.12, 0.2, 1], outputRange: [0.6, 1.08, 1, 1] }) }],
          },
        ]}
      >
        <Text style={styles.bannerText}>{message}</Text>
      </Animated.View>
    </View>
  );
});

// ─── CrackerCelebration ───────────────────────────────────────────────────────
//
// Full-screen, touch-transparent overlay. Each fire() remounts the scene with
// fresh random bursts, so back-to-back wishes restart the show cleanly.
//
// ─────────────────────────────────────────────────────────────────────────────

const CrackerCelebration = forwardRef<CrackerCelebrationHandle>((_props, ref) => {
  const { width, height } = useWindowDimensions();
  const [show, setShow] = useState<{ id: number; message?: string } | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fire = useCallback((message?: string) => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShow({ id: Date.now(), message });
    hideTimerRef.current = setTimeout(() => {
      setShow(null);
      hideTimerRef.current = null;
    }, TOTAL_DURATION_MS);
  }, []);

  useImperativeHandle(ref, () => ({ fire }), [fire]);

  useEffect(() => () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const scene = useMemo(() => {
    if (!show) return null;
    const bursts: Burst[] = Array.from({ length: BURST_COUNT }, (_burst, b) => ({
      x: rand(width * 0.18, width * 0.82),
      y: rand(height * 0.14, height * 0.45),
      delay: b * BURST_STAGGER_MS,
      sparks: Array.from({ length: SPARKS_PER_BURST }, (_spark, s) => {
        const angle = (Math.PI * 2 * s) / SPARKS_PER_BURST + rand(-0.15, 0.15);
        const distance = rand(rs(70), rs(130));
        return {
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance,
          size: rand(rs(4), rs(8)),
          color: pick(COLORS),
        };
      }),
    }));
    const confetti: Confetti[] = Array.from({ length: CONFETTI_COUNT }, () => ({
      x: rand(0, width),
      start: rand(0, 0.35),
      fall: rand(0.75, 1.05),
      sway: rand(rs(10), rs(30)),
      spin: rand(-720, 720),
      width: rand(rs(6), rs(10)),
      height: rand(rs(10), rs(16)),
      color: pick(COLORS),
    }));
    return { bursts, confetti };
    // `show.id` regenerates the scene for every fire()
  }, [show, width, height]);

  if (!show || !scene) return null;

  return (
    <View key={show.id} pointerEvents="none" style={styles.overlay}>
      <ConfettiRain pieces={scene.confetti} height={height} />
      {scene.bursts.map((burst, i) => <CrackerBurst key={i} burst={burst} />)}
      {show.message ? <CelebrationBanner message={show.message} /> : null}
    </View>
  );
});

export default memo(CrackerCelebration);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
    elevation: 999,
  },
  burstOrigin: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flash: {
    position: 'absolute',
    width: rs(36),
    height: rs(36),
    borderRadius: rs(18),
    backgroundColor: 'rgba(253,224,71,0.55)',
  },
  spark: {
    position: 'absolute',
  },
  confetti: {
    position: 'absolute',
    top: 0,
    borderRadius: rs(2),
  },
  bannerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: rs(24),
  },
  banner: {
    backgroundColor: 'rgba(17,24,39,0.88)',
    borderRadius: rs(18),
    borderWidth: 1,
    borderColor: 'rgba(199,210,254,0.35)',
    paddingHorizontal: rs(20),
    paddingVertical: rs(14),
    maxWidth: '100%',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: fs(16),
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: fs(22),
  },
});
