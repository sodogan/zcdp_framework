/*eslint-env node*/
/*global module:false*/
module.exports = function (grunt) {
	"use strict";
	grunt.initConfig({

		dir: {
			webapp: "src",
			tests: "test",
			dist: "dist",
			bower_components: "bower_components",
			localServerTestUrl: "http://localhost:<%= port %>/test-resources"
		},

		port: (process.env.PORT || 5000),

		tests: {
			opaTimeout: 900000
		},

		connect: {
			options: {
				port: "<%= port %>",
				hostname: "*"
			},
			src: {
				options: {
					open: {
						target: "http://localhost:<%= port %>/index.html"
					}
				}
			},
			dist: {
				options: {
					open: {
						target: "http://localhost:<%= port %>/build.html"
					}
				}
			}
		},

		openui5_connect: {
			options: {
				resources: [
					"<%= dir.bower_components %>/openui5-sap.ui.core/resources",
					"<%= dir.bower_components %>/openui5-sap.m/resources",
					"<%= dir.bower_components %>/openui5-sap.ui.layout/resources",
					"<%= dir.bower_components %>/openui5-sap.ui.commons/resources",
					"<%= dir.bower_components %>/openui5-sap.ui.ux3/resources",
					"<%= dir.bower_components %>/openui5-sap.ui.unified/resources",
					"<%= dir.bower_components %>/openui5-themelib_sap_bluecrystal/resources",
				]
			},
			src: {
				options: {
					appresources: ["."],
					testresources: ["<%= dir.tests %>"]
				}
			},
			dist: {
				options: {
					appresources: ".",
					testresources: ["<%= dir.tests %>"]
				}
			}
		},

		openui5_preload: {
			component: {
				options: {
					resources: {
						cwd: "<%= dir.webapp %>",
						prefix: "aklc/cm"
					},
					dest: "<%= dir.dist %>"
				},
				components: true,
				compress: true
			},
			library: {
				options: {
					resources: {
						cwd: "<%= dir.webapp %>/library/common",
						prefix: "aklc/cm/library/common",
						src: [
							"*.js",
							"{controller,controls,i18n,fragments,utils,view}/*.{js,json,xml,html,properties}"
						]
					},
					dest: "<%= dir.webapp %>/library/common",
					compress: true
				},
				libraries: "aklc/cm/library/common",
				prefix: "aklc/cm/library/common"
			}
		},

		clean: {
			dist: "<%= dir.dist %>/"
		},

		copy: {
			dist: {
				files: [{
					expand: true,
					cwd: "<%= dir.webapp %>",
					src: [
						"**",
						"!test/**"
					],
					dest: "<%= dir.dist %>"
				}]
			}
		},

		eslint: {
			options: {
				quiet: true
			},

			all: ["<%= dir.tests %>", "<%= dir.webapp %>"],
			webapp: ["<%= dir.webapp %>"]
		},

		karma: {
			options: {
				basePath: "",
				proxies: {
					"/resources/": "http://localhost:<%= port %>/resources/",
					"/index.html": "http://localhost:<%= port %>/index.html",
					"/src/": "http://localhost:<%= port %>/src/",
					"/test/": "http://localhost:<%= port %>/test/"
				},
				frameworks: ["openui5", "qunit", "phantomjs-shim"],
				openui5: {
					path: "http://localhost:9876/resources/sap-ui-core-dbg.js"
				},
				client: {
					openui5: {
						config: {
							bindingSyntax: "complex",
							language: "en-US",
							theme: "sap_bluecrystal",
							libs: "sap.m",
							resourceroots: {
								"aklc.cm": "./src/",
								test: "./test/",
								"aklc.cm.index": "/index"
							}
						}
					}
				},
				files: [{
					pattern: "test/karma-qunit.js",
					included: true
				}, {
					pattern: "src/**/*",
					included: false
				}, {
					pattern: "test/**/!(allTests.js|AllJourneys.js)",
					included: false
				}],
				port: 9876,
				colors: true,
				logLevel: "ERROR", //"INFO",
				browsers: ["PhantomJS_custom"], //"Chrome_without_security"], //
				customLaunchers: {
					"PhantomJS_custom": {
						base: "PhantomJS",
						options: {
							windowName: "my-window",
							settings: {
								webSecurityEnabled: false
							}
						},
						flags: ["--load-images=true"],
						debug: true
					},
					"Chrome_without_security": {
						base: "Chrome",
						flags: ["--disable-web-security"]
					}
				}

			},
			unitTests: {
				files: [{
					src: ["test/unit/allTests.js"],
					included: true
				}],
				reporters: ["progress", "coverage"],
				autoWatch: true,
				singleRun: false
			},
			unitTests_ci: {
				files: [{
					src: ["test/unit/allTests.js"],
					included: true
				}],
				reporters: ["progress", "coverage"],
				preprocessors: {
					"src/**/*.js": ["coverage"]
				},
				coverageReporter: {
					type: "html",
					dir: "reports/coverage/unit"
				},
				autoWatch: false,
				singleRun: true
			},
			integrationTests: {
				files: [{
					src: ["test/integration/AllJourneys.js"],
					included: true
				}],
				reporters: ["progress"],
				autoWatch: true,
				singleRun: false
			},
			integrationTests_ci: {
				files: [{
					src: ["test/integration/AllJourneys.js"],
					included: true
				}],
				reporters: ["progress"],
				autoWatch: true, //??
				singleRun: true
			}
		}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks("grunt-contrib-connect");
	grunt.loadNpmTasks("grunt-contrib-clean");
	grunt.loadNpmTasks("grunt-contrib-copy");
	grunt.loadNpmTasks("grunt-openui5");
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-karma");

	// Server task
	grunt.registerTask("serve", function (target) {
		grunt.task.run("openui5_connect:" + (target || "src") + ":keepalive");
	});

	// Linting task
	grunt.registerTask("lint", ["eslint:all"]);

	// Build task
	grunt.registerTask("build", ["lint", "clean", "openui5_preload", "copy"]);
	grunt.registerTask("buildRun", ["build", "serve:dist"]);
	grunt.registerTask("test", ["openui5_connect:src", "karma:unitTests_ci", "karma:integrationTests_ci"]);
	grunt.registerTask("unitTests", ["openui5_connect:src", "karma:unitTests"]);
	grunt.registerTask("unitTests_ci", ["openui5_connect:src", "karma:unitTests_ci"]);
	grunt.registerTask("integrationTests", ["openui5_connect:src", "karma:integrationTests"]);
	grunt.registerTask("integrationTests_ci", ["openui5_connect:src", "karma:integrationTests_ci"]);
	// Default task
	grunt.registerTask("default", [
		"lint:all",
		"test"
	]);
};