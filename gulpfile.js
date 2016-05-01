'use strict';
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var debug = require('gulp-debug');
var gulpIf = require('gulp-if');
var newer = require('gulp-newer');
var del = require('del');
var prefixer = require('autoprefixer');
var autoprefixer = require('gulp-autoprefixer');
var cached = require('cached'); // Returns only files with differed content(&names?) to it's cached ones.
var remember = require('remember'); /* Returns cached files content not presented in input argument */
var path = require('path');

var isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV == 'development'; // to insert sourcemap only to development version. exclude in production


var stylesPath = 'dev/assets/sass';
var jsPath = 'dev/assets/js';
var imgPath = 'dev/assets/img';
var assetsPath = 'dev/assets';
var anyPath = '/**/*.*';

/* Process SASS files */

/* Apply to one sass file containing all premade @imports  */
gulp.task('styles', function () {
    return gulp.src('dev/assets/sass/**/*.sass')
        // .pipe(debug({title: 'src'}))
        /* apply if using concat for several files. Allows to process only new&modified files to concatenated file, adding unmodifed files to output file from its cache*/
        // .pipe(remember('styles')) 
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        // .pipe(debug({title: 'source-map'}))
        .pipe(sass({ indentedSyntax: true }).on('error', sass.logError))
        .pipe(autoprefixer())
        // Don't use concat, because concat sass files beforehand with @import
        // .pipe(concat('all.css'))
        // .pipe(debug({title: 'sass'}))
        .pipe(gulpIf(isDevelopment, sourcemaps.write())) // If sourcemap.write{'.'} sourcefile will be created in separate file
        .pipe(gulp.dest('dist/styles'));
    // .pipe(debug({title: 'dest'}))
});

gulp.task('styles2', function () {
    return gulp.src('dev/assets/sass/**/*.sass')
        .pipe(gulpIf(isDevelopment, sourcemaps.init()))
        .pipe(sass({ indentedSyntax: true }).on('error', sass.logError))
        // .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
        .pipe(gulp.dest('dist/styles'));
});


gulp.task('styles3', function () {
    return gulp.src('dev/assets/sass/**/*.*')
        // .pipe(autoprefixer({ browsers: ['last 2 versions'] }))
        .pipe(autoprefixer())
        .pipe(concat('all.css'))
        .pipe(gulp.dest('dist/styles'));
});















/* Apply to separate css files */
// Should process only new&modified files, delete removed files, concat many files in one.
gulp.task('stylesConcat', function () {
    return gulp.src('dev/**/*.*')
        .pipe(cached('stylesConcat')) // instead of adding {since: gulp.lastRun('stylesConcat')} to gulp.src, to prevent ctrl-z bug of deleted files.
        .pipe(autoprefixer())
        .pipe(remember('stylesConcat'))
        .pipe(concat('all.css'))
        .pipe(gulp.dest('dist/assets'))
})


/* ========= WATCHERS ==========*/
gulp.task('sass:watch', function () {
    gulp.watch('dev/**/*.sass', ['styles']);//gulp.series('styles', ...)
});


gulp.task('styles:watchDeleted', function () {
    gulp.watch('dev/styles/**/*.*', gulp.series('stylesConcat')).on('unlink', function (filepath) {
        /* make 'remember' and 'cache' remove files, that have been deleted  from dev folder. As a result, if we delete some sass/css files from dev their content won't added to output files from Modules cache */
        remember.forget('stylesConcat', path.resolve(filepath));
        delete cached.caches.stylesConcat[path.resolve(filepath)];
    })   
 });




/* Clean up dist directory */
gulp.task('clean', function (tylesii) {
    return del('dist');
});

/* Copy all assets to dist */
gulp.task('assets', function () {
    // console.log(gulp.lastRun('assets'));

    // return with gulp.src('assets/**/*.{js,css}') - {js,css} all files with these extensions 
    // operates only for files, changed since last run of 'html' task
    return gulp.src('dev/assets/**/*.*', { since: gulp.lastRun('assets') }) // starts filtering after assets run for 2nd time
        .pipe(newer('dist/assets')) //process only new&changed files compared to already existing ones
        .pipe(debug({ title: 'assets' }))
        .pipe(gulp.dest('dist/assets'));
});

/* Makes first build of dist */
gulp.task('build', gulp.series(
    'clean',
    gulp.parallel('assets', 'styles')
));

/* Watch for changes in styles and assets */
gulp.task('watch', function () {
    gulp.watch('dev/styles/**/*.sass', ['styles']);//gulp.series('styles', ...)
    gulp.watch('dev/assets/**/*.*', gulp.series('assets'));
});

/* Init dist version */
gulp.task('dev', gulp.series('build', 'watch'));



/* ========== MISC =========== */

// Choose different dest based on file extension
gulp.task('ext', function () {
    return gulp.src('dev/**/*.*')
        .on('data', function (file) {
            console.log({
                extname: file.extname
            });
        })
        .pipe(gulp.dest(function (file) {
            return file.extname == '.js' ? 'js' : 'other';
        }))
});
