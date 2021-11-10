const { src, dest, series } = require('gulp');
const concat = require('gulp-concat');
const minify = require('gulp-minify');


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

function bundleAndMinify(cb) {

	src(productionJSFiles)
		.pipe(concat('contact.js'))
		.pipe(minify({
			noSource : true,
			ext : {
            	src :'-debug.js',
            	min :'.min.js'
        	}
        }))
		.pipe(dest('build/'));
		
	cb();

}


exports.build = series(transpile, bundle, bundleAndMinify);
