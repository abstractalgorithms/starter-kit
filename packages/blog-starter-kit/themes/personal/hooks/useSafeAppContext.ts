import { useAppContext } from '../components/contexts/appContext';

export const useSafeAppContext = () => {
	try {
		const context = useAppContext();
		return context;
	} catch (error) {
		// If AppProvider is not available, return null
		return null;
	}
};
