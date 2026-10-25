# 漂流瓶

メッセージを海へ流すと、別の利用者が投稿したメッセージをランダムに1通受け取れるWebアプリです。メールのマジックリンクでログインして投稿・受信します。メールアドレスやアカウントIDは画面に表示されず、投稿者IDはアクセス制御のためにのみ使用されます。

## 必要な設定

1. Supabaseでプロジェクトを作成します。
2. SupabaseのSQL Editorで`supabase/migrations`内のマイグレーションをファイル名の昇順に実行します。
3. SupabaseのProject URLと公開用anon/publishable keyを使って、プロジェクト直下に`.env.local`を作成します。[`.env.example`](./.env.example)をコピーして値を置き換えることもできます。
4. Supabase DashboardのAuthentication設定でメール認証を有効にし、許可リダイレクト先に `http://localhost:3000/auth/callback` とデプロイ先の `/auth/callback` URLを登録します。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=SupabaseのProject_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=Supabaseの公開用anonまたはpublishable key
```

`.env.local`はGit管理対象外です。service_role keyなどの秘密鍵をブラウザーへ公開しないでください。

## ローカルで実行

```bash
npm install
npm run dev
```

ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。ログイン画面でメールアドレスを入力するとマジックリンクが送信されます。設定がない場合は投稿フォームとログイン画面に案内が表示されます。
受信したメッセージのIDはブラウザーのlocalStorageに保存され、次回以降の受信候補から除外されます。

```bash
npm run build
npm test
```

## Vercelへデプロイ

1. SupabaseのSQL Editorで上記マイグレーションを適用します。
2. GitHubへこのリポジトリをpushし、Vercelの「Add New…」→「Project」からリポジトリをImportします。
3. Framework Presetが「Next.js」、Root Directoryがリポジトリのルートであることを確認します。Build Commandは`npm run build`（Next.jsの標準設定）です。
4. 「Environment Variables」に次の2つを登録し、Productionに加えて必要なPreview/Development環境も選択します。値はSupabaseのProject URLと公開用anon/publishable keyです。
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deployを実行します。環境変数を後から変更した場合は、新しいDeploymentを作成（Redeploy）してください。

このリポジトリはNext.js標準構成のため、追加の`vercel.json`やVercel用アダプターは必要ありません。Vercel CLIでデプロイする場合は、プロジェクトルートで`npx vercel`を実行し、初回の対話でVercelアカウントへログインしてプロジェクトをLinkします。

公開URLで実際に投稿・受信するには、Production環境変数の設定とSupabaseマイグレーションの適用の両方が必要です。秘密の`service_role` keyは環境変数にも登録せず、ブラウザーに公開される`NEXT_PUBLIC_`変数には公開用キーのみを設定してください。

## 匿名表示と既読管理について

メッセージの内容はログイン済み利用者間で交換され、投稿者のメールアドレスやAuth IDは画面に表示されません。投稿にはログインが必要で、データベースのRLSが投稿者IDを認証済みユーザーに限定します。既存の匿名投稿は削除されませんが、過去のブラウザーUUIDを認証アカウントへ引き継ぐことはできません。受信済みメッセージのIDはlocalStorageで管理するため、ブラウザーのデータを消去すると既読状態がリセットされます。投稿レート制限はありません。
