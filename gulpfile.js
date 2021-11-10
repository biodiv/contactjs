const { src, dest, series } = require('gulp');
const concat = require('gulp-concat');


const productionJSFiles = [
	'src/input-consts.js',
	'src/contact.js',
	'src/gestures.js',
	'src/pointer-listener.js'
];

function transpile(cb) {
  // body omitted
  cb();
}

function bundle (cb) {
	src(productionJSFiles)
		.pipe(concat('contact.js'))
		.pipe(dest('build/'));
		
	cb();
}


exports.build = series(transpile, bundle);
