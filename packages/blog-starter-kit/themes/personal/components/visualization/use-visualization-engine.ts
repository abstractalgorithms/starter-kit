import { useEffect, useMemo, useState } from 'react';
import { VizAnimationMode, VizFailureMode, VizLayer, VizScenario } from './types';

const getModeSpeed = (mode: VizAnimationMode, speed: number) => {
	if (mode === 'slow') return Math.min(speed, 0.5);
	if (mode === 'failure') return Math.min(speed, 0.75);
	return speed;
};

export const useVisualizationEngine = (scenario: VizScenario) => {
	const [stepIndex, setStepIndex] = useState(0);
	const [playing, setPlaying] = useState(false);
	const [speed, setSpeed] = useState(1);
	const [layer, setLayer] = useState<VizLayer>('overview');
	const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [activeFailureId, setActiveFailureId] = useState<string | null>(null);
	const [animationMode, setAnimationMode] = useState<VizAnimationMode>('normal');

	useEffect(() => {
		setStepIndex(0);
		setPlaying(false);
		setSelectedNodeId(null);
		setActiveFailureId(null);
		setAnimationMode('normal');
	}, [scenario.id]);

	const totalSteps = scenario.steps.length;
	const activeStep = scenario.steps[stepIndex] ?? scenario.steps[0];
	const activeFailure = useMemo(
		() => scenario.failureModes?.find((failure) => failure.id === activeFailureId) ?? null,
		[activeFailureId, scenario.failureModes],
	);
	const selectedNode = useMemo(
		() => scenario.nodes.find((node) => node.id === selectedNodeId) ?? null,
		[scenario.nodes, selectedNodeId],
	);
	const effectiveSpeed = getModeSpeed(animationMode, speed);

	useEffect(() => {
		if (!playing || totalSteps === 0 || animationMode === 'stepping') return;
		const duration = Math.max(700, Math.floor(activeStep.durationMs / effectiveSpeed));
		const timer = window.setTimeout(() => {
			setStepIndex((prev) => (prev + 1 >= totalSteps ? 0 : prev + 1));
		}, duration);
		return () => window.clearTimeout(timer);
	}, [activeStep.durationMs, animationMode, effectiveSpeed, playing, totalSteps]);

	const progressPercent = useMemo(
		() => (totalSteps > 1 ? Math.round((stepIndex / (totalSteps - 1)) * 100) : 100),
		[stepIndex, totalSteps],
	);

	const replayFlow = () => {
		setActiveFailureId(null);
		setAnimationMode('normal');
		setStepIndex(0);
		setPlaying(true);
	};

	const stepThrough = () => {
		setPlaying(false);
		setAnimationMode('stepping');
		setStepIndex((prev) => (prev + 1 >= totalSteps ? 0 : prev + 1));
	};

	const slowMotion = () => {
		setActiveFailureId(null);
		setAnimationMode((prev) => (prev === 'slow' ? 'normal' : 'slow'));
		setPlaying(true);
	};

	const triggerFailure = (failure?: VizFailureMode | null) => {
		const nextFailure = failure ?? scenario.failureModes?.[0] ?? null;
		if (!nextFailure) return;
		setActiveFailureId(nextFailure.id);
		setAnimationMode('failure');
		setPlaying(true);
	};

	const clearFailure = () => {
		setActiveFailureId(null);
		setAnimationMode('normal');
	};

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
		selectedNodeId,
		setSelectedNodeId,
		selectedNode,
		activeStep,
		progressPercent,
		totalSteps,
		activeFailure,
		activeFailureId,
		animationMode,
		setAnimationMode,
		effectiveSpeed,
		replayFlow,
		stepThrough,
		slowMotion,
		triggerFailure,
		clearFailure,
	};
};
