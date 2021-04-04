// Libraries
const path = require('path');
// const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const WebpackNotifierPlugin = require('webpack-notifier');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const recursiveReadSync = require('recursive-readdir-sync');
// require('../postcss.config');

// parse all pug/html files
const getHtmlPlugins = (env='development') => {
	
	const DIR = 'pages';
	const REL_PATH = `views/${DIR}`;
	const ABS_PATH = path.resolve(__dirname, 'src', REL_PATH);

	let files,
		result = [];

	try {
		files = recursiveReadSync(ABS_PATH);
	} catch (err) {
		return Promise.reject(err);
	}

	if (!files || !files.length) {
		return result;
	}
	
	files.forEach( view => {
			
		// ignore file do not have .pug extension
		if (path.extname(view) !== '.pug') {
			return;
		}

		let filename = view.replace(ABS_PATH+'/', '');
		let template = `${REL_PATH}/${filename}`;
		filename = filename.replace('.pug', '');

		const options = {
			filename: filename,
			template: template,
			inject: true
		};

		
		// // this should be production not development
		if (env === 'production') {
			options.minify = {
				collapseWhitespace: true,
				removeComments: true,
				removeRedundantAttributes: true,
				removeScriptTypeAttributes: true,
				removeStyleLinkTypeAttributes: true,
				useShortDoctype: true
			};
		}

		result.push(new HtmlWebpackPlugin(options));
	});

	return result;
};



// Configuration
module.exports = (env) => {

	const DIST_DIR = path.resolve(__dirname, './dist');
	const SRC_DIR = path.resolve(__dirname, './src');

	let config = {
		context: SRC_DIR,
		entry: {
			app: './app.js'
		},
		output: {
			path: DIST_DIR,
			filename: 'assets/js/[name].[hash:7].bundle.js'
		},
		devServer: {
			contentBase: SRC_DIR,
			// any rewites for the dev server need to happen here:
			// https://webpack.js.org/configuration/dev-server/#devserverhistoryapifallback
			historyApiFallback: {
				rewrites: [
					{ from: /^\/$/, to: '/index' },
					{ from: /^\/blog/, to: '/blog/index' },
					// { from: /./, to: '/views/404.html' },
				],
			},		  
		},
		resolve: {
			extensions: ['.js'],
			alias: {
				source: SRC_DIR, // Relative path of src
				images: path.resolve(SRC_DIR, 'assets/images'), // Relative path of images
				fonts: path.resolve(SRC_DIR, 'assets/fonts'), // Relative path of fonts
			}
		},

		/*
		Loaders with configurations
		*/
		module: {
			rules: [
				{
					test: /\.js$/,
					exclude: [/node_modules/],
					use: [
						{
							loader: 'babel-loader',
							options: { presets: ['es2015'] }
						}
					]
				},
				// for 3rd party css
				// {
				// 	test: /\.css$/,
				// 	use: [
				// 		env === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader,
				// 		{
				// 			loader: 'css-loader',
				// 			options: {
				// 				importLoaders: 1,
				// 				sourceMap: true,
				// 				minimize: true,
				// 				colormin: false,
				// 			},
				// 		},
				// 	],
				// },
				{
					test: /\.s[ac]ss$/i,
					use: [
						env === 'development' ? 'style-loader' : MiniCssExtractPlugin.loader, // creates style nodes from JS strings
						{ 
							loader: 'css-loader', 
							options: {
								importLoaders: 1,
								minimize: true,
								sourceMap: true,
								colormin: false
							}
						},
						'postcss-loader',					
						'sass-loader', // compiles Sass to CSS
					],
				},
				{
					test: /\.pug$/,
					use: [
						{
							loader: 'pug-loader'
						}
					]
				},
				{
					test: /\.(png|jpe?g|gif|svg|ico)(\?.*)?$/,
					loader: 'url-loader',
					options: {
						limit: 3000,
						name: 'assets/images/[name].[hash:7].[ext]'
					}
				},
				{
					test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
					loader: 'url-loader',
					options: {
						name: 'assets/fonts/[name].[hash:7].[ext]'
					}
				},
				{
					test: /\.(mp4)(\?.*)?$/,
					loader: 'url-loader',
					options: {
						limit: 10000,
						name: 'assets/videos/[name].[hash:7].[ext]'
					}
				}
			]
		},
		optimization: {
			minimizer: [
				new TerserPlugin({
					cache: true,
					parallel: true,
					sourceMap: true,
				}),
			],
			splitChunks: {
				cacheGroups: {
					default: false,
					vendors: false,
					// vendor chunk
					vendor: {
						filename: 'assets/js/vendor.[hash:7].bundle.js',
						// sync + async chunks
						chunks: 'all',
						// import file path containing node_modules
						test: /node_modules/
					}
				}
			}
		},

		plugins: [

			new CopyWebpackPlugin([
				{ from: 'assets/images/favicons/android-chrome-192x192.png', to: 'android-chrome-192x192.png' },
				{ from: 'assets/images/favicons/android-chrome-512x512.png', to: 'android-chrome-512x512.png' },
				{ from: 'assets/images/favicons/apple-touch-icon.png', to: 'apple-touch-icon.png' },
				{ from: 'assets/images/favicons/browserconfig.xml', to: 'browserconfig.xml' },
				{ from: 'assets/images/favicons/favicon-16x16.png', to: 'favicon-16x16.png' },
				{ from: 'assets/images/favicons/favicon-32x32.png', to: 'favicon-32x32.png' },
				{ from: 'assets/images/favicons/favicon.ico', to: 'favicon.ico' },
				{ from: 'assets/images/favicons/mstile-150x150.png', to: 'mstile-150x150.png' },
				{ from: 'assets/images/favicons/safari-pinned-tab.svg', to: 'safari-pinned-tab.svg' },
				{ from: 'assets/images/favicons/site.webmanifest', to: 'site.webmanifest' },
			]),

			new MiniCssExtractPlugin({
				filename: 'assets/css/[name].[hash:7].bundle.css',
				chunkFilename: '[id].css',
			}),
			
			// new webpack.ProvidePlugin({
			// 	$: 'jquery',
			// 	jQuery: 'jquery',
			// 	'window.$': 'jquery',
			// 	'window.jQuery': 'jquery'
			// }),

			// new WebpackNotifierPlugin({
			// 	title: 'Your project'
			// })

		]

	};

	config.plugins = config.plugins.concat( getHtmlPlugins() );

	return config;
};
