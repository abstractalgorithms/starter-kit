export const Scripts = () => {
	const googleAnalytics = `
    window.dataLayer = window.dataLayer || [];
	window.gtag = window.gtag || function(){window.dataLayer.push(arguments);};
	window.gtag('js', new Date());`;
	return (
		<>
			<script async src={`https://ping.hashnode.com/gtag/js?id=G-72XG3F8LNJ`} />
			<script dangerouslySetInnerHTML={{ __html: googleAnalytics }} />
		</>
	);
};
