const MakeBookmarklet = require("./MakeBookmarklet.js");

const o_package = require("./package.json");

module.exports = {
	"mode": "production",
	"entry": "./src/qiita_api_get_bookmark.js",
	"output": {
		"filename": "qiita_api_get_bookmark.js"
	},
	"plugins": [
		new MakeBookmarklet({
			"f_encodeURIComponent": false,
			"s_banner": `v${o_package.version}`
		})
	]
};
