import { SubmitKey } from "../store/app";

const tw = {
  WIP: "該功能仍在開發中……",
  Error: {
    Unauthorized: "未授權訪問，請在左下角設置頁輸入訪問密碼。",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} 條對話`,
  },
  Chat: {
    SubTitle: (count: number) => `與 ChatGPT 的 ${count} 條對話`,
    Actions: {
      ChatList: "查看消息列表",
      CompressedHistory: "查看壓縮後的歷史 Prompt",
      Export: "導出聊天記錄",
      Copy: "複製",
      Stop: "停止",
      Retry: "重試",
      Delete: "刪除",
    },
    Rename: "重命名對話",
    Typing: "正在輸入…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} 發送`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += "，Shift + Enter 換行";
      }
      return inputHints + "，/ 觸發補全";
    },
    Send: "發送",
  },
  Export: {
    Title: "導出聊天記錄為 Markdown",
    Copy: "全部複製",
    Download: "下載文件",
    MessageFromYou: "來自你的消息",
    MessageFromChatGPT: "來自 ChatGPT 的消息",
  },
  Memory: {
    Title: "歷史摘要",
    EmptyContent: "尚未總結",
    Send: "啟用總結並發送摘要",
    Copy: "複製摘要",
    Reset: "重置對話",
    ResetConfirm: "重置後將清空當前對話記錄以及歷史摘要，確認重置？",
  },
  Home: {
    NewChat: "新的聊天",
    DeleteChat: "確認刪除選中的對話？",
    DeleteToast: "已刪除會話",
    Revert: "撤銷",
  },
  Settings: {
    Title: "設置",
    SubTitle: "設置選項",
    Actions: {
      ClearAll: "清除所有數據",
      ResetAll: "重置所有選項",
      Close: "關閉",
      ConfirmResetAll: {
        Confirm: "確認清除所有配置？",
      },
      ConfirmClearAll: {
        Confirm: "確認清除所有聊天記錄？",
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
    Avatar: "頭像",
    FontSize: {
      Title: "字體大小",
      SubTitle: "聊天內容的字體大小",
    },

    Update: {
      Version: (x: string) => `當前版本：${x}`,
      IsLatest: "已是最新版本",
      CheckUpdate: "檢查更新",
      IsChecking: "正在檢查更新...",
      FoundUpdate: (x: string) => `發現新版本：${x}`,
      GoToUpdate: "前往更新",
    },
    SendKey: "發送鍵",
    Theme: "主題",
    TightBorder: "無邊框模式",
    SendPreviewBubble: "發送預覽氣泡",
    Prompt: {
      Disable: {
        Title: "禁用提示詞自動補全",
        SubTitle: "在輸入框開頭輸入 / 即可觸發自動補全",
      },
      List: "自定義提示詞列表",
      ListCount: (builtin: number, custom: number) =>
        `內置 ${builtin} 條，使用者定義 ${custom} 條`,
      Edit: "編輯",
      Modal: {
        Title: "提示詞列表",
        Add: "增加一條",
        Search: "搜索提示詞",
      },
    },
    HistoryCount: {
      Title: "附帶歷史消息數",
      SubTitle: "每次請求攜帶的歷史消息數",
    },
    CompressThreshold: {
      Title: "歷史消息長度壓縮閾值",
      SubTitle: "當未壓縮的歷史消息超過該值時，將進行壓縮",
    },
    Token: {
      Title: "API Key",
      SubTitle: "使用自己的 Key 可繞過密碼訪問限制",
      Placeholder: "OpenAI API Key",
    },
    Endpoint: {
      Title: "API 基礎地址",
      SubTitle: "用於代理或自定義模型供應商",
      Placeholder: "例如：https://api.openai.com",
    },
    HealthCheck: {
      Title: "健康檢查",
      Check: "檢查",
      Checking: "正在檢查…",
      Ok: "服務正常",
      Fail: (msg: string) => `檢查失敗：${msg}`,
    },
    Usage: {
      Title: "餘額查詢",
      SubTitle(used: any, total: any) {
        return `本月已使用 $${used}，訂閱總額 $${total}`;
      },
      IsChecking: "正在檢查…",
      Check: "重新檢查",
      NoAccess: "輸入 API Key 或訪問密碼查看餘額",
    },
    AccessCode: {
      Title: "訪問密碼",
      SubTitle: "已開啟加密訪問",
      Placeholder: "請輸入訪問密碼",
    },
    Model: "模型 (model)",
    Temperature: {
      Title: "隨機性 (temperature)",
      SubTitle: "值越大，回覆越隨機，大於 1 的值可能會導致亂碼",
    },
    MaxTokens: {
      Title: "單次回覆限制 (max_tokens)",
      SubTitle: "單次互動所用的最大 Token 數",
    },
    PresencePenlty: {
      Title: "話題新鮮度 (presence_penalty)",
      SubTitle: "值越大，越有可能擴展到新話題",
    },
  },
  Store: {
    DefaultTopic: "新的聊天",
    BotHello: "有什麼可以幫你的嗎",
    Error: "出錯了，稍後重試吧",
    Prompt: {
      History: (content: string) =>
        "這是 ai 和使用者的歷史聊天摘要作為前情提要：" + content,
      Topic:
        "使用四到五個字直接返回這句話的簡要主題，不要解釋、不要標點、不要語氣詞、不要多餘文本，如果沒有主題，請直接返回“閒聊”",
      Summarize:
        "簡要總結一下你和使用者的對話，用作後續的上下文提示 prompt，控制在 200 字以內",
    },
    ConfirmClearAll: "確認清除所有聊天、設置數據？",
  },
  Copy: {
    Success: "已寫入剪貼簿",
    Failed: "複製失敗，請賦予剪貼簿權限",
  },
  Context: {
    Toast: (x: any) => `已設置 ${x} 條前置上下文`,
    Edit: "前置上下文和歷史記憶",
    Add: "新增一條",
  },
};

export type LocaleType = typeof tw;
export default tw;
