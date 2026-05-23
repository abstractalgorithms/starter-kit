'use client';

import { useEffect, useMemo, useState } from 'react';
import { VizLayer, VizScenario } from './types';

export const useSimulation = (scenario: VizScenario) => {
	const [stepIndex, setStepIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [speed, setSpeed] = useState(1);
	const [layer, setLayer] = useState<VizLayer>('overview');
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

	useEffect(() => {
		setStepIndex(0);
		setPlaying(false);
	}, [scenario.id]);

	const totalSteps = scenario.steps.length;
	const activeStep = scenario.steps[stepIndex] ?? scenario.steps[0];

	useEffect(() => {
		if (!playing || totalSteps === 0) return;
		const duration = Math.max(500, Math.floor(activeStep.durationMs / speed));
		const timer = window.setTimeout(() => {
			setStepIndex((prev) => (prev + 1 >= totalSteps ? 0 : prev + 1));
		}, duration);
		return () => window.clearTimeout(timer);
	}, [activeStep.durationMs, playing, speed, totalSteps]);

	const progressPercent = useMemo(
		() => (totalSteps > 1 ? Math.round((stepIndex / (totalSteps - 1)) * 100) : 100),
		[stepIndex, totalSteps],
	);

	return {
		stepIndex,
		setStepIndex,
		playing,
		setPlaying,
		speed,
		setSpeed,
		layer,
		setLayer,
		hoveredNodeId,
		setHoveredNodeId,
		activeStep,
		progressPercent,
		totalSteps,
	};
};
