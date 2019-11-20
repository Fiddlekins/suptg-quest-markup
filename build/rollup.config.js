'use strict';

const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');
const babel = require('rollup-plugin-babel');
const postcss = require('rollup-plugin-postcss');
const simplevars = require('postcss-simple-vars');
const nested = require('postcss-nested');
const cssnext = require('postcss-cssnext');
const cssnano = require('cssnano');
const autoprefixer = require('autoprefixer');

module.exports = {
	entry: 'src/index.js',
	format: 'iife',
	plugins: [
		postcss({
			plugins: [
				simplevars(),
				nested(),
				cssnext({ warnForDuplicates: false }),
				cssnano({ safe: true }),
				autoprefixer()
			],
			extensions: ['.css', '.pcss']
		}),
		nodeResolve({
			jsnext: true,
			browser: true,
			extensions: ['.js', '.json']
		}),
		commonjs({
			sourceMap: false
		}),
		babel({})
	],
	dest: 'bundle.js'
};
