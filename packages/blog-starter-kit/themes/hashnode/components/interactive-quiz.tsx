'use client';

import { useState } from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // 0-based index
  explanation?: string;
};

// ─────────────────────────────────────────────
// Parser  –  converts raw ```quiz fence text
// ─────────────────────────────────────────────

/**
 * Parses raw quiz-fence text (the content between ```quiz … ```) into
 * an array of QuizQuestion objects.
 *
 * Supported format:
 *   1. Question text
 *   A) Option A
 *   B) Option B
 *   C) Option C
 *
 *   Correct Answer: B
 */
export function parseQuizContent(raw: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Split on blank lines that precede a new numbered question
  // We normalise line-endings first then split on double newlines
  const blocks = raw
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  // Group lines that belong to the same question (accumulate until we see
  // the next "N. " starter or end of input)
  const questionBlocks: string[][] = [];
  let current: string[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      if (/^\d+\./.test(line) && current.length > 0) {
        questionBlocks.push(current);
        current = [];
      }
      current.push(line);
    }
  }
  if (current.length > 0) questionBlocks.push(current);

  for (const lines of questionBlocks) {
    const questionLines: string[] = [];
    const options: string[] = [];
    let correctLetter = '';

    for (const line of lines) {
      // Option line: A) … or A. …
      if (/^[A-Z][).]/.test(line)) {
        options.push(line.replace(/^[A-Z][).]\s*/, '').trim());
        continue;
      }
      // Correct Answer line
      const correctMatch = line.match(/^Correct\s+Answer\s*:\s*([A-Z])/i);
      if (correctMatch) {
        correctLetter = correctMatch[1].toUpperCase();
        continue;
      }
      questionLines.push(line);
    }

    // Strip leading "N. " or "N) " from the question text
    const questionText = questionLines
      .join(' ')
      .replace(/^\d+[.)]\s*/, '')
      // Strip markdown bold markers (**text**)
      .replace(/\*\*/g, '')
      .trim();

    const correctAnswer = correctLetter ? correctLetter.charCodeAt(0) - 65 : 0;

    if (questionText && options.length > 0) {
      questions.push({
        id: questions.length + 1,
        question: questionText,
        options,
        correctAnswer,
      });
    }
  }

  return questions;
}

// ─────────────────────────────────────────────
// Hardcoded fallback data (used when no prop is passed)
// ─────────────────────────────────────────────

const QUIZ_DATA: QuizQuestion[] = [
  {
    id: 1,
    question:
      'You are designing a Tic Tac Toe game for a 1,000,000 × 1,000,000 board. Storing the full 2D array in memory is too expensive. Most of the board is empty. What data structure should you use for the Board?',
    options: [
      'int[][] — Store the full 2D array in memory',
      'ArrayList<ArrayList<Integer>> — Use nested ArrayLists for dynamic sizing',
      'HashMap<String, Piece> with Key = "row,col" — Only store occupied cells',
    ],
    correctAnswer: 2,
    explanation:
      'A sparse board wastes almost no memory with a HashMap because only occupied cells are stored. A full 2D array would require 10¹² entries — far too much.',
  },
  {
    id: 2,
    question:
      'In the O(1) winning algorithm, why do we use +1 for Player A and −1 for Player B?',
    options: [
      'To save memory by using smaller numbers',
      "So that their moves cancel each other out. If a row has one X (+1) and one O (−1), the sum is 0, correctly indicating no one dominates that row",
      'It is required by the Java compiler for type safety',
    ],
    correctAnswer: 1,
    explanation:
      'Using +1 and −1 lets the running sum self-report the state: if the absolute value of a row/col/diagonal sum equals N, one player owns it entirely.',
  },
  {
    id: 3,
    question:
      'Which Design Pattern is best suited for creating different types of games (e.g., "Standard TicTacToe" vs "3-Player TicTacToe")?',
    options: [
      'Singleton Pattern — Ensures only one game instance exists',
      'Factory Pattern — Creates different game variants based on configuration',
      'Observer Pattern — Notifies players of moves',
    ],
    correctAnswer: 1,
    explanation:
      'The Factory Pattern centralises object creation. A GameFactory can read a config and return the appropriate Game subclass without the caller knowing the concrete type.',
  },
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

type AnswerState = 'idle' | 'correct' | 'wrong';

function getOptionStyle(
  index: number,
  selected: number | null,
  correct: number,
  locked: boolean,
): string {
  // Base: matches theme's border-radius, typography scale, and transition conventions
  const base =
    'w-full text-left rounded-lg border px-5 py-4 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

  if (!locked) {
    // Default idle: slate borders matching theme table/blockquote borders; neutral dark bg
    return `${base} border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:border-neutral-600 dark:hover:bg-neutral-700 cursor-pointer`;
  }

  if (index === correct) {
    // Correct: green — using slate-weight borders to stay subtle, matching callout style
    return `${base} border-green-400 bg-green-50 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300 cursor-default`;
  }

  if (index === selected && selected !== correct) {
    // Wrong selection: red
    return `${base} border-red-400 bg-red-50 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300 cursor-default`;
  }

  // Deselected / unselected locked options: muted, matches theme's disabled text treatment
  return `${base} border-slate-200 bg-white text-slate-400 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-500 cursor-default opacity-50`;
}

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

type Props = {
  questions?: QuizQuestion[];
};

export function InteractiveQuiz({ questions: propQuestions }: Props = {}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const QUIZ = propQuestions && propQuestions.length > 0 ? propQuestions : QUIZ_DATA;
  const total = QUIZ.length;
  const question = QUIZ[currentIndex];
  const progress = ((currentIndex + (locked ? 1 : 0)) / total) * 100;

  function handleSelect(index: number) {
    if (locked) return;
    setSelected(index);
    setLocked(true);
    if (index === question.correctAnswer) {
      setScore((s) => s + 1);
    }
  }

  function handleNext() {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setLocked(false);
    }
  }

  function handleRetake() {
    setCurrentIndex(0);
    setSelected(null);
    setLocked(false);
    setScore(0);
    setFinished(false);
  }

  const answerState: AnswerState =
    !locked ? 'idle' : selected === question?.correctAnswer ? 'correct' : 'wrong';

  // ── Results screen ──────────────────────────
  if (finished) {
    const pct = Math.round((score / total) * 100);
    const perfect = score === total;
    const passing = score >= Math.ceil(total / 2);

    return (
      // Card: matches theme shadow-md, rounded-xl, border-slate-200 / neutral-800 pattern
      <div className="mx-auto my-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-md dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col items-center text-center">
          {/* Badge */}
          <div
            className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl ${
              perfect
                ? 'bg-green-50 dark:bg-green-900/20'
                : passing
                  ? 'bg-primary-50 dark:bg-primary-900/20'
                  : 'bg-yellow-50 dark:bg-yellow-900/20'
            }`}
          >
            {perfect ? '🏆' : passing ? '👍' : '📚'}
          </div>

          {/* Heading uses the theme's heading font via font-heading */}
          <h2 className="mb-1 font-heading text-2xl font-bold text-slate-800 dark:text-white">
            Quiz Complete!
          </h2>
          <p className="mb-6 text-sm text-slate-500 dark:text-neutral-400">
            {perfect
              ? 'Perfect score — nicely done!'
              : passing
                ? 'Good effort. Review the explanations to level up.'
                : "Keep studying — you'll get there!"}
          </p>

          {/* Score */}
          <div className="mb-8 flex flex-col items-center">
            <span className="text-5xl font-extrabold text-slate-800 dark:text-white">
              {score}
              <span className="text-2xl font-semibold text-slate-400 dark:text-neutral-500">
                /{total}
              </span>
            </span>
            <span className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
              {pct}% correct
            </span>
          </div>

          {/* Score bar: matches theme progress bar style */}
          <div className="mb-8 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
            <div
              className={`h-2 rounded-full transition-all duration-700 ${
                perfect ? 'bg-green-500' : passing ? 'bg-primary-600' : 'bg-yellow-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {/* CTA button: matches theme primary Button style — rounded-full, font-semibold */}
          <button
            onClick={handleRetake}
            className="rounded-full border border-primary-600 bg-primary-600 px-5 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Retake Quiz
          </button>
        </div>
      </div>
    );
  }

  // ── Question screen ─────────────────────────
  return (
    // Card matches theme: rounded-xl, border-slate-200/neutral-800, bg-white/neutral-900, shadow-md
    <div className="mx-auto my-10 w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      {/* Header */}
      <div className="border-b border-slate-200 px-6 pt-5 pb-4 dark:border-neutral-800">
        <div className="mb-3 flex items-center justify-between text-xs font-medium text-slate-500 dark:text-neutral-400">
          <span className="font-heading font-semibold uppercase tracking-wide text-slate-400 dark:text-neutral-500">
            Practice Quiz
          </span>
          <span>
            Question {currentIndex + 1} of {total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-neutral-800">
          <div
            className="h-1.5 rounded-full bg-primary-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question body */}
      <div className="px-6 py-6">
        <p className="mb-5 text-base font-semibold leading-relaxed text-slate-800 dark:text-neutral-100">
          {/* Question number pill: primary-100 / primary-700 matches theme's primary token */}
          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
            {question.id}
          </span>
          {question.question}
        </p>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {question.options.map((option, i) => (
            <button
              key={i}
              className={getOptionStyle(i, selected, question.correctAnswer, locked)}
              onClick={() => handleSelect(i)}
              disabled={locked}
            >
              {/* Letter badge: same rounded-full pill style as theme badges */}
              <span className="mr-3 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs font-bold opacity-60">
                {String.fromCharCode(65 + i)}
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Feedback banner: styled after theme's callout component */}
        {locked && (
          <div
            className={`mt-4 flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${
              answerState === 'correct'
                ? 'border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300'
                : 'border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300'
            }`}
          >
            <span className="mt-0.5 shrink-0 font-bold">
              {answerState === 'correct' ? '✓' : '✗'}
            </span>
            <span>
              <span className="font-semibold">
                {answerState === 'correct' ? 'Correct! ' : 'Not quite. '}
              </span>
              {question.explanation}
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-neutral-800">
        {/* Score counter */}
        <span className="text-sm text-slate-500 dark:text-neutral-400">
          Score:{' '}
          <span className="font-semibold text-slate-700 dark:text-neutral-200">{score}</span>
          <span className="text-slate-400 dark:text-neutral-500"> / {total}</span>
        </span>

        {/* Next / Results button: matches theme primary Button — rounded-full */}
        {locked && (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 rounded-full border border-primary-600 bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {currentIndex + 1 >= total ? 'See Results' : 'Next Question'}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default InteractiveQuiz;
