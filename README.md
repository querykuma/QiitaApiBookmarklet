# QiitaApiBookmarklet

QiitaApiBookmarkletは[Qiita API](https://qiita.com/api/v2/docs)で記事一覧を取得するブックマークレットです。

![screenshot](screenshot.png)

## 機能

- 開いている現在のURLの形式から自動的に判断して、タグの記事一覧か、検索結果の記事一覧か、ユーザーの記事一覧（投稿かストック）か、組織の記事一覧を取得できます。
- 取得した記事一覧は通常クリップボードにコピーされ、そのままExcelに添付できます。クリップボードにコピーできなかった場合、テキストファイルとしてダウンロードします。
- Qiita APIの取得状況（ページ、残レート、リセット日時）をリアルタイムで確認できます。
- 記事一覧の取得中でもキャンセルできます。キャンセルしたとしてもそれまでに取得した記事一覧を取得します。

## 使い方

最初に、ブックマークレットを作成します。ウェブブラウザで新しいブックマークを追加して、名前欄に任意の名前を記入し、URL欄に[このリンク](https://raw.githubusercontent.com/querykuma/QiitaApiBookmarklet/main/dist/qiita_api_get_bookmark.js)の内容を貼り付けます。

つぎに、Qiitaのページ（タグか、検索結果か、ユーザーか、組織）を開きます。ユーザーの場合は選択肢（投稿かストック）を選びます。

最後に、ブックマークレットをクリックして記事一覧を取得します。

## URLとQiita APIの対応

| タイプ                     | URL                                   | Qiita API                             |
| -------------------------- | ------------------------------------- | ------------------------------------- |
| タグ                       | qiita.com/<br />tags/$tag_id          | /api/v2/tags/<br />$tag_id/items      |
| 検索結果                   | qiita.com/<br />search?q=$query_id    | /api/v2/items<br />?query=$query_id   |
| ユーザー<br />（投稿）     | qiita.com/<br />$user_id              | /api/v2/users/<br />$user_id/items    |
| ユーザー<br />（ストック） | qiita.com/<br />$user_id              | /api/v2/users/<br />$user_id/stocks   |
| 組織                       | qiita.com/<br />organizations/$org_id | /api/v2/items<br />?query=org:$org_id |

## ブックマークレットが取得する項目

| title    | 記事タイトル           |
| -------- | ---------------------- |
| url      | URL                    |
| tags     | カンマ区切りのタグ一覧 |
| created  | 作成日時               |
| updated  | 更新日時               |
| comments | コメント数             |
| likes    | いいね数               |
| stocks   | ストック数             |
| id       | URLにもある記事id      |

## その他

GitHubレポジトリの[MakeBookmarklet](https://github.com/querykuma/MakeBookmarklet)は、ブックマークレットを出力するために私が作成したwebpackのプラグインです。

