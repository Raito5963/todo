# Todo アプリ

Firebase Authentication（Google認証）を使用したNext.jsベースのTodoアプリです。

## 機能

- Googleアカウントでのログイン・ログアウト
- ユーザー別のTodo管理
- Todo の追加・完了・削除
- リアルタイムでのデータ同期（Firestore）

## セットアップ

1. **Firebase プロジェクトを作成**
   - [Firebase Console](https://console.firebase.google.com/)でプロジェクトを作成
   - Authentication > Sign-in method でGoogleを有効化
   - Firestore Databaseを作成

2. **環境変数を設定**
   - `.env.local`ファイルを編集
   - Firebase設定値を入力

3. **依存関係をインストール**
   ```bash
   npm install
   ```

4. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

## 使用技術

- Next.js 15
- React 19
- Firebase (Authentication, Firestore)
- Material-UI
- TypeScript

## Firebase設定

Firestoreのセキュリティルールを以下のように設定してください：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /todos/{document} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```