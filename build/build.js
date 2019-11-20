'use strict';

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const rollup = require('rollup').rollup;
const rollupConfig = require('./rollup.config');
const escapeRegExp = require('lodash.escaperegexp');
const packageJson = require('../package.json');

const name = packageJson.name;
const tempDir = path.join(os.tmpdir(), name);
const outputDir = 'dest';
const userScriptHeaderPath = path.join('src', 'userScriptHeader');
const userScriptMetaName = `${name}.meta.js`;
const userScriptMetaPath = path.join(outputDir, userScriptMetaName);
const userScriptName = `${name}.user.js`;
const userScriptPath = path.join(outputDir, userScriptName);
const noUpdateUserScriptName = `${name}-noupdate.user.js`;
const noUpdateUserScriptPath = path.join(outputDir, noUpdateUserScriptName);

const argv = {};
for (let arg of process.argv) {
	if (arg.slice(0, 2) === '--') {
		let [key, value] = arg.slice(2).split('=');
		if (value === undefined) value = true;
		argv[key] = value;
	}
}

if (argv.entry) {
	rollupConfig.entry = argv.entry;
}
rollupConfig.dest = path.join(tempDir, 'bundle.js');

function ensureDirsExist() {
	return Promise.all([
		fs.ensureDir(tempDir),
		fs.ensureDir(outputDir)
	]);
}

function emptyDirs() {
	return Promise.all([
		fs.emptyDir(tempDir),
		fs.emptyDir(outputDir)
	]);
}

function bundle() {
	return rollup(rollupConfig).then(result => {
		return result.write(rollupConfig);
	});
}

function getScriptVersion() {
	return require('../package.json').version;
}

let userScriptHeaderContent;
function getUserScriptHeader() {
	if (userScriptHeaderContent) {
		return Promise.resolve(userScriptHeaderContent);
	} else {
		return fs.readFile(userScriptHeaderPath, 'utf8').then(data => {
			data = replaceTemplateValue(data, 'version', getScriptVersion());
			data = replaceTemplateValue(data, 'outputDir', outputDir);
			data = replaceTemplateValue(data, 'userScriptMetaName', userScriptMetaName);
			data = replaceTemplateValue(data, 'userScriptName', userScriptName);
			userScriptHeaderContent = data;
			return userScriptHeaderContent;
		})
	}
}

function replaceTemplateValue(data, key, value) {
	let re = new RegExp(escapeRegExp('${' + key + '}'), 'g');
	return data.replace(re, value);
}

function createUserScriptMeta() {
	return getUserScriptHeader().then(headerContent => {
		return fs.writeFile(userScriptMetaPath, headerContent, 'utf8');
	});
}

function createUserScript() {
	return Promise.all([
		getUserScriptHeader(),
		fs.readFile(rollupConfig.dest)
	]).then(([headerContent, bundleContent]) => {
		return fs.writeFile(userScriptPath, headerContent + '\n' + bundleContent, 'utf8');
	});
}

function removeUpdateLines(headerContent) {
	let headerLines = headerContent.split('\n');
	headerLines = headerLines.filter(line => {
		return !/(@updateURL|@downloadURL)/.test(line);
	});
	return headerLines.join('\n');
}

function createNoUpdateUserScript() {
	return Promise.all([
		getUserScriptHeader(),
		fs.readFile(rollupConfig.dest)
	]).then(([headerContent, bundleContent]) => {
		headerContent = removeUpdateLines(headerContent);
		return fs.writeFile(noUpdateUserScriptPath, headerContent + '\n' + bundleContent, 'utf8');
	});
}

function deleteTempDir() {
	return fs.remove(tempDir);
}

function cleanUp() {
	return Promise.all([
		deleteTempDir()
	]);
}

function exitWithError(err) {
	console.error(err);
	process.exit(1);
}

function build() {
	return Promise.resolve()
		.then(ensureDirsExist)
		.then(emptyDirs)
		.then(bundle)
		.then(createUserScriptMeta)
		.then(createUserScript)
		.then(createNoUpdateUserScript)
		.then(cleanUp);
}

build().catch(exitWithError);
