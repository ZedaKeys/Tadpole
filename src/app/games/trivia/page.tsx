'use client';

import { useState, useMemo, useCallback } from 'react';
import { ArrowLeft, Trophy, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { trivia } from '@/data/games/trivia';
import { Badge } from '@/components/ui/Badge';
import { AppShell } from '@/components/layout/AppShell';
import type { TriviaQuestion } from '@/types';

type Difficulty = 'all' | 'easy' | 'medium' | 'hard';

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: '#22c55e',
  medium: '#f59e0b',
  hard: '#ef4444',
};

export default function TriviaPage() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const filteredQuestions = useMemo(() => {
    if (difficulty === 'all') return trivia;
    return trivia.filter((q) => q.difficulty === difficulty);
  }, [difficulty]);

  const currentQuestion: TriviaQuestion | undefined = filteredQuestions[currentIndex];

  const handleAnswer = useCallback(
    (optionIndex: number) => {
      if (selectedAnswer !== null || !currentQuestion) return;

      setSelectedAnswer(optionIndex);
      setAnswered((prev) => prev + 1);

      if (optionIndex === currentQuestion.correctIndex) {
        setScore((prev) => prev + 1);
      }
    },
    [selectedAnswer, currentQuestion],
  );

  const handleNext = useCallback(() => {
    if (currentIndex + 1 >= filteredQuestions.length) {
      setGameOver(true);
    } else {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
    }
  }, [currentIndex, filteredQuestions.length]);

  const handleRestart = useCallback(() => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(0);
    setGameOver(false);
  }, []);

  const handleDifficultyChange = useCallback((d: Difficulty) => {
    setDifficulty(d);
    handleRestart();
  }, [handleRestart]);

  const isCorrect = selectedAnswer === currentQuestion?.correctIndex;
  const percentage = answered > 0 ? Math.round((score / answered) * 100) : 0;

  // Game over screen
  if (gameOver) {
    return (
      <AppShell title="BG3 Trivia">
        <button
          onClick={() => router.push('/games')}
          className="touch-target flex items-center gap-1 mb-4 rounded-lg"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '0.875rem',
            padding: 0,
            minHeight: 44,
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Games</span>
        </button>

        <div
          className="rounded-xl p-6 text-center"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Trophy size={48} style={{ color: 'var(--accent)', marginBottom: 12 }} />
          <h2
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Game Over!
          </h2>
          <p
            className="mb-4"
            style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}
          >
            You answered {score} out of {answered} questions correctly.
          </p>

          {/* Score display */}
          <div
            className="rounded-lg p-4 mb-5 inline-block"
            style={{
              background: 'var(--surface-hover)',
              border: '1px solid var(--border)',
              minWidth: 120,
            }}
          >
            <div
              className="font-mono-num"
              style={{
                color: percentage >= 70 ? 'var(--success)' : percentage >= 40 ? 'var(--warning)' : 'var(--danger)',
                fontSize: '2.5rem',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {percentage}%
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 4 }}>
              {percentage >= 70 ? 'Excellent!' : percentage >= 40 ? 'Not bad!' : 'Keep practicing!'}
            </div>
          </div>

          <button
            onClick={handleRestart}
            className="touch-target w-full rounded-xl py-3 flex items-center justify-center gap-2 font-semibold"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              minHeight: 44,
            }}
          >
            <RotateCcw size={18} />
            Play Again
          </button>
        </div>
      </AppShell>
    );
  }

  // No questions for selected difficulty
  if (!currentQuestion) {
    return (
      <AppShell title="BG3 Trivia">
        <button
          onClick={() => router.push('/games')}
          className="touch-target flex items-center gap-1 mb-4 rounded-lg"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent)',
            fontSize: '0.875rem',
            padding: 0,
            minHeight: 44,
          }}
        >
          <ArrowLeft size={18} />
          <span>Back to Games</span>
        </button>

        <div className="text-center py-12">
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            No questions available for this difficulty.
          </p>
          <button
            onClick={() => handleDifficultyChange('all')}
            className="touch-target mt-4 rounded-lg px-6 py-3 font-medium"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
            }}
          >
            Show All Questions
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="BG3 Trivia">
      {/* Back button */}
      <button
        onClick={() => router.push('/games')}
        className="touch-target flex items-center gap-1 mb-4 rounded-lg"
        style={{
          background: 'transparent',
          border: 'none',
          color: 'var(--accent)',
          fontSize: '0.875rem',
          padding: 0,
          minHeight: 44,
        }}
      >
        <ArrowLeft size={18} />
        <span>Back to Games</span>
      </button>

      {/* Score bar */}
      <div
        className="flex items-center justify-between mb-4 rounded-lg p-3"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: 'var(--accent)' }} />
          <span
            className="font-mono-num"
            style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}
          >
            {score}/{answered}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            label={currentQuestion.difficulty}
            color={DIFFICULTY_COLORS[currentQuestion.difficulty]}
          />
          <span
            style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}
          >
            {currentIndex + 1}/{filteredQuestions.length}
          </span>
        </div>
      </div>

      {/* Difficulty filter */}
      <div className="flex gap-2 mb-4">
        {(['all', 'easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
          <button
            key={d}
            onClick={() => handleDifficultyChange(d)}
            className="touch-target rounded-lg px-3 py-2 capitalize"
            style={{
              background: difficulty === d ? 'var(--accent)' : 'var(--surface)',
              border: `1px solid ${difficulty === d ? 'var(--accent)' : 'var(--border)'}`,
              color: difficulty === d ? '#fff' : 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 600,
              flex: 1,
            }}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="w-full rounded-full overflow-hidden mb-5"
        style={{ height: 6, background: 'var(--surface-active)' }}
      >
        <div
          className="rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${((currentIndex + (selectedAnswer !== null ? 1 : 0)) / filteredQuestions.length) * 100}%`,
            height: '100%',
            background: 'var(--accent)',
          }}
        />
      </div>

      {/* Question */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="mb-2">
          <Badge label={currentQuestion.category} color="#6366f1" />
        </div>
        <h3
          className="font-semibold text-base leading-relaxed"
          style={{ color: 'var(--text-primary)' }}
        >
          {currentQuestion.question}
        </h3>
      </div>

      {/* Answer options */}
      <div className="space-y-2 mb-4">
        {currentQuestion.options.map((option, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrectOption = i === currentQuestion.correctIndex;
          const answeredState = selectedAnswer !== null;

          let bg = 'var(--surface)';
          let borderColor = 'var(--border)';
          let textColor = 'var(--text-primary)';

          if (answeredState) {
            if (isCorrectOption) {
              bg = '#22c55e15';
              borderColor = '#22c55e';
              textColor = '#22c55e';
            } else if (isSelected) {
              bg = '#ef444415';
              borderColor = '#ef4444';
              textColor = '#ef4444';
            } else {
              textColor = 'var(--text-muted)';
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={answeredState}
              className="touch-target w-full rounded-xl p-4 text-left flex items-center gap-3 transition-all duration-200"
              style={{
                background: bg,
                border: `2px solid ${borderColor}`,
                color: textColor,
                cursor: answeredState ? 'default' : 'pointer',
                opacity: answeredState && !isCorrectOption && !isSelected ? 0.5 : 1,
                minHeight: 44,
              }}
            >
              <span
                className="flex-shrink-0 flex items-center justify-center rounded-full font-semibold"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: '0.75rem',
                  background: answeredState && isCorrectOption
                    ? '#22c55e'
                    : answeredState && isSelected
                      ? '#ef4444'
                      : 'var(--surface-active)',
                  color: answeredState && (isCorrectOption || isSelected) ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {answeredState && isCorrectOption ? (
                  <CheckCircle size={16} />
                ) : answeredState && isSelected ? (
                  <XCircle size={16} />
                ) : (
                  String.fromCharCode(65 + i)
                )}
              </span>
              <span className="text-sm leading-relaxed">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Explanation (after answering) */}
      {selectedAnswer !== null && (
        <div
          className="rounded-xl p-4 mb-4"
          style={{
            background: isCorrect ? '#22c55e10' : '#ef444410',
            border: `1px solid ${isCorrect ? '#22c55e40' : '#ef444440'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <CheckCircle size={16} style={{ color: '#22c55e' }} />
            ) : (
              <XCircle size={16} style={{ color: '#ef4444' }} />
            )}
            <span
              className="font-semibold text-sm"
              style={{ color: isCorrect ? '#22c55e' : '#ef4444' }}
            >
              {isCorrect ? 'Correct!' : 'Wrong!'}
            </span>
          </div>
          {currentQuestion.explanation && (
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              {currentQuestion.explanation}
            </p>
          )}
        </div>
      )}

      {/* Next button */}
      {selectedAnswer !== null && (
        <button
          onClick={handleNext}
          className="touch-target w-full rounded-xl py-3 font-semibold"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            border: 'none',
            minHeight: 44,
          }}
        >
          {currentIndex + 1 >= filteredQuestions.length ? 'See Results' : 'Next Question'}
        </button>
      )}
    </AppShell>
  );
}
