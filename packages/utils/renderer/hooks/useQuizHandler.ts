import { useEffect } from 'react';

declare global {
	interface Window {
		checkQuizAnswer?: (questionId: string) => void;
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

export const parseQuizContent = (content: string): QuizQuestion[] => {
	const lines = content.trim().split('\n');
	const questions: QuizQuestion[] = [];
	let currentQuestion: (QuizQuestion & { tempCorrect?: string }) | null = null;

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) continue;

		// Match question number
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
		}
		// Match option
		else if (trimmed.match(/^[A-Z]\)\s+/) && currentQuestion) {
			const label = trimmed[0];
			const text = trimmed.replace(/^[A-Z]\)\s+/, '');
			currentQuestion.options.push({
				label,
				text,
				correct: false,
			});
		}
		// Match answer
		else if (trimmed.match(/^Answer[s]?:\s*([A-Z])/i) && currentQuestion) {
			const match = trimmed.match(/^Answer[s]?:\s*([A-Z])/i);
			if (match) {
				currentQuestion.tempCorrect = match[1];
				const correctOption = currentQuestion.options.find((opt) => opt.label === match[1]);
				if (correctOption) {
					correctOption.correct = true;
				}
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

export const useQuizHandler = () => {
	useEffect(() => {
		const quizContainers = document.querySelectorAll('.quiz-container[data-quiz-content]');

		quizContainers.forEach((container: any) => {
			if (container.dataset.quizProcessed) return;

			const encodedContent = container.dataset.quizContent;
			const quizContent = decodeURIComponent(encodedContent);
			const questions = parseQuizContent(quizContent);

			let html = '<div class="quiz-wrapper">';

			questions.forEach((q, idx) => {
				const questionId = `quiz-q-${idx}`;
				html += `
					<div class="quiz-question">
						<p><strong>Question ${q.index}:</strong> ${escapeHtml(q.text)}</p>
						<div class="quiz-options">
				`;

				q.options.forEach((opt) => {
					const optId = `${questionId}-${opt.label}`;
					html += `
						<label class="quiz-option">
							<input type="radio" name="${questionId}" value="${opt.label}" data-correct="${opt.correct ? 'true' : 'false'}" />
							<span class="option-label">${opt.label})</span>
							<span class="option-text">${escapeHtml(opt.text)}</span>
						</label>
					`;
				});

				html += `
						</div>
						<button class="quiz-check-btn" onclick="window.checkQuizAnswer('${questionId}')">Check Answer</button>
						<div id="${questionId}-feedback" class="quiz-feedback"></div>
					</div>
				`;
			});

			html += '</div>';

			container.innerHTML = html;
			container.dataset.quizProcessed = 'true';
		});

		// Define global function for answer checking
		if (typeof window !== 'undefined' && !window.checkQuizAnswer) {
			window.checkQuizAnswer = (questionId: string) => {
				const selected = document.querySelector(
					`input[name="${questionId}"]:checked`,
				) as HTMLInputElement | null;
				const feedback = document.getElementById(`${questionId}-feedback`);

				if (!feedback) return;

				if (!selected) {
					feedback.textContent = 'Please select an answer.';
					feedback.className = 'quiz-feedback show incorrect';
					return;
				}

				const isCorrect = selected.dataset.correct === 'true';
				feedback.textContent = isCorrect ? '✓ Correct!' : '✗ Incorrect. Try again!';
				feedback.className = `quiz-feedback show ${isCorrect ? 'correct' : 'incorrect'}`;
			};
		}
	}, []);
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
