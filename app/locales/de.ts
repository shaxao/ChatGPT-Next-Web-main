import { SubmitKey } from "../store/app";

const de = {
  WIP: "In Arbeit...",
  Error: {
    Unauthorized:
      "Nicht autorisiert, bitte gib den Zugangscode in den Einstellungen ein.",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} Nachrichten`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} Nachrichten mit ChatGPT`,
    Actions: {
      ChatList: "Zur Chatliste",
      CompressedHistory: "Komprimierten Verlauf anzeigen",
      Export: "Verlauf exportieren",
      Copy: "Kopieren",
      Stop: "Stopp",
      Retry: "Erneut",
      Delete: "Löschen",
    },
    Rename: "Chat umbenennen",
    Typing: "Tippt…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} zum Senden`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter für Zeilenumbruch";
      }
      return inputHints + ", / für Autovervollständigung";
    },
    Send: "Senden",
  },
  Export: {
    Title: "Chatverlauf exportieren",
    Copy: "Alles kopieren",
    Download: "Datei herunterladen",
    MessageFromYou: "Nachricht von dir",
    MessageFromChatGPT: "Nachricht von ChatGPT",
  },
  Memory: {
    Title: "Verlaufszusammenfassung",
    EmptyContent: "Noch keine Zusammenfassung",
    Send: "Zusammenfassung senden",
    Copy: "Zusammenfassung kopieren",
    Reset: "Chat zurücksetzen",
    ResetConfirm:
      "Zurücksetzen löscht den Verlauf und die Zusammenfassung. Sicher?",
  },
  Home: {
    NewChat: "Neuer Chat",
    DeleteChat: "Ausgewählten Chat löschen?",
    DeleteToast: "Chat gelöscht",
    Revert: "Rückgängig",
  },
  Settings: {
    Title: "Einstellungen",
    SubTitle: "Optionen",
    Actions: {
      ClearAll: "Alle Daten löschen",
      ResetAll: "Alle Optionen zurücksetzen",
      Close: "Schließen",
      ConfirmResetAll: {
        Confirm: "Alle Einstellungen wirklich zurücksetzen?",
      },
      ConfirmClearAll: {
        Confirm: "Wirklich alle Chats löschen?",
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
      Title: "Schriftgröße",
      SubTitle: "Schriftgröße der Chat-Inhalte anpassen",
    },

    Update: {
      Version: (x: string) => `Version: ${x}`,
      IsLatest: "Aktuell",
      CheckUpdate: "Updates prüfen",
      IsChecking: "Suche nach Updates...",
      FoundUpdate: (x: string) => `Neue Version gefunden: ${x}`,
      GoToUpdate: "Aktualisieren",
    },
    SendKey: "Sendetaste",
    Theme: "Theme",
    TightBorder: "Schmale Ränder",
    SendPreviewBubble: "Sendevorschau",
    Prompt: {
      Disable: {
        Title: "Autovervollständigung deaktivieren",
        SubTitle: "Mit / am Anfang Autovervollständigung auslösen",
      },
      List: "Promptliste",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} integriert, ${custom} benutzerdefiniert`,
      Edit: "Bearbeiten",
      Modal: {
        Title: "Promptliste",
        Add: "Hinzufügen",
        Search: "Prompts suchen",
      },
    },
    HistoryCount: {
      Title: "Anzahl Verlaufsmeldungen",
      SubTitle: "Anzahl angehängter Verlaufsmeldungen je Anfrage",
    },
    CompressThreshold: {
      Title: "Komprimierungsschwelle",
      SubTitle:
        "Komprimierung erfolgt, wenn unkomprimierter Verlauf die Schwelle überschreitet",
    },
    Token: {
      Title: "API Key",
      SubTitle: "Eigenen Schlüssel verwenden, um Zugangscode zu umgehen",
      Placeholder: "OpenAI API Key",
    },
    Endpoint: {
      Title: "API-Basis-URL",
      SubTitle: "Proxy oder eigenen Modellanbieter verwenden",
      Placeholder: "z. B. https://api.openai.com",
    },
    HealthCheck: {
      Title: "Systemcheck",
      Check: "Prüfen",
      Checking: "Prüfe…",
      Ok: "Dienst OK",
      Fail: (msg: string) => `Fehler: ${msg}`,
    },
    Usage: {
      Title: "Kontostand",
      SubTitle(used: any, total: any) {
        return `Diesen Monat genutzt $${used}, Abo gesamt $${total}`;
      },
      IsChecking: "Prüfe…",
      Check: "Erneut prüfen",
      NoAccess: "API Key oder Zugangscode eingeben, um Kontostand zu sehen",
    },
    AccessCode: {
      Title: "Zugangscode",
      SubTitle: "Zugriffskontrolle aktiviert",
      Placeholder: "Zugangscode eingeben",
    },
    Model: "Modell (model)",
    Temperature: {
      Title: "Temperatur",
      SubTitle: "Höhere Werte machen die Ausgabe zufälliger",
    },
    MaxTokens: {
      Title: "Max Tokens",
      SubTitle: "Maximale Token pro Antwort",
    },
    PresencePenlty: {
      Title: "Presence-Penalty",
      SubTitle: "Höhere Werte erhöhen neue Themen",
    },
  },
  Store: {
    DefaultTopic: "Neuer Chat",
    BotHello: "Wie kann ich heute helfen?",
    Error: "Etwas ist schiefgelaufen, bitte später erneut versuchen.",
    Prompt: {
      History: (content: string) =>
        "Zusammenfassung des Chatverlaufs zwischen KI und Nutzer:" + content,
      Topic: "Kurzen Titel mit 4–5 Wörtern, ohne Satzzeichen",
      Summarize: "Konversation in max. 200 Zeichen zusammenfassen",
    },
    ConfirmClearAll: "Alle Chats und Einstellungen löschen?",
  },
  Copy: {
    Success: "In Zwischenablage kopiert",
    Failed: "Kopieren fehlgeschlagen, erteile Zwischenablage-Berechtigung",
  },
  Context: {
    Toast: (x: any) => `${x} Kontext-Prompts gesetzt`,
    Edit: "Kontext und Erinnerung",
    Add: "Prompt hinzufügen",
  },
};

export type LocaleType = typeof de;
export default de;
