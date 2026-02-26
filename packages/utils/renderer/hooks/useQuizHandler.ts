import { useEffect } from 'react';

declare global {
	interface Window {
		_quizStates?: Record<string, QuizState>;
		quizSelectOption?: (containerId: string, questionIdx: number, label: string) => void;
		quizNext?: (containerId: string) => void;
		quizRestart?: (containerId: string) => void;
	}
}

export interface QuizQuestion {
	index: number;
	text: string;
	options: {
		label: string;
		text: string;
		correct: boolean;
	}[];
	correctAnswer: string;
}

interface QuizState {
	questions: QuizQuestion[];
	currentIndex: number;
	score: number;
	selected: string | null;
	confirmed: boolean;
}

export const parseQuizContent = (content: string): QuizQuestion[] => {
	const lines = content.trim().split('\n');
	const questions: QuizQuestion[] = [];
	let currentQuestion: (QuizQuestion & { tempCorrect?: string }) | null = null;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		if (trimmed.match(/^\d+\.\s+/)) {
			if (currentQuestion && currentQuestion.text) {
				questions.push({
					index: currentQuestion.index,
					text: currentQuestion.text,
					options: currentQuestion.options,
					correctAnswer: currentQuestion.tempCorrect || '',
				});
			}
			const questionNum = questions.length + 1;
			currentQuestion = {
				index: questionNum,
				text: trimmed.replace(/^\d+\.\s+/, ''),
				options: [],
				correctAnswer: '',
				tempCorrect: '',
			};
		} else if (trimmed.match(/^[A-Z]\)\s+/) && currentQuestion) {
			const label = trimmed[0];
			const text = trimmed.replace(/^[A-Z]\)\s+/, '');
			currentQuestion.options.push({ label, text, correct: false });
		} else if (trimmed.match(/^(?:Correct\s+)?Answer[s]?:\s*([A-Z])/i) && currentQuestion) {
			const match = trimmed.match(/^(?:Correct\s+)?Answer[s]?:\s*([A-Z])/i);
			if (match) {
				currentQuestion.tempCorrect = match[1];
				const correctOption = currentQuestion.options.find((opt) => opt.label === match[1]);
				if (correctOption) correctOption.correct = true;
			}
		}
	}

	if (currentQuestion && currentQuestion.text) {
		questions.push({
			index: currentQuestion.index,
			text: currentQuestion.text,
			options: currentQuestion.options,
			correctAnswer: currentQuestion.tempCorrect || '',
		});
	}

	return questions;
};

function escapeHtml(text: string): string {
	const map: { [key: string]: string } = {
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&#039;',
	};
	return text.replace(/[&<>"']/g, (char) => map[char]);
}

function renderQuiz(container: HTMLElement, state: QuizState): void {
	const { questions, currentIndex, score, selected, confirmed } = state;
	const total = questions.length;

	if (currentIndex >= total) {
		// Score screen
		const pct = Math.round((score / total) * 100);
		const medal = pct === 100 ? '🏆' : pct >= 70 ? '🎉' : pct >= 40 ? '👍' : '📚';
		const msg = pct === 100 ? 'Perfect score!' : pct >= 70 ? 'Great job!' : pct >= 40 ? 'Good effort!' : 'Keep studying!';
		container.innerHTML = `
			<div class="quiz-score-screen">
				<div class="quiz-score-medal">${medal}</div>
				<div class="quiz-score-value">${score} / ${total}</div>
				<div class="quiz-score-msg">${msg}</div>
				<div class="quiz-score-bar-wrap"><div class="quiz-score-bar" style="width:${pct}%"></div></div>
				<button class="quiz-restart-btn" onclick="window.quizRestart('${container.id}')">Try Again</button>
			</div>
		`;
		return;
	}

	const q = questions[currentIndex];
	const isLast = currentIndex === total - 1;
	const progressPct = Math.round((currentIndex / total) * 100);

	let optionsHtml = '';
	q.options.forEach((opt) => {
		let cls = 'quiz-option';
		if (confirmed) {
			if (opt.correct) cls += ' option-correct';
			else if (selected === opt.label && !opt.correct) cls += ' option-wrong';
		} else if (selected === opt.label) {
			cls += ' option-selected';
		}
		const clickHandler = confirmed ? '' : `onclick="window.quizSelectOption('${container.id}', ${currentIndex}, '${opt.label}')"`;
		optionsHtml += `
			<div class="${cls}" ${clickHandler}>
				<span class="option-key">${opt.label}</span>
				<span class="option-text">${escapeHtml(opt.text)}</span>
			</div>
		`;
	});

	let feedbackHtml = '';
	if (confirmed) {
		const isCorrect = selected === q.correctAnswer;
		feedbackHtml = `<div class="quiz-feedback show ${isCorrect ? 'correct' : 'incorrect'}">${isCorrect ? '✓ Correct!' : `✗ The correct answer is ${q.correctAnswer}`}</div>`;
	}

	const nextLabel = isLast ? 'See Score' : 'Next Question →';
	const nextDisabled = !confirmed ? 'disabled' : '';
	const checkDisabled = !selected || confirmed ? 'disabled' : '';

	container.innerHTML = `
		<div class="quiz-header">
			<span class="quiz-progress-text">Question ${currentIndex + 1} of ${total}</span>
			<span class="quiz-score-counter">Score: ${score}</span>
		</div>
		<div class="quiz-progress-bar-wrap"><div class="quiz-progress-bar" style="width:${progressPct}%"></div></div>
		<div class="quiz-body">
			<p class="quiz-question-text">${escapeHtml(q.text)}</p>
			<div class="quiz-options">${optionsHtml}</div>
			${feedbackHtml}
			<div class="quiz-actions">
				<button class="quiz-check-btn" ${checkDisabled} onclick="window.quizSelectOption('${container.id}', ${currentIndex}, window._quizStates?.['${container.id}']?.selected || '')">Confirm</button>
				<button class="quiz-next-btn" ${nextDisabled} onclick="window.quizNext('${container.id}')">${nextLabel}</button>
			</div>
		</div>
	`;
}

export const useQuizHandler = () => {
	useEffect(() => {
		if (typeof window === 'undefined') return;

		if (!window._quizStates) window._quizStates = {};

		const quizContainers = document.querySelectorAll<HTMLElement>('.quiz-container[data-quiz-content]');

		quizContainers.forEach((container, i) => {
			if (!container.id) container.id = `quiz-container-${i}`;
			if (container.dataset.quizProcessed) return;

			const quizContent = decodeURIComponent(container.dataset.quizContent || '');
			const questions = parseQuizContent(quizContent);
			if (!questions.length) return;

			window._quizStates![container.id] = {
				questions,
				currentIndex: 0,
				score: 0,
				selected: null,
				confirmed: false,
			};

			container.dataset.quizProcessed = 'true';
			renderQuiz(container, window._quizStates![container.id]);
		});

		window.quizSelectOption = (containerId: string, questionIdx: number, label: string) => {
			const state = window._quizStates?.[containerId];
			const container = document.getElementById(containerId);
			if (!state || !container || state.confirmed || state.currentIndex !== questionIdx) return;
			// First click selects; second click on same = confirm
			if (state.selected === label) {
				state.confirmed = true;
				if (label === state.questions[state.currentIndex].correctAnswer) state.score++;
			} else {
				state.selected = label;
			}
			renderQuiz(container, state);
		};

		window.quizNext = (containerId: string) => {
			const state = window._quizStates?.[containerId];
			const container = document.getElementById(containerId);
			if (!state || !container || !state.confirmed) return;
			state.currentIndex++;
			state.selected = null;
			state.confirmed = false;
			renderQuiz(container, state);
		};

		window.quizRestart = (containerId: string) => {
			const state = window._quizStates?.[containerId];
			const container = document.getElementById(containerId);
			if (!state || !container) return;
			state.currentIndex = 0;
			state.score = 0;
			state.selected = null;
			state.confirmed = false;
			renderQuiz(container, state);
		};
	}, []);
};
