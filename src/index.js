import normalisePostData from './normalisePostData.js';
import './style.pcss';

let data;
const types = ['qm', 'player', 'vote', 'discarded'];

function getBoard() {
	const boardTitle = document.querySelector('.boardTitle');
	if (!boardTitle) {
		throw new Error(`Couldn't detect board title element`);
	}
	switch (boardTitle.innerHTML) {
		case '/qst/ - Quests':
			return 'qst';
		case '/tg/ - Traditional Games':
			return 'tg';
		default:
			throw new Error(`Unrecognised board title: ${boardTitle.innerHTML}`);
	}
}

function getThreadId() {
	return parseInt(document.querySelector('.thread').id.slice(1), 10);
}

function onClick(e) {
	if (!document.querySelector('.sqm-title-form').classList.contains('sqm-hidden')) {
		return;
	}

	let post = e.target;
	while (!post.classList.contains('postMessage') && post.parentNode) {
		post = post.parentNode;
	}
	const id = parseInt(post.id.slice(1), 10);
	for (const type of types) {
		post.classList.remove(`sqm-${type}`);
	}
	let dataObj;
	for (dataObj of data) {
		if (dataObj.number === id) {
			break;
		}
	}
	dataObj.sqmType = types[(types.indexOf(dataObj.sqmType) + 1) % types.length];
	post.classList.add(`sqm-${dataObj.sqmType}`);
	e.stopPropagation();
}

function downloadText(filename, text) {
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	element.setAttribute('download', filename);

	element.style.display = 'none';
	document.body.appendChild(element);

	element.click();

	document.body.removeChild(element);
}

function addExportButton() {
	const inputForm = document.querySelector('.sqm-title-form');
	const button = document.createElement('div');
	button.classList.add('sqm-export-button');
	button.innerHTML = '<a style="cursor: pointer;">EXPORT</a>';
	button.addEventListener('click', () => {
		inputForm.classList.remove('sqm-hidden');
	});
	document.body.appendChild(button);
}

function addTitleInput(board, threadId) {
	const inputForm = document.createElement('div');
	inputForm.classList.add('sqm-title-form', 'sqm-hidden');
	inputForm.innerHTML = `<input type="text">
<button class="sqm-button-cancel">Cancel</button>
<button class="sqm-button-confirm">Confirm</button>`;
	inputForm.querySelector('.sqm-button-cancel').addEventListener('click', () => {
		inputForm.classList.add('sqm-hidden');
	});
	inputForm.querySelector('.sqm-button-confirm').addEventListener('click', () => {
		inputForm.classList.add('sqm-hidden');
		data[0].sqmChapterTitle = inputForm.querySelector('input').value;
		downloadText(`sqm-${board}-${threadId}-${Date.now()}`, JSON.stringify(data, null, '\t'));
	});
	document.body.appendChild(inputForm);
}

function init() {
	const board = getBoard();
	const threadId = getThreadId();
	const thread = document.querySelector('.thread');
	data = Array.from(thread.children).map(post => normalisePostData(post, { board, threadId }));
	console.log(data);

	const opTrip = data[0].trip;
	for (const post of data) {
		let type;
		if (opTrip && post.trip === opTrip) {
			type = 'qm';
			post.sqmType = 'qm';
		} else {
			type = 'player';
			post.sqmType = 'player';
		}
		const postNode = document.getElementById(`m${post.number}`);
		postNode.classList.add(`sqm-${type}`);
		postNode.addEventListener('click', onClick);
	}

	addTitleInput(board, threadId);
	addExportButton();
}

init();
