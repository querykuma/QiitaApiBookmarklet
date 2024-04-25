/**
 * @file MakeBookmarklet.js
 * @version: 1.1.0
 */

const fs = require("fs");

class MakeBookmarklet {
	static o_defaultOptions = {
		"f_encodeURIComponent": true,
		"s_banner": ""
	};

	constructor(o_options) {
		this.o_options = {
			...MakeBookmarklet.o_defaultOptions,
			...o_options
		};
	}

	apply(compiler) {
		const s_pluginName = MakeBookmarklet.name;

		compiler.hooks.assetEmitted.tap(s_pluginName, (s_filename, o_info) => {
			const s_targetPath = o_info.targetPath;
			if (!s_targetPath.match(/\.js$/u)) {
				console.log(`${s_filename} は.jsではありません。`);
				return;
			}

			const s_content = o_info.content.toString("utf8");

			const { mode } = o_info.compilation.options;

			if ((mode === void 0 || mode === "production")
				&& !s_content.match(/^\(\(\)=>\{.*\}\)\(\);$/u)) {
				/**
				 * developmentはコメントが多いのでproduction modeのときのみチェックする。
				 * 設定ファイルや引数で指定しなかった場合、modeがundefinedで、production modeになる。
				 */
				console.log(`${s_filename} の中身が予期されない形をしています。`);
				return;
			}

			const s_preceding = `javascript:${this.o_options.s_banner ? `/* ${this.o_options.s_banner} */` : ""}`;
			const s_content2
				= this.o_options.f_encodeURIComponent
					? `${s_preceding}${encodeURIComponent(s_content)}`
					: `${s_preceding}${s_content}`;

			fs.stat(s_targetPath, (err, stats) => {
				if (err) { throw err; }
				if (!stats.isFile()) {
					console.log(`${s_filename} はファイルではありません。`);
					return;
				}

				fs.unlink(s_targetPath, (err2) => {
					if (err2) { throw err2; }

					fs.writeFile(s_targetPath, s_content2, "utf8", (err3) => {
						if (err3) { throw err3; }
						console.log(`${s_filename} をbookmarkletにしました。`);
					});
				});
			});
		});
	}
}

module.exports = MakeBookmarklet;
