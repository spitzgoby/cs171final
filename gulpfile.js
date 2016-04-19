/*-------------*
 *** REQUIRE ***
 *-------------*/
var gulp = require('gulp'),
    autoprefixer = require('gulp-autoprefixer'),
    clean = require('gulp-clean'),
    cleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    sass = require('gulp-ruby-sass'),
    sourcemaps = require('gulp-sourcemaps');

/*-----------*
 *** PATHS ***
 *-----------*/
var paths = {
  src: {
    js: {
      lib: './src/js/lib/*.js', 
      src: './src/js/*.js'
    },
    css: ['./src/css/*.scss', './src/css/*.css']},
  dest: {
    js: './js',
    css: './css'
}};

/*-----------*
 *** STYLE ***
 *-----------*/
gulp.task('styles', ['clean-styles'], function() {
  return sass(paths.src.css, {})
    .pipe(concat('style.css'))
    .pipe(autoprefixer('last 2 version'))
    .pipe(sourcemaps.init())
      .pipe(cleanCSS())
    .pipe(sourcemaps.write(paths.dest.css))
    .pipe(gulp.dest(paths.dest.css));
});

/*-------------*
 *** SCRIPTS ***
 *-------------*/
// concats and minifies library files, should only be run if a lib is updated
gulp.task('libs', ['clean-libs'], function() {
  return gulp.src(paths.src.js.lib)
    .pipe(concat('libs.min.js'))
    .pipe(sourcemaps.init())
      .pipe(uglify())
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.dest.js));
});

/*-----------*
 *** CLEAN ***
 *-----------*/
// clean generated css and sourcemaps
gulp.task('clean-styles', function() {
  return gulp.src([paths.dest.css, paths.dest.css])
    .pipe(clean({read: false}));
});
// clean generated scripts and sourcemaps
gulp.task('clean-libs', function() {
  return gulp.src(paths.dest.js)
    .pipe(clean({read: false}));
});
// clean all generated files
gulp.task('clean', ['clean-styles'])

/*-------------*
 *** DEFAULT ***
 *-------------*/
gulp.task('default', ['styles']);
