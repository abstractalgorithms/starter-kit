import type { Variants } from 'framer-motion';

export const MOTION_TIMING = {
	instant: 0.12,
	fast: 0.18,
	standard: 0.28,
	slow: 0.42,
} as const;

export const MOTION_EASE = {
	emphasized: [0.22, 1, 0.36, 1] as const,
	standard: [0.2, 0, 0, 1] as const,
} as const;

export const getRevealVariants = (reduceMotion: boolean | null): Variants =>
	reduceMotion
		? {
				hidden: { opacity: 1, y: 0, scale: 1 },
				show: { opacity: 1, y: 0, scale: 1 },
		  }
		: {
				hidden: { opacity: 0, y: 10, scale: 0.995 },
				show: {
					opacity: 1,
					y: 0,
					scale: 1,
					transition: { duration: MOTION_TIMING.standard, ease: MOTION_EASE.emphasized },
				},
		  };

export const getHoverLift = (reduceMotion: boolean | null) =>
	reduceMotion
		? undefined
		: {
				y: -3,
				transition: { duration: MOTION_TIMING.fast, ease: MOTION_EASE.standard },
		  };

export const getTapScale = (reduceMotion: boolean | null) =>
	reduceMotion
		? undefined
		: {
				scale: 0.985,
				transition: { duration: MOTION_TIMING.fast, ease: MOTION_EASE.standard },
		  };
