# 漂流瓶

メッセージを海へ流すと、別の利用者が投稿したメッセージをランダムに1通受け取れるWebアプリです。ログインは不要で、ブラウザーごとの匿名UUIDをlocalStorageに保存します。

## 必要な設定

1. Supabaseでプロジェクトを作成します。
2. SupabaseのSQL Editorで [`supabase/migrations/20261011000000_create_messages.sql`](./supabase/migrations/20261011000000_create_messages.sql) の内容を実行します。
3. SupabaseのProject URLと公開用anon/publishable keyを使って、プロジェクト直下に`.env.local`を作成します。[`.env.example`](./.env.example)をコピーして値を置き換えることもできます。

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

ブラウザーで [http://localhost:3000](http://localhost:3000) を開きます。設定がない場合は投稿フォームに案内が表示されます。

```bash
npm run build
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

## 匿名投稿について

メッセージは公開読み取り可能で、ログインなしの公開投稿として保存されます。localStorageのUUIDは匿名利用者の区別に使いますが、本人確認にはならず、消去・変更できます。既読管理や投稿レート制限は含みません。
