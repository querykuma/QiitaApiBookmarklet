javascript: (() => {/* eslint-disable-line no-unused-labels */
	/**
	 * ブックマークレット名： Qiita記事一覧をコピー
	 * QiitaのURLから判断してタグか検索語かユーザーIDの記事一覧かをQiita APIで取得してExcelに添付できるタブ区切りでクリップボードにコピーかダウンロードする。
	 * IPアドレスごとに1時間に60回までのリクエスト制限がある。
	 * v1.1.0 | MIT License Copyright (c) 2024 Query Kuma
	 */

	/* ここからUI関数 */
	const ui_open_dialog = (s_type, s_arg, f_callback) => {
		let qag_dialog = document.getElementById("qag_dialog");
		if (qag_dialog) {
			qag_dialog.remove();
		}

		document.body.insertAdjacentHTML("beforeend", `<dialog id="qag_dialog" style="margin: auto; padding: 10px;">
		<form id="qag_form">
			<div>次の記事を取得します。</div>
			<div id="qag_target" style="margin-inline-start: 20px; margin-block-start: 10px;"></div>
			<div id="qag_buttons" style="display: flex; justify-content: space-around; margin-block-start: 10px;">
				<button id="ok_button">OK</button>
				<button id="cancel_button" value="cancel" formmethod="dialog">キャンセル</button>
			</div>
		</form>
	</dialog>`);

		qag_dialog = document.getElementById("qag_dialog");
		const ok_button = document.getElementById("ok_button");
		const qag_form = document.getElementById("qag_form");
		const qag_target = document.getElementById("qag_target");
		const qag_buttons = document.getElementById("qag_buttons");

		switch (s_type) {
			case "tag":
				qag_target.innerHTML = `<div>
					タグ： <span>${decodeURIComponent(s_arg)}</span>
				</div>`;
				break;

			case "search":
				qag_target.innerHTML = `<div>
					検索語： <span>${decodeURIComponent(s_arg)}</span>
				</div>`;
				break;

			case "user":
				qag_target.innerHTML = `<div>
					ユーザー： <span>@${s_arg}</span>
				</div>
				<div style="display: flex; align-items: center; margin-block-start: 10px;">
					対象：
					<div style="display: inline-flex; flex-direction: column; margin-inline-start: 10px;">
						<label><input type="radio" name="target" value="投稿" checked><span>投稿した記事</span></label>
						<label><input type="radio" name="target" value="ストック"><span>ストックした記事</span></label>
					</div>
				</div>`;
				break;

			default:
				throw new Error("予期されないswitchです。");
		}

		ok_button.addEventListener("click", (e) => {
			/* 1回目のOKを押したときfetchを開始する。 */

			e.preventDefault(); /* フォームを送信させないために必要。 */

			ok_button.addEventListener("click", (e) => {
				/* fetch完了後、2回目のOKを押したとき画面を閉じる。 */

				e.preventDefault();
				qag_dialog.close("completed");
			}, { "once": true });

			ok_button.disabled = 1;

			const e_inputs = [...qag_dialog.querySelectorAll("input")];
			for (let index = 0; index < e_inputs.length; index++) {
				const e_input = e_inputs[index];
				e_input.disabled = 1;
			}

			qag_buttons.insertAdjacentHTML("beforebegin", `<div style="margin-block-start: 10px;">
			ページ： <span id="qag_current_page">1</span> / <span id="qag_last_page">?</span>
		</div>
		<div>
			残レート： <span id="qag_rate_remaining">?</span> / <span id="qag_rate_limit">?</span>
		</div>
		<div>
			リセット日時： <span id="qag_reset">?</span>
		</div>`);

			if (s_type === "user") {
				f_callback(s_type, s_arg, qag_form.elements.target.value);
			} else {
				f_callback(s_type, s_arg, "");
			}
		}, { "once": true });

		qag_dialog.addEventListener("close", () => {
			console.log("qag_dialog.returnValue =", qag_dialog.returnValue);

			qag_dialog.remove();
		});

		qag_dialog.showModal();
		ok_button.focus();
	};

	const ui_update_text = (s_id, s_text) => {
		const e_id = document.getElementById(s_id);
		if (!e_id) {
			throw new Error("予期されないs_idです。", s_id);
		}
		e_id.innerText = s_text;
	};

	const ui_update_emphasis = (s_id) => {
		const e_id = document.getElementById(s_id);
		if (!e_id) {
			throw new Error("予期されないs_idです。", s_id);
		}
		e_id.style.color = "red";
		e_id.style.fontWeight = "bold";
	};

	const ui_show_results = (s_text) => {
		const qag_buttons = document.getElementById("qag_buttons");

		if (!qag_buttons) {
			/* 途中キャンセルした場合 */

			alert(s_text);
			return;
		}

		const ok_button = document.getElementById("ok_button");
		const cancel_button = document.getElementById("cancel_button");

		qag_buttons.insertAdjacentHTML("beforebegin", `<div style="margin-block-start: 10px;">${s_text}</div>`);
		ok_button.disabled = false;
		cancel_button.disabled = true;
		ok_button.focus();
	};
	/* ここまでUI関数 */


	const show_rate = (response, f_suppress_console = false, f_suppress_ui_update = false) => {
		if (response === void 0) {
			return;
		}

		const { headers } = response;
		const n_rate_remaining = Number(headers.get("rate-remaining"));
		const n_rate_limit = headers.get("rate-limit");

		if (!f_suppress_console) {
			console.log("rate:", n_rate_remaining, "/", n_rate_limit);
		}

		if (!f_suppress_ui_update) {
			ui_update_text("qag_rate_remaining", n_rate_remaining);
			ui_update_text("qag_rate_limit", n_rate_limit);
		}

		const d_rate_reset = new Date(Number(response.headers.get("rate-reset")) * 1000).toLocaleString().
			replace(/:\d+$/u, "");

		if (!f_suppress_console) {
			console.log("rate-reset:", d_rate_reset);
		}

		if (!f_suppress_ui_update) {
			ui_update_text("qag_reset", d_rate_reset);
		}

		return [n_rate_remaining, d_rate_reset];
	};

	const get_last_page = (response) => {
		const link = response.headers.get("link");
		const m = link.match(/(?<=\bpage=)(\d+)/gu);
		const n_last_page = Number(m.at(-1));

		/**
		 * Qiita APIは記事数が0件の場合、n_last_page=0を返す。linkは<?page=0>; rel="last"。
		 */
		console.log("n_last_page = ", n_last_page);
		ui_update_text("qag_last_page", n_last_page);

		return n_last_page;
	};

	const check_remaining = (n_last_page, n_rate_remaining) => {
		if (n_last_page > n_rate_remaining + 1) {
			const s_warning = `***WARNING*** last_page(${n_last_page}) > rate_remaining(${n_rate_remaining}) + 1`;
			console.log(`%c${s_warning}`, "color:hotpink;");

			ui_update_emphasis("qag_rate_remaining");
		}
	};

	const fetch_page_print = (s_type, n_page, n_last_page) => {
		console.log(`fetch ${s_type} page = ${n_page}${n_last_page ? ` / ${n_last_page}` : ""}`);
		ui_update_text("qag_current_page", n_page);
	};

	const fetch_user_page = (s_user_id, n_page, n_last_page = 0) => {
		fetch_page_print("user", n_page, n_last_page);
		return fetch(`https://qiita.com/api/v2/users/${s_user_id}/items?page=${n_page}&per_page=100`);
	};

	const fetch_user_stocked_page = (s_user_id, n_page, n_last_page = 0) => {
		fetch_page_print("user stocked", n_page, n_last_page);
		return fetch(`https://qiita.com/api/v2/users/${s_user_id}/stocks?page=${n_page}&per_page=100`);
	};

	const fetch_tag_page = (s_tag_id, n_page, n_last_page = 0) => {
		fetch_page_print("tag", n_page, n_last_page);
		return fetch(`https://qiita.com/api/v2/tags/${s_tag_id}/items?page=${n_page}&per_page=100`);
	};

	const fetch_search_page = (s_search_word, n_page, n_last_page = 0) => {
		fetch_page_print("search", n_page, n_last_page);
		return fetch(`https://qiita.com/api/v2/items?page=${n_page}&per_page=100&query=${s_search_word}`);
	};

	const convert_date = (s_date) => new Date(s_date).toLocaleString();

	/**
	 * タイトルにタブが含まれている珍しいケースに対応。タブを空白に変換する。
	 */
	const convert_text = (s_text) => s_text.replaceAll(/\t/gu, " ");

	/**
	 * Excelに添付できるタブ区切りに変換する。
	 */
	const convert_excel = (json) => {
		const s_header = ["title", "url", "tags", "created", "updated", "comments", "likes", "stocks", "id"].join("\t");

		const s_json = json.map((a) => [convert_text(a.title), a.url, `,${a.tags.map((t) => t.name).join(",")},`, convert_date(a.created_at), convert_date(a.updated_at), a.comments_count, a.likes_count, a.stocks_count, a.id].join("\t")).join("\n");

		return `${s_header}\n${s_json}`;
	};

	/**
	 * jsonをExcelに添付できる形式に変換してクリップボードにコピーする。
	 * @param {object} json
	 * @param {date} d_rate_reset レートリセットの日時（エラー処理用）
	 * @param {object} response サーバーからのレスポンス（エラー処理用）
	 */
	const show_results = (json, d_rate_reset, response) => {
		if (!response) {
			const s_error = "ネットワークが未接続のようです。";
			console.error(s_error);
			ui_show_results(s_error);
			return;
		}

		if (json) {
			if (!response.ok) {
				if (json.type === 'not_found') {
					const s_error = "見つかりませんでした。";
					console.error(s_error);
					ui_show_results(s_error);
					return;
				}
			}
		} else {
			if (!response.ok) {
				const s_error = `サーバーの調子が悪いようです。HTTPステータスコード: ${response.status}`;
				console.error(s_error);
				ui_show_results(s_error);
				return;
			}

			const s_error = `jsonを取得できませんでした。「${d_rate_reset ? `${d_rate_reset.toLocaleString()}」まで待ってください。` : ""}`;
			console.error(s_error);
			ui_show_results(s_error);
			return;
		}

		console.log(json);
		window.json = json;

		if (json.type === "rate_limit_exceeded") {
			const s_error = `回数制限を超えました。「${d_rate_reset ? `${d_rate_reset.toLocaleString()}」まで待ってください。` : ""}`;
			console.error(s_error);
			ui_show_results(s_error);
			return;
		}

		if (json.length === 0) {
			console.log("%c取得した記事数が0件です。", "color:hotpink;");
			ui_update_emphasis("qag_last_page");
		}

		const r = convert_excel(json);
		window.r = r;

		navigator.clipboard.writeText(r).then(
			() => {
				const s_confirm = "クリップボードにコピー完了しました。";
				console.log(s_confirm);
				ui_show_results(s_confirm);
			},
			() => {
				const blob = new Blob([r], { "type": "text/plain" });
				const link = document.createElement("a");
				const d = new Date();
				link.download = `Qiita記事一覧 ${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}_${d.getHours()}-${d.getMinutes()}-${d.getSeconds()}.txt`;
				link.href = URL.createObjectURL(blob);
				link.click();
				URL.revokeObjectURL(link.href);

				const s_confirm = "クリップボードにコピーできなかったのでダウンロードしました。";
				console.log(s_confirm);
				ui_show_results(s_confirm);
			}
		);
	};

	const fetch_json = async (s_fetch_id, f_fetch) => {
		let json_all, json, response, n_rate_remaining, d_rate_reset;

		try {
			response = await f_fetch(s_fetch_id, 1);
			[n_rate_remaining, d_rate_reset] = show_rate(response);

			json = await response.json();
			json_all = json;

			const n_last_page = get_last_page(response);

			check_remaining(n_last_page, n_rate_remaining);

			for (let i = 2; i <= n_last_page; i++) {
				/* eslint-disable-next-line no-await-in-loop */
				response = await f_fetch(s_fetch_id, i, n_last_page);
				show_rate(response, true);
				/* eslint-disable-next-line no-await-in-loop */
				json = await response.json();
				json_all.push(...json);
			}

			console.log("fetch完了");

			show_rate(response);

			return [json_all, d_rate_reset, response];
		} catch (error) {
			/**
			 * 残レートが切れたときとキャンセルボタンを途中で押したときとネットワーク未接続のときに例外が発生する。
			 */
			console.log("例外が発生しました。", error);
			console.log("json=", json);
			console.log("response=", response);

			show_rate(response, false, true);

			return [json_all, d_rate_reset, response];
		}
	};

	const get_tag_id = () => {
		const m = location.href.match(/^https:\/\/qiita\.com\/tags\/([^?#/]+)/u);

		if (!m) {
			return null;
		}

		const s_tag = m[1];
		return s_tag;
	};

	const get_search_word = () => {
		const m = location.href.match(/^https:\/\/qiita\.com\/search\?.*?q=([^?#&/]+)/u);

		if (!m) {
			return null;
		}

		const s_search_word = m[1];
		return s_search_word;
	};

	const get_user_id = () => {
		const m = location.href.match(/^https:\/\/qiita\.com\/([^?#/]+)/u);

		if (!m) {
			return null;
		}

		const s_user_id = m[1];

		if (["api", "search", "organizations", "official-columns", "official-events", "question-feed", "release-notes", "advent-calendar", "qiita-award", "privacy", "terms", "about", "official-campaigns", "stock", "drafts", "badges", "patches", "settings", "trend", "timeline", "opportunities"].includes(s_user_id)) {
			return null;
		}

		return s_user_id;
	};

	let get_url_info = () => {
		const s_tag_id = get_tag_id();
		if (s_tag_id) {
			return ["tag", s_tag_id];
		}

		const s_search_word = get_search_word();
		if (s_search_word) {
			return ["search", s_search_word];
		}

		const s_user_id = get_user_id();
		if (s_user_id) {
			return ["user", s_user_id];
		}

		return [null, null];
	};

	const get_json = (s_type, s_arg, s_arg2) => {
		switch (s_type) {
			case "tag":
				console.log(`タグ:「${decodeURIComponent(s_arg)}」でfetch開始します。`);

				return fetch_json(s_arg, fetch_tag_page);

			case "search":
				console.log(`検索語:「${decodeURIComponent(s_arg)}」でfetch開始します。`);

				return fetch_json(s_arg, fetch_search_page);

			case "user":
				console.log(`ユーザーID:「${s_arg}」（${s_arg2}）でfetch開始します。`);

				if (s_arg2 === "投稿") {
					return fetch_json(s_arg, fetch_user_page);
				} else if (s_arg2 === "ストック") {
					return fetch_json(s_arg, fetch_user_stocked_page);
				}
				throw new Error("予期されないs_arg2です。", s_arg2);

			default:
				throw new Error("予期されないswitchです。");
		}
	};

	const start_fetch = async (s_type, s_arg, s_arg2) => {
		const [json, d_rate_reset, response] = await get_json(s_type, s_arg, s_arg2);

		show_results(json, d_rate_reset, response);
	};

	const main = () => {
		if (location.host !== "qiita.com") {
			const s_alert = "https://qiita.com/のトップページ以外を開いてください。";
			alert(s_alert);
			throw new Error(s_alert);
		}

		let [s_type, s_arg] = get_url_info();

		if (!s_type) {
			const s_alert = `未対応のURL「${location.href}」です。タグも検索語もユーザーIDも見つかりませんでした。`;
			alert(s_alert);
			throw new Error(s_alert);
		}

		ui_open_dialog(s_type, s_arg, start_fetch);
	};

	main();
})();
