// import moment from 'moment-timezone';

// const moment = require('moment-timezone');
import getSuptgUrl from './getSuptgUrl.js';

function get4chanTime(time) {
	return moment.tz(time, 'Europe/London').tz('America/New_York').format('MM/DD/YY(ddd)HH:mm:ss');
}

function addPostNumber(post, normalisedPost) {
	const postnumMatch = post.id.match(/pc([0-9]+)/);
	if (postnumMatch && typeof postnumMatch[1] === 'string') {
		normalisedPost.number = parseInt(postnumMatch[1], 10);
	} else {
		throw new Error(`Couldn't find post number for:\n${post.outerHTML}`);
	}
}

function addPosterInfo(post, normalisedPost) {
	const name = post.querySelector('.desktop .name');
	if (name) {
		normalisedPost.name = name.textContent;
	} else {
		throw new Error(`Couldn't find post name for:\n${post.outerHTML}`);
	}
	const postertrip = post.querySelector('.desktop .postertrip');
	if (postertrip) {
		normalisedPost.trip = postertrip.textContent;
	}
	const posteruid = post.querySelector('.desktop .posteruid');
	if (posteruid) {
		normalisedPost.id = posteruid.querySelector('.hand').textContent;
	}
}

function addPostTime(post, normalisedPost) {
	const dateTime = post.querySelector('.desktop .dateTime');
	if (dateTime) {
		const time = parseInt(dateTime.dataset.utc, 10) * 1000;
		normalisedPost.time = time;
		// normalisedPost.time4chanFormatted = get4chanTime(time);
	} else {
		throw new Error(`Couldn't find post time for:\n${post.outerHTML}`);
	}
}

function addPostSubject(post, normalisedPost) {
	const subject = post.querySelector('.desktop .subject');
	if (subject) {
		normalisedPost.subject = subject.textContent;
	}
}

function addPostMedia(post, normalisedPost, { board, threadId }) {
	const file = post.querySelector('.file');
	if (file) {
		try {
			const img = file.querySelector('img');
			if (img.getAttribute('alt') === 'File deleted.') {
				normalisedPost.fileDeleted = true;
				return;
			}
			const fileText = file.querySelector('.fileText');
			const fileThumb = file.querySelector('.fileThumb');
			const nameLink = fileText.querySelector('a');
			normalisedPost.filename = nameLink.title || nameLink.textContent;
			normalisedPost.fileSize = img.alt;
			normalisedPost.fileSrc = `${getSuptgUrl(board, threadId)}${fileThumb.href.replace(fileThumb.baseURI, '')}`;
			normalisedPost.fileThumbSrc = `${getSuptgUrl(board, threadId)}${img.src.replace(img.baseURI, '')}`;
			normalisedPost.md5 = img.dataset.md5;
			const dimensionsMatch = fileText.textContent.match(/([0-9]+)x([0-9]+)/i);
			normalisedPost.w = parseInt(dimensionsMatch[1], 10);
			normalisedPost.h = parseInt(dimensionsMatch[2], 10);
			normalisedPost.tn_w = parseInt(img.style.width, 10);
			normalisedPost.tn_h = parseInt(img.style.height, 10);
		} catch (err) {
			console.log(post.outerHTML);
			throw err;
		}
	}

}

function normalisePostData(post, options) {
	const normalisedPost = {};
	normalisedPost.isOp = post.classList.contains('opContainer');
	normalisedPost.threadNumber = options.threadId;
	addPostNumber(post, normalisedPost);
	addPostSubject(post, normalisedPost);
	addPosterInfo(post, normalisedPost);
	addPostTime(post, normalisedPost);
	normalisedPost.comment = post.querySelector('.postMessage').innerHTML;
	addPostMedia(post, normalisedPost, options);
	return normalisedPost;
}

export default normalisePostData;
