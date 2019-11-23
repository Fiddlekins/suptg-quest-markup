// ==UserScript==
// @name          Suptg Quest Markup
// @description   Userscript to assist abstraction of a suptg archived thread into a data format suitable for other purposes
// @author        Fiddlekins
// @version       1.0.0
// @namespace     https://github.com/Fiddlekins/suptg-quest-markup
// @include       http://suptg.thisisnotatrueending.com/archive/*
// @include       https://suptg.thisisnotatrueending.com/archive/*
// @include       http://suptg.thisisnotatrueending.com/qstarchive/*
// @include       https://suptg.thisisnotatrueending.com/qstarchive/*
// @grant         none
// @updateURL     https://github.com/Fiddlekins/suptg-quest-markup/raw/master/dest/suptg-quest-markup.meta.js
// @downloadURL   https://github.com/Fiddlekins/suptg-quest-markup/raw/master/dest/suptg-quest-markup.user.js
// @icon          https://avatars2.githubusercontent.com/u/11947488
// ==/UserScript==

(function () {
'use strict';

function __$styleInject (css, returnValue) {
  if (typeof document === 'undefined') {
    return returnValue;
  }
  css = css || '';
  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';
  if (style.styleSheet){
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
  head.appendChild(style);
  return returnValue;
}

var boardToUrlMap = {
	'tg': 'http://suptg.thisisnotatrueending.com/archive/{{threadId}}/',
	'qst': 'http://suptg.thisisnotatrueending.com/qstarchive/{{threadId}}/'
};

function getSuptgUrl(board, threadId) {
	var urlTemplate = boardToUrlMap[board];
	if (urlTemplate) {
		return urlTemplate.replace(/{{threadId}}/g, threadId);
	} else {
		throw new Error('suptg doesn\'t support board: ' + board);
	}
}

// import moment from 'moment-timezone';

// const moment = require('moment-timezone');
function addPostNumber(post, normalisedPost) {
	var postnumMatch = post.id.match(/pc([0-9]+)/);
	if (postnumMatch && typeof postnumMatch[1] === 'string') {
		normalisedPost.number = parseInt(postnumMatch[1], 10);
	} else {
		throw new Error('Couldn\'t find post number for:\n' + post.outerHTML);
	}
}

function addPosterInfo(post, normalisedPost) {
	var name = post.querySelector('.desktop .name');
	if (name) {
		normalisedPost.name = name.textContent;
	} else {
		throw new Error('Couldn\'t find post name for:\n' + post.outerHTML);
	}
	var postertrip = post.querySelector('.desktop .postertrip');
	if (postertrip) {
		normalisedPost.trip = postertrip.textContent;
	}
	var posteruid = post.querySelector('.desktop .posteruid');
	if (posteruid) {
		normalisedPost.id = posteruid.querySelector('.hand').textContent;
	}
}

function addPostTime(post, normalisedPost) {
	var dateTime = post.querySelector('.desktop .dateTime');
	if (dateTime) {
		var time = parseInt(dateTime.dataset.utc, 10) * 1000;
		normalisedPost.time = time;
		// normalisedPost.time4chanFormatted = get4chanTime(time);
	} else {
		throw new Error('Couldn\'t find post time for:\n' + post.outerHTML);
	}
}

function addPostSubject(post, normalisedPost) {
	var subject = post.querySelector('.desktop .subject');
	if (subject) {
		normalisedPost.subject = subject.textContent;
	}
}

function addPostMedia(post, normalisedPost, _ref) {
	var board = _ref.board,
	    threadId = _ref.threadId;

	var file = post.querySelector('.file');
	if (file) {
		try {
			var img = file.querySelector('img');
			var fileText = file.querySelector('.fileText');
			var fileThumb = file.querySelector('.fileThumb');
			var nameLink = fileText.querySelector('a');
			normalisedPost.filename = nameLink.title || nameLink.textContent;
			normalisedPost.fileSize = img.alt;
			normalisedPost.fileSrc = '' + getSuptgUrl(board, threadId) + fileThumb.href.replace(fileThumb.baseURI, '');
			normalisedPost.fileThumbSrc = '' + getSuptgUrl(board, threadId) + img.src.replace(img.baseURI, '');
			normalisedPost.md5 = img.dataset.md5;
			var dimensionsMatch = fileText.textContent.match(/([0-9]+)x([0-9]+)/i);
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
	var normalisedPost = {};
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

__$styleInject(".sqm-hidden{display:none}.sqm-qm{background-color:rgba(255,0,0,.32941)}.sqm-vote{background-color:rgba(0,7,255,.19)}.sqm-player{background-color:rgba(0,237,255,.18824)}.sqm-discarded{opacity:.5}.sqm-export-button{position:fixed;right:0;top:22px;z-index:100;background:aqua;padding:.2em;font-size:1.5em}.sqm-title-form{position:fixed;top:50vh;left:50vw;-webkit-transform:translate(-50%);transform:translate(-50%);background-color:#7fffd4;padding:1em;border:1px solid #000}.sqm-title-form input{display:block;width:30.5vw}.sqm-title-form button{padding:.25em}", undefined);

var data = void 0;
var types = ['qm', 'player', 'vote', 'discarded'];

function getBoard() {
	var boardTitle = document.querySelector('.boardTitle');
	if (!boardTitle) {
		throw new Error('Couldn\'t detect board title element');
	}
	switch (boardTitle.innerHTML) {
		case '/qst/ - Quests':
			return 'qst';
		case '/tg/ - Traditional Games':
			return 'tg';
		default:
			throw new Error('Unrecognised board title: ' + boardTitle.innerHTML);
	}
}

function getThreadId() {
	return parseInt(document.querySelector('.thread').id.slice(1), 10);
}

function onClick(e) {
	if (!document.querySelector('.sqm-title-form').classList.contains('sqm-hidden')) {
		return;
	}

	var post = e.target;
	while (!post.classList.contains('postMessage') && post.parentNode) {
		post = post.parentNode;
	}
	var id = parseInt(post.id.slice(1), 10);
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {
		for (var _iterator = types[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var type = _step.value;

			post.classList.remove('sqm-' + type);
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}

	var dataObj = void 0;
	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = data[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			dataObj = _step2.value;

			if (dataObj.number === id) {
				break;
			}
		}
	} catch (err) {
		_didIteratorError2 = true;
		_iteratorError2 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion2 && _iterator2.return) {
				_iterator2.return();
			}
		} finally {
			if (_didIteratorError2) {
				throw _iteratorError2;
			}
		}
	}

	dataObj.sqmType = types[(types.indexOf(dataObj.sqmType) + 1) % types.length];
	post.classList.add('sqm-' + dataObj.sqmType);
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
	var inputForm = document.querySelector('.sqm-title-form');
	var button = document.createElement('div');
	button.classList.add('sqm-export-button');
	button.innerHTML = '<a style="cursor: pointer;">EXPORT</a>';
	button.addEventListener('click', function () {
		inputForm.classList.remove('sqm-hidden');
	});
	document.body.appendChild(button);
}

function addTitleInput(threadId) {
	var inputForm = document.createElement('div');
	inputForm.classList.add('sqm-title-form', 'sqm-hidden');
	inputForm.innerHTML = '<input type="text">\n<button class="sqm-button-cancel">Cancel</button>\n<button class="sqm-button-confirm">Confirm</button>';
	inputForm.querySelector('.sqm-button-cancel').addEventListener('click', function () {
		inputForm.classList.add('sqm-hidden');
	});
	inputForm.querySelector('.sqm-button-confirm').addEventListener('click', function () {
		inputForm.classList.add('sqm-hidden');
		data[0].sqmChapterTitle = inputForm.querySelector('input').value;
		downloadText('sqm-' + threadId + '-' + Date.now(), JSON.stringify(data, null, '\t'));
	});
	document.body.appendChild(inputForm);
}

function init() {
	var board = getBoard();
	var threadId = getThreadId();
	var thread = document.querySelector('.thread');
	data = Array.from(thread.children).map(function (post) {
		return normalisePostData(post, { board: board, threadId: threadId });
	});
	console.log(data);

	var opTrip = data[0].trip;
	var _iteratorNormalCompletion3 = true;
	var _didIteratorError3 = false;
	var _iteratorError3 = undefined;

	try {
		for (var _iterator3 = data[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
			var post = _step3.value;

			var type = void 0;
			if (post.trip === opTrip) {
				type = 'qm';
				post.sqmType = 'qm';
			} else {
				type = 'player';
				post.sqmType = 'player';
			}
			var postNode = document.getElementById('m' + post.number);
			postNode.classList.add('sqm-' + type);
			postNode.addEventListener('click', onClick);
		}
	} catch (err) {
		_didIteratorError3 = true;
		_iteratorError3 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion3 && _iterator3.return) {
				_iterator3.return();
			}
		} finally {
			if (_didIteratorError3) {
				throw _iteratorError3;
			}
		}
	}

	addTitleInput(threadId);
	addExportButton();
}

init();

}());
