'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export type FeatureConfig = {
	interviewPrep: boolean;
	assistant: boolean;
};

const defaults: FeatureConfig = {
	interviewPrep: process.env.NEXT_PUBLIC_ENABLE_INTERVIEW_PREP === 'true',
	assistant: process.env.NEXT_PUBLIC_ENABLE_ASSISTANT === 'true',
};

const FeatureConfigContext = createContext<{ features: FeatureConfig; loading: boolean }>({ features: defaults, loading: true });

export const FeatureConfigProvider = ({ children }: { children: React.ReactNode }) => {
	const [features, setFeatures] = useState(defaults);
	const [loading, setLoading] = useState(true);
	useEffect(() => onSnapshot(
		doc(db, 'appConfig', 'features'),
		(snapshot) => {
			const data = snapshot.data();
			setFeatures({
				interviewPrep: typeof data?.interviewPrep === 'boolean' ? data.interviewPrep : defaults.interviewPrep,
				assistant: typeof data?.assistant === 'boolean' ? data.assistant : defaults.assistant,
			});
			setLoading(false);
		},
		(error) => {
			console.error('Unable to load app feature configuration:', error);
			setLoading(false);
		},
	), []);
	const value = useMemo(() => ({ features, loading }), [features, loading]);
	return <FeatureConfigContext.Provider value={value}>{children}</FeatureConfigContext.Provider>;
};

export const useFeatureConfig = () => useContext(FeatureConfigContext);
