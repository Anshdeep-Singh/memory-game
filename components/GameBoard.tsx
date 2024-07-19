"use client"
import { FC, useEffect, useState } from 'react';

const emojis = {
  fruits: ['🍎', '🍊', '🍇', '🍉', '🍌', '🍒', '🍓', '🍑', '🥭', '🍍', '🥥', '🍅'],
  animals: ['🐶', '🐱', '🐻', '🦁', '🐼', '🐨', '🐸', '🐵', '🦊', '🐯', '🐷', '🐮'],
  weather: ['☀️', '🌧️', '🌈', '❄️', '🌩️', '🌪️', '🌤️', '🌦️', '🌨️', '🌬️', '🌫️', '🌞'],
} as const;

type EmojiThemes = keyof typeof emojis;

const levels: { theme: EmojiThemes; pairs: number }[] = [
  { theme: 'fruits', pairs: 4 },
  { theme: 'animals', pairs: 6 },
  { theme: 'weather', pairs: 8 },
  { theme: 'fruits', pairs: 10 },
  { theme: 'animals', pairs: 12 },
  { theme: 'weather', pairs: 14 },
];

const shuffleArray = <T,>(array: T[]): T[] => {
  return array.sort(() => Math.random() - 0.5);
};

interface ScoreBoardData {
  topLevel: number;
  flips: number;
  hints: number;
}

const GameBoard: FC = () => {
  const [currentLevel, setCurrentLevel] = useState(0);
  const [cards, setCards] = useState<string[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [timer, setTimer] = useState(60);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showCards, setShowCards] = useState(false);
  const [hintUsed, setHintUsed] = useState(false);
  const [flips, setFlips] = useState(0);
  const [hints, setHints] = useState(0);
  const [mode, setMode] = useState<'challenge' | 'casual'>('challenge'); // New state for mode
  const [scoreBoardData, setScoreBoardData] = useState<ScoreBoardData>({
    topLevel: 0,
    flips: Infinity,
    hints: Infinity,
  });

  useEffect(() => {
    // Load score data from local storage on mount
    const storedData = localStorage.getItem('scoreBoard');
    console.log(currentLevel)
    if (storedData) {
      setScoreBoardData(JSON.parse(storedData));
    }
  }, []);

  useEffect(() => {
    // Reset game when starting or resetting
    if (gameStarted) {
      setCards(generateCardSet());
      setShowCards(true);
      setTimer(mode === 'challenge' ? 60 : 0); // Set timer based on mode
      setTimeout(() => setShowCards(false), 2000);
    }
  }, [gameStarted, mode]);

  useEffect(() => {
    if (timer > 0 && gameStarted && mode === 'challenge') {
      const countdown = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(countdown);
    } else if (timer === 0 && mode === 'challenge') {
      alert('Time is up! Game Over.');
      saveScore();
      resetGame();
    }
  }, [timer, gameStarted]);

  const generateCardSet = () => {
    const { theme, pairs } = levels[currentLevel];
    const themeEmojis = emojis[theme];
    const selectedEmojis = themeEmojis.slice(0, pairs);
    return shuffleArray([...selectedEmojis, ...selectedEmojis]);
  };

  const handleCardClick = (index: number) => {
    if (!gameStarted || flippedCards.length >= 2 || flippedCards.includes(index) || matchedCards.includes(index)) {
      return;
    }

    const newFlippedCards = [...flippedCards, index];
    setFlippedCards(newFlippedCards);
    setFlips((prev) => prev + 1);

    if (newFlippedCards.length === 2) {
      const [firstIndex, secondIndex] = newFlippedCards;
      if (cards[firstIndex] === cards[secondIndex]) {
        setMatchedCards([...matchedCards, firstIndex, secondIndex]);
        setScore((prev) => prev + 10);
      }
      setTimeout(() => setFlippedCards([]), 1000);
    }
  };

  useEffect(() => {
    if (matchedCards.length === cards.length && cards.length >0) {
      if (currentLevel < levels.length - 1) {
        setCurrentLevel(currentLevel + 1);
        setGameStarted(false);
        setHintUsed(false); // Reset hint usage for the next level
      } else {
        alert(`Congratulations! You've completed the game with a score of ${score}.`);
        saveScore();
        resetGame();
      }
    }
  }, [matchedCards]);

  const generateCardSetForLevel = (level: number) => {
    const { theme, pairs } = levels[level];
    const themeEmojis = emojis[theme];
    const selectedEmojis = themeEmojis.slice(0, pairs);
    return shuffleArray([...selectedEmojis, ...selectedEmojis]);
  };
  

  const resetGame = () => {
    setCurrentLevel(0); // Reset to level 0
    setScore(0);
    setFlippedCards([]);
    setMatchedCards([]);
    setCards(generateCardSetForLevel(0)); // Explicitly generate card set for level 0
    setTimer(mode === 'challenge' ? 60 : 0);
    setGameStarted(false);
    setShowCards(false);
    setHintUsed(false);
    setFlips(0);
    setHints(0);
  };
  
  

  const handleHint = () => {
    if (!hintUsed && flippedCards.length === 0 && gameStarted) {
      const unmatchedCards = cards
        .map((emoji, index) => ({ emoji, index }))
        .filter((card) => !matchedCards.includes(card.index));

      // Find pairs of unmatched cards
      const pairs: number[][] = [];
      const seen = new Set<string>();

      unmatchedCards.forEach(({ emoji, index }) => {
        if (seen.has(emoji)) {
          const pairIndex = unmatchedCards.find((c) => c.emoji === emoji && c.index !== index)?.index;
          if (pairIndex !== undefined) {
            pairs.push([index, pairIndex]);
          }
        }
        seen.add(emoji);
      });

      // Shuffle pairs and pick the first pair
      const hintPair = shuffleArray(pairs).shift();
      if (hintPair) {
        setFlippedCards(hintPair);
        setHintUsed(true); // Mark hint as used
        setHints((prev) => prev + 1);
        setTimeout(() => setFlippedCards([]), 1000); // Automatically unflip after a delay
      }
    }
  };

  const startGame = () => {
    setGameStarted(true);
  };

  const saveScore = () => {
    if (typeof window !== 'undefined') {
      const { topLevel, flips: bestFlips, hints: bestHints } = scoreBoardData;

      if (currentLevel > topLevel || 
          (currentLevel === topLevel && (flips < bestFlips || (flips === bestFlips && hints < bestHints)))) {
        const newScoreBoardData: ScoreBoardData = {
          topLevel: currentLevel,
          flips,
          hints,
        };
        localStorage.setItem('scoreBoard', JSON.stringify(newScoreBoardData));
        setScoreBoardData(newScoreBoardData);
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-4">
      <div className="mb-4">
        <div className="flex space-x-4 mb-2">
          <button
            onClick={() => setMode('challenge')}
            className={`px-4 py-2 rounded ${mode === 'challenge' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-black'}`}
          >
            Challenge Mode
          </button>
          <button
            onClick={() => setMode('casual')}
            className={`px-4 py-2 rounded ${mode === 'casual' ? 'bg-blue-600 text-white' : 'bg-gray-400 text-black'}`}
          >
            Casual Mode
          </button>
        </div>
        <div className="flex space-x-4 mb-2">
          <span className="px-4 py-2 bg-blue-600 text-white rounded shadow-lg">Level: {currentLevel + 1}</span>
          <span className="px-4 py-2 bg-green-600 text-white rounded shadow-lg">Score: {score}</span>
          <span className="px-4 py-2 bg-red-600 text-white rounded shadow-lg">Time: {mode === 'challenge' ? timer : 'N/A'}</span>
        </div>
        <div className="flex space-x-4 mb-4">
          <button
            onClick={startGame}
            className="px-4 py-2 bg-teal-600 text-white rounded shadow-lg disabled:opacity-50"
            disabled={gameStarted}
          >
            Start
          </button>
          <button
            onClick={resetGame}
            className="px-4 py-2 bg-red-600 text-white rounded shadow-lg"
          >
            Reset to Level 0
          </button>
          <button
            onClick={handleHint}
            className="px-4 py-2 bg-yellow-500 text-white rounded shadow-lg disabled:opacity-50"
            disabled={hintUsed || flippedCards.length > 0 || !gameStarted}
          >
            Hint
          </button>
        </div>
        <div className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cards.length))}, minmax(0, 1fr))` }}
        >
          {cards.map((emoji, index) => (
            <EmojiCard
              key={index}
              emoji={emoji}
              onClick={() => handleCardClick(index)}
              flipped={flippedCards.includes(index) || matchedCards.includes(index) || showCards}
            />
          ))}
        </div>
      </div>
      <div className="mt-4">
        <h2 className="text-xl font-bold mb-2">Scoreboard</h2>
        <div className="bg-gray-800 text-white p-4 rounded shadow-lg">
          <p className="mb-2"><strong>Top Level:</strong> {scoreBoardData.topLevel}</p>
          <p className="mb-2"><strong>Best Flips:</strong> {scoreBoardData.flips === Infinity ? 'N/A' : scoreBoardData.flips}</p>
          <p><strong>Best Hints:</strong> {scoreBoardData.hints === Infinity ? 'N/A' : scoreBoardData.hints}</p>
        </div>
      </div>
    </div>
  );
  
};

export default GameBoard;


interface EmojiCardProps {
  emoji: string;
  onClick: () => void;
  flipped: boolean;
}

const EmojiCard: FC<EmojiCardProps> = ({ emoji, onClick, flipped }) => (
  <div 
    className={`relative w-16 h-16 md:w-24 md:h-24 lg:w-32 lg:h-32 m-2 flex items-center justify-center border border-gray-300 rounded cursor-pointer transition-transform transform ${flipped ? 'rotate-y-180' : ''}`} 
    onClick={onClick}
  >
    <div className={`absolute backface-hidden w-full h-full flex items-center justify-center ${flipped ? 'hidden' : ''}`}>
      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
        <span className="text-2xl md:text-3xl lg:text-4xl"></span>
      </div>
    </div>
    <div className={`absolute backface-hidden w-full h-full flex items-center justify-center ${flipped ? '' : 'hidden'}`}>
      <div className="w-full h-full bg-white flex items-center justify-center">
        <span className="text-2xl md:text-3xl lg:text-4xl">{emoji}</span>
      </div>
    </div>
  </div>
);

interface PowerUpProps {
  onHint: () => void;
  hintDisabled: boolean;
}

const PowerUp: FC<PowerUpProps> = ({ onHint, hintDisabled }) => {
  return (
    <div className="mb-4">
      <button
        onClick={onHint}
        disabled={hintDisabled}
        className={`px-4 py-2 bg-yellow-500 text-white rounded mr-4 ${hintDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Hint
      </button>
    </div>
  );
};