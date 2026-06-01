import { useState, useEffect, useCallback } from "react";

export default function useTimedGame(initialTime = 30) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [gameActive, setGameActive] = useState(false);
  const [gameFinished, setGameFinished] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    let timer;
    if (gameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setGameActive(false);
            setGameFinished(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [gameActive, timeLeft]);

  const startGame = useCallback(() => {
    setTimeLeft(initialTime);
    setGameActive(true);
    setGameFinished(false);
    setScore(0);
  }, [initialTime]);

  const stopGame = useCallback(() => {
    setGameActive(false);
    setGameFinished(false);
    setTimeLeft(initialTime);
    setScore(0);
  }, [initialTime]);

  const incrementScore = useCallback(() => {
    setScore((s) => s + 1);
  }, []);

  return {
    timeLeft,
    setTimeLeft,
    gameActive,
    setGameActive,
    gameFinished,
    setGameFinished,
    score,
    setScore,
    startGame,
    stopGame,
    incrementScore
  };
}
