# 漂流瓶

メッセージを海へ流すと、別の利用者が投稿したメッセージをランダムに1通受け取れるWebアプリです。メールOTPでログインして投稿・受信します。メールアドレスやアカウントIDは画面に表示されず、投稿者IDはアクセス制御のためにのみ使用されます。

## 必要な設定

1. Supabaseでプロジェクトを作成します。
2. SupabaseのSQL Editorで`supabase/migrations`内のマイグレーションをファイル名の昇順に実行します。
3. SupabaseのProject URLと公開用anon/publishable keyを使って、プロジェクト直下に`.env.local`を作成します。[`.env.example`](./.env.example)をコピーして値を置き換えることもできます。
4. Supabase DashboardのAuthenticationでメール認証を有効にし、メールの「Magic Link」テンプレートを `{{ .Token }}` を含む内容に変更して6桁のOTPを送信するようにします。

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

ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。ログイン画面でメールアドレスを入力すると6桁の認証コードが送信されます。コードを画面に入力してログインしてください。設定がない場合は投稿フォームとログイン画面に案内が表示されます。
ログイン後、流したメッセージと一緒に他の利用者のメッセージを1通受け取れます。受取人はデータベースで確定するため、同じメッセージを他の利用者が重複して受け取ることはありません。受け取ったメッセージからスレッドを開き、送信者と受信者が交互に最大3回まで返信できます。送受信履歴は `/history` で確認できます。

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

## 匿名表示・受取・スレッドについて

メッセージの内容はログイン済み利用者間で交換され、投稿者のメールアドレスやAuth IDは画面に表示されません。投稿にはログインが必要で、データベースのRLSとRPCが参加者を検証します。受取はメッセージ行をロックして受取人を記録するため、ブラウザーの保存状態に依存せず一度だけ行われます。最初の投稿に続く返信は、同じ利用者が連続で送信できず、最大3件で終了します。履歴には認証ユーザーに紐付けられる投稿・受取スレッドのみが表示されます。認証導入前の匿名投稿は削除されませんが、過去のブラウザーUUIDを認証アカウントへ引き継ぐことはできません。投稿レート制限はありません。
