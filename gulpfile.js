'use strict';

const gulp = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglifyjs');
const rename = require('gulp-rename');

const sourceFiles = [ 'src/SafeObject.js' ];
const moduleTypes = [ 'amd', 'systemjs', 'commonjs' ];
const fileName = 'SafeObject';

gulp.task('build:js', function () {
  return gulp.src(sourceFiles)
    .pipe(babel())
    .pipe(gulp.dest('dist'));
});
gulp.task('build:js:min', function () {
  return gulp.src(sourceFiles)
    .pipe(babel())
    .pipe(uglify())
    .pipe(rename('SafeObject.min.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch:js', function () {
  gulp.watch(sourceFiles, [ 'build:js' ]);
});

gulp.task('build', [ 'build:js', 'build:js:min' ]);
gulp.task('default', [ 'build:js', 'watch:js' ]);
