export type YouTubeVideo = {
	id: string;
	title: string;
	description: string;
	publishedAt: string;
	thumbnailUrl: string;
	url: string;
	views: number;
	isShort: boolean;
};

export type YouTubeFeed = {
	channelId: string;
	channelTitle: string;
	channelUrl: string;
	videos: YouTubeVideo[];
};

const decodeXml = (value = '') =>
	value
		.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;|&apos;/g, "'")
		.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
		.trim();

const textBetween = (source: string, tag: string) => {
	const match = source.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i'));
	return decodeXml(match?.[1]);
};

const attribute = (source: string, tag: string, name: string) => {
	const match = source.match(new RegExp(`<${tag}\\b[^>]*\\b${name}="([^"]*)"[^>]*>`, 'i'));
	return decodeXml(match?.[1]);
};

const linkByRel = (source: string, rel: string) => {
	const tags = source.match(/<link\b[^>]*>/gi) ?? [];
	const link = tags.find((tag) => attribute(tag, 'link', 'rel') === rel);
	return link ? attribute(link, 'link', 'href') : '';
};

export const parseYouTubeFeed = (xml: string, fallbackChannelId: string): YouTubeFeed => {
	const feedHeader = xml.split('<entry>')[0] ?? '';
	const channelTitle = textBetween(feedHeader, 'title') || 'YouTube';
	const channelId = textBetween(feedHeader, 'yt:channelId') || fallbackChannelId;
	const channelUrl = linkByRel(feedHeader, 'alternate') || `https://www.youtube.com/channel/${channelId}`;
	const videos = Array.from(xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)).map((match) => {
		const entry = match[1];
		const id = textBetween(entry, 'yt:videoId');
		const url = linkByRel(entry, 'alternate') || `https://www.youtube.com/watch?v=${id}`;
		return {
			id,
			title: textBetween(entry, 'title'),
			description: textBetween(entry, 'media:description'),
			publishedAt: textBetween(entry, 'published'),
			thumbnailUrl:
				attribute(entry, 'media:thumbnail', 'url') || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
			url,
			views: Number(attribute(entry, 'media:statistics', 'views')) || 0,
			isShort: url.includes('/shorts/'),
		};
	});

	return { channelId, channelTitle, channelUrl, videos: videos.filter((video) => video.id && video.title) };
};

export const fetchYouTubeFeed = async (channelId: string): Promise<YouTubeFeed> => {
	const response = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`, {
		headers: { Accept: 'application/atom+xml, application/xml;q=0.9' },
		signal: AbortSignal.timeout(8000),
	});
	if (!response.ok) throw new Error(`YouTube feed returned ${response.status}`);
	return parseYouTubeFeed(await response.text(), channelId);
};
