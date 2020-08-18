/**
 * @src 读取文件
 * @dest 输出文件
 * @parallel 异步执行
 * @series 同步执行
 * @watch 监听文件变化
 */
const { src, dest, parallel, series, watch } = require('gulp')
// 删除文件
const del = require('del')
// gulp 插件
const loadPlugins = require('gulp-load-plugins')
const plugins = loadPlugins()
// 热更新
const browserSync = require('browser-sync')
const bs = browserSync.create()

// 线上-打包-名称
const dist = 'dist'
// 临时-打包-名称
const temp = 'temp'
// html中定义变量--data中配置变量
const data = {
  pkg: require('./package.json')
}

// 打包css文件
const style = () => {
  return src('src/assets/styles/**', { base: 'src' })
    .pipe(plugins.sass({ outputStyle: 'expanded' })) // 结尾括号换行
    .pipe(dest(temp))
    .pipe(bs.reload({ stream: true })) // 更改页面后浏览器更新
}

// 打包js文件
const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
    .pipe(plugins.babel({ presets: ['@babel/preset-env'] })) // ES6转换ES5
    .pipe(dest(temp))
    .pipe(bs.reload({ stream: true })) // 更改页面后浏览器更新
}

// 打包html页面
const page = () => {
  return src('src/*.html', { base: 'src' })
    .pipe(plugins.swig({ data, defaults: { cache: false } }))
    .pipe(dest(temp))
    .pipe(bs.reload({ stream: true })) // 更改页面后浏览器更新
}
// 打包图片
const images = () => {
  return src('src/assets/images/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest(dist))
}

// 打包字体文件
const fonts = () => {
  return src('src/assets/fonts/**', { base: 'src' })
    .pipe(dest(dist))
}

// 打包额外文件
const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest(dist))
}

/**
 * 压缩 html 引入的文件中的build注释 
 * eg: build:css assets/styles/make.css
 */
const useref = () => {
  return src('temp/*.html', { base: temp })
    .pipe(plugins.useref({ searchPath: [temp, '.'] }))
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    .pipe(plugins.if(/\.html$/, plugins.htmlmin({
      collapseWhitespace: 'true',
      minifyCss: true,
      minifyJS: true
    })))
    .pipe(dest('dist'))
}

// 启动热更新服务
const serve = () => {
  // 监听文件变化
  watch('src/assets/styles/**', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)

  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ], bs.reload)


  return bs.init({
    notify: false,
    server: {
      baseDir: [temp, 'src', 'public'],
      routes: {
        '/node_modules': 'node_modules'
      }
    }
  })
}

// 清除 dist AND temp 文件
const clean = () => {
  return del([dist, temp])
}


const compile = parallel(style, script, page)
const build = series(clean, parallel(
  series(compile, useref),
  images,
  fonts,
  extra
))
const devlop = series(clean, compile, serve)

module.exports = {
  devlop,
  build,
  serve,
  clean
}