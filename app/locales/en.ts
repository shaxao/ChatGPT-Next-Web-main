import { SubmitKey } from "../store/app";
import Locale from "./index";

const en = {
  WIP: "Coming Soon...",
  Error: {
    Unauthorized:
      "Unauthorized access, please enter access code in settings page.",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messages`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} messages with ChatGPT`,
    Actions: {
      ChatList: "Go to Chat List",
      CompressedHistory: "View Compressed History Prompt",
      Export: "Export All Messages",
      Copy: "Copy",
      Stop: "Stop",
      Retry: "Retry",
      Delete: "Delete",
    },
    Rename: "Rename Chat",
    Typing: "Typing…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} to send`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter to wrap";
      }
      return inputHints + ", / to trigger autocomplete";
    },
    Send: "Send",
  },
  Export: {
    Title: "Export Chat History",
    Copy: "Copy All",
    Download: "Download as a File",
    MessageFromYou: "Message From You",
    MessageFromChatGPT: "Message From ChatGPT",
  },
  Memory: {
    Title: "Memory Prompt",
    EmptyContent: "Nothing yet.",
    Send: "Send Memory",
    Copy: "Copy Memory",
    Reset: "Reset Memory",
    ResetConfirm: "Confirm to reset memory?",
  },
  Home: {
    NewChat: "New Chat",
    DeleteChat: "Confirm to delete the selected chat?",
    DeleteToast: "Chat Deleted",
    Revert: "Revert",
  },
  Settings: {
    Title: "Settings",
    SubTitle: "Options",
    Actions: {
      ClearAll: "Clear All Data",
      ResetAll: "Reset All Settings",
      Close: "Close",
      ConfirmResetAll: {
        Confirm: "Are you sure to reset all settings?",
      },
      ConfirmClearAll: {
        Confirm: "Are you sure to clear all chat?",
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
    Avatar: "Avatar",
    FontSize: {
      Title: "Font Size",
      SubTitle: "Adjust the font size of chat content",
    },

    Update: {
      Version: (x: string) => `Version: ${x}`,
      IsLatest: "Latest",
      CheckUpdate: "Check Update",
      IsChecking: "Checking for updates...",
      FoundUpdate: (x: string) => `Found new version: ${x}`,
      GoToUpdate: "Update",
    },
    SendKey: "Send Key",
    Theme: "Theme",
    TightBorder: "Tight Border",
    SendPreviewBubble: "Send Preview Bubble",
    Prompt: {
      Disable: {
        Title: "Disable Smart Prompt Autocomplete",
        SubTitle:
          "Autocomplete will trigger when input begins with `/`, enter space to trigger",
      },
      List: "Prompt List",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} builtin, ${custom} user defined`,
      Edit: "Edit",
      Modal: {
        Title: "Prompt List",
        Add: "Add",
        Search: "Search Prompts",
      },
    },
    HistoryCount: {
      Title: "History Messages Count",
      SubTitle: "The number of history messages attached to each request",
    },
    CompressThreshold: {
      Title: "Compress Threshold",
      SubTitle:
        "Compression will be performed if the uncompressed history messages exceed the threshold",
    },
    Token: {
      Title: "API Key",
      SubTitle: "Use your own key to ignore access code restrictions",
      Placeholder: "OpenAI API Key",
    },
    Endpoint: {
      Title: "API Base URL",
      SubTitle: "Use a proxy or custom model provider",
      Placeholder: "e.g. https://api.openai.com",
    },
    HealthCheck: {
      Title: "Health Check",
      Check: "Check",
      Checking: "Checking…",
      Ok: "Service Healthy",
      Fail: (msg: string) => `Failed: ${msg}`,
    },
    Usage: {
      Title: "Balance",
      SubTitle(used: any, total: any) {
        return `Used this month $${used}, subscription total $${total}`;
      },
      IsChecking: "Checking…",
      Check: "Check Again",
      NoAccess: "Enter API Key or Access Code to check balance",
    },
    AccessCode: {
      Title: "Access Code",
      SubTitle: "Access control enabled",
      Placeholder: "Enter Access Code",
    },
    Model: "Model (model)",
    Temperature: {
      Title: "Temperature",
      SubTitle: "Higher values will make the output more random",
    },
    MaxTokens: {
      Title: "Max Tokens",
      SubTitle: "Max tokens per response",
    },
    PresencePenlty: {
      Title: "Presence Penalty",
      SubTitle: "Higher values make model more likely to talk about new topics",
    },
  },
  Store: {
    DefaultTopic: "New Chat",
    BotHello: "How can I help you today?",
    Error: "Something went wrong, please try again later.",
    Prompt: {
      History: (content: string) =>
        "This is a summary of chat history between AI and user:" + content,
      Topic:
        "Provide a short title summarizing the sentence in 4 to 5 words, no punctuation",
      Summarize:
        "Summarize the conversation between you and user in 200 characters or fewer",
    },
    ConfirmClearAll: "Confirm to clear all chats and settings?",
  },
  Copy: {
    Success: "Copied to clipboard",
    Failed: "Copy failed, please allow clipboard permissions",
  },
  Context: {
    Toast: (x: any) => `${x} context prompts set`,
    Edit: "Context and Memory",
    Add: "Add a Prompt",
  },
};

export type LocaleType = typeof en;
export default en;
