# 漂流瓶

メッセージを海へ流すと、別の利用者が投稿したメッセージをランダムに1通受け取れるWebアプリです。ログインは不要で、ブラウザーごとの匿名UUIDをlocalStorageに保存します。

## 必要な設定

1. Supabaseでプロジェクトを作成します。
2. SupabaseのSQL Editorで [`supabase/migrations/20261011000000_create_messages.sql`](./supabase/migrations/20261011000000_create_messages.sql) の内容を実行します。
3. SupabaseのProject URLと公開用anon/publishable keyを使って、プロジェクト直下の`.env.local`を作成します。

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

VercelプロジェクトのEnvironment Variablesに`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`を登録し、Supabaseのマイグレーションを適用したうえで再デプロイしてください。公開URLで投稿と受信を確認するには、本番環境にも有効なSupabaseプロジェクト設定が必要です。

## 匿名投稿について

メッセージは公開読み取り可能で、ログインなしの公開投稿として保存されます。localStorageのUUIDは匿名利用者の区別に使いますが、本人確認にはならず、消去・変更できます。既読管理や投稿レート制限は含みません。
