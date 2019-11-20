const boardToUrlMap = {
	'tg': 'http://suptg.thisisnotatrueending.com/archive/{{threadId}}/',
	'qst': 'http://suptg.thisisnotatrueending.com/qstarchive/{{threadId}}/'
};

function getSuptgUrl(board, threadId) {
	const urlTemplate = boardToUrlMap[board];
	if (urlTemplate) {
		return urlTemplate.replace(/{{threadId}}/g, threadId);
	} else {
		throw new Error(`suptg doesn't support board: ${board}`);
	}
}

export default getSuptgUrl;
