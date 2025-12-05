import { SubmitKey } from "../store/app";

const jp = {
  WIP: "近日公開...",
  Error: {
    Unauthorized: "未認証です。設定ページでアクセスコードを入力してください。",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} 件のメッセージ`,
  },
  Chat: {
    SubTitle: (count: number) => `ChatGPT との ${count} 件の会話`,
    Actions: {
      ChatList: "チャット一覧へ",
      CompressedHistory: "圧縮履歴を表示",
      Export: "履歴をエクスポート",
      Copy: "コピー",
      Stop: "停止",
      Retry: "再試行",
      Delete: "削除",
    },
    Rename: "チャットの名前変更",
    Typing: "入力中…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} で送信`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "、Shift + Enter で改行";
      }
      return inputHints + "、/ で補完";
    },
    Send: "送信",
  },
  Export: {
    Title: "チャット履歴をエクスポート",
    Copy: "すべてコピー",
    Download: "ファイルをダウンロード",
    MessageFromYou: "あなたからのメッセージ",
    MessageFromChatGPT: "ChatGPT からのメッセージ",
  },
  Memory: {
    Title: "履歴の要約",
    EmptyContent: "要約なし",
    Send: "要約を送信",
    Copy: "要約をコピー",
    Reset: "チャットをリセット",
    ResetConfirm: "リセットすると履歴と要約が消えます。続行しますか？",
  },
  Home: {
    NewChat: "新しいチャット",
    DeleteChat: "選択したチャットを削除しますか？",
    DeleteToast: "チャットを削除しました",
    Revert: "元に戻す",
  },
  Settings: {
    Title: "設定",
    SubTitle: "オプション",
    Actions: {
      ClearAll: "すべてのデータを削除",
      ResetAll: "すべての設定をリセット",
      Close: "閉じる",
      ConfirmResetAll: {
        Confirm: "すべての設定を本当にリセットしますか？",
      },
      ConfirmClearAll: {
        Confirm: "すべてのチャットを本当に削除しますか？",
      },
    },
    Lang: {
      Name: "Language",
      Options: {
        cn: "简体中文",
        en: "English",
        tw: "繁體中文",
        es: "Español",
        it: "Italiano",
        tr: "Türkçe",
        jp: "日本語",
        de: "Deutsch",
      },
    },
    Avatar: "アバター",
    FontSize: {
      Title: "フォントサイズ",
      SubTitle: "チャットコンテンツのフォントサイズを調整",
    },

    Update: {
      Version: (x: string) => `バージョン: ${x}`,
      IsLatest: "最新",
      CheckUpdate: "アップデートを確認",
      IsChecking: "確認中...",
      FoundUpdate: (x: string) => `新しいバージョンがあります: ${x}`,
      GoToUpdate: "アップデート",
    },
    SendKey: "送信キー",
    Theme: "テーマ",
    TightBorder: "狭いボーダー",
    SendPreviewBubble: "送信プレビュー",
    Prompt: {
      Disable: {
        Title: "スマート補完を無効化",
        SubTitle: "入力が '/' で始まると補完が起動",
      },
      List: "プロンプト一覧",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} 内蔵、${custom} カスタム`,
      Edit: "編集",
      Modal: {
        Title: "プロンプト一覧",
        Add: "追加",
        Search: "プロンプト検索",
      },
    },
    HistoryCount: {
      Title: "履歴メッセージ数",
      SubTitle: "各リクエストに添付される履歴メッセージ数",
    },
    CompressThreshold: {
      Title: "圧縮しきい値",
      SubTitle: "未圧縮の履歴メッセージがしきい値を超えると圧縮されます",
    },
    Token: {
      Title: "API Key",
      SubTitle: "アクセスコード制限を無視するには自身のキーを使用",
      Placeholder: "OpenAI API Key",
    },
    Endpoint: {
      Title: "API ベース URL",
      SubTitle: "プロキシやカスタムモデルプロバイダを利用",
      Placeholder: "例: https://api.openai.com",
    },
    HealthCheck: {
      Title: "ヘルスチェック",
      Check: "チェック",
      Checking: "チェック中…",
      Ok: "サービス正常",
      Fail: (msg: string) => `失敗: ${msg}`,
    },
    Usage: {
      Title: "残高",
      SubTitle(used: any, total: any) {
        return `今月の使用 $${used}, サブスクリプション合計 $${total}`;
      },
      IsChecking: "確認中…",
      Check: "再確認",
      NoAccess: "残高確認には API Key またはアクセスコードが必要",
    },
    AccessCode: {
      Title: "アクセスコード",
      SubTitle: "アクセス制御が有効です",
      Placeholder: "アクセスコードを入力",
    },
    Model: "モデル (model)",
    Temperature: {
      Title: "温度",
      SubTitle: "値が高いほど出力はランダムになります",
    },
    MaxTokens: {
      Title: "最大トークン",
      SubTitle: "応答あたりの最大トークン数",
    },
    PresencePenlty: {
      Title: "Presence Penalty",
      SubTitle: "値が高いほど新しいトピックに言及しやすくなります",
    },
  },
  Store: {
    DefaultTopic: "新しいチャット",
    BotHello: "今日は何をお手伝いできますか？",
    Error: "問題が発生しました。後でもう一度お試しください。",
    Prompt: {
      History: (content: string) => "AI とユーザーの履歴要約:" + content,
      Topic: "4〜5語の短いタイトルを提示。句読点なし",
      Summarize: "会話を 200 文字以内で要約してください",
    },
    ConfirmClearAll: "すべてのチャットと設定を削除しますか？",
  },
  Copy: {
    Success: "クリップボードにコピーしました",
    Failed: "コピーに失敗しました。権限を許可してください",
  },
  Context: {
    Toast: (x: any) => `${x} 件のコンテキストプロンプトを設定しました`,
    Edit: "コンテキストとメモリ",
    Add: "プロンプトを追加",
  },
};

export type LocaleType = typeof jp;
export default jp;
