import React, { useState, useEffect } from 'react';

const loadingMessages = [
  "완벽한 챌린지를 생성 중...",
  "연필을 깎는 중...",
  "숫자를 계산하고 있어요...",
  "X, Y, Z 값을 푸는 중...",
  "알고 계셨나요? 수학 퍼즐은 기억력을 향상시킬 수 있어요.",
  "두뇌 운동을 준비하세요!",
  "0으로 나누는 중... 농담이에요!",
];

const LoadingSpinner: React.FC = () => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setMessageIndex((prevIndex) => (prevIndex + 1) % loadingMessages.length);
    }, 2500); // 2.5초마다 메시지 변경

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 정리
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 text-center">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-600 font-medium px-4 h-10 flex items-center transition-opacity duration-500">
        {loadingMessages[messageIndex]}
      </p>
    </div>
  );
};

export default LoadingSpinner;
