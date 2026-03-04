import { useCallback, useEffect, useRef, useState } from "react";

type RestTimerState = {
  isRunning: boolean;
  secondsLeft: number;
  totalSeconds: number;
  start: (seconds: number) => void;
  stop: () => void;
  progress: number;
};

export function useRestTimer(): RestTimerState {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    setIsRunning(false);
    setSecondsLeft(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (seconds: number) => {
      stop();
      setTotalSeconds(seconds);
      setSecondsLeft(seconds);
      setIsRunning(true);
    },
    [stop]
  );

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false);
          // Vibrate on timer complete
          if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200]);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  const progress =
    totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return { isRunning, secondsLeft, totalSeconds, start, stop, progress };
}
