const HtmlPlugin = require('html-webpack-plugin')

module.exports = {
    // Tell webpack to start bundling our app at app/index.js
    entry: 'index.html',
    // Output our app to the dist/ directory


    // Since Webpack only understands JavaScript, we need to
    // add a plugin to tell it how to handle html files.
    plugins: [
        // Configure HtmlPlugin to use our own index.html file
        // as a template.
        // Check out https://github.com/jantimon/html-webpack-plugin
        // for the full list of options.
        new HtmlPlugin({
            template: 'index.html'
        })
    ]
}
