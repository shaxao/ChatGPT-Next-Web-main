import { SubmitKey } from "../store/app";

const tr = {
  WIP: "Yakında...",
  Error: {
    Unauthorized: "Yetkisiz erişim, lütfen ayarlarda erişim kodunu girin.",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} mesaj`,
  },
  Chat: {
    SubTitle: (count: number) => `ChatGPT ile ${count} mesaj`,
    Actions: {
      ChatList: "Sohbet listesine git",
      CompressedHistory: "Sıkıştırılmış geçmişi görüntüle",
      Export: "Geçmişi dışa aktar",
      Copy: "Kopyala",
      Stop: "Durdur",
      Retry: "Tekrar dene",
      Delete: "Sil",
    },
    Rename: "Sohbeti yeniden adlandır",
    Typing: "Yazıyor…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} ile gönder`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter ile satır başı";
      }
      return inputHints + ", / ile otomatik tamamlama";
    },
    Send: "Gönder",
  },
  Export: {
    Title: "Sohbet geçmişini dışa aktar",
    Copy: "Tümünü kopyala",
    Download: "Dosya indir",
    MessageFromYou: "Senden mesaj",
    MessageFromChatGPT: "ChatGPT'den mesaj",
  },
  Memory: {
    Title: "Geçmiş özeti",
    EmptyContent: "Henüz özet yok",
    Send: "Özeti gönder",
    Copy: "Özeti kopyala",
    Reset: "Sohbeti sıfırla",
    ResetConfirm:
      "Sıfırlama, geçerli sohbet geçmişini ve özeti silecek. Emin misin?",
  },
  Home: {
    NewChat: "Yeni sohbet",
    DeleteChat: "Seçilen sohbet silinsin mi?",
    DeleteToast: "Sohbet silindi",
    Revert: "Geri al",
  },
  Settings: {
    Title: "Ayarlar",
    SubTitle: "Seçenekler",
    Actions: {
      ClearAll: "Tüm verileri temizle",
      ResetAll: "Tüm seçenekleri sıfırla",
      Close: "Kapat",
      ConfirmResetAll: {
        Confirm: "Tüm ayarlar sıfırlansın mı?",
      },
      ConfirmClearAll: {
        Confirm: "Tüm sohbetler silinsin mi?",
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
      Title: "Yazı boyutu",
      SubTitle: "Sohbet metni yazı boyutunu ayarlayın",
    },

    Update: {
      Version: (x: string) => `Sürüm: ${x}`,
      IsLatest: "Güncel",
      CheckUpdate: "Güncellemeyi kontrol et",
      IsChecking: "Güncelleme kontrol ediliyor...",
      FoundUpdate: (x: string) => `Yeni sürüm bulundu: ${x}`,
      GoToUpdate: "Güncelle",
    },
    SendKey: "Gönder tuşu",
    Theme: "Tema",
    TightBorder: "Dar kenarlık",
    SendPreviewBubble: "Gönderi önizleme balonu",
    Prompt: {
      Disable: {
        Title: "Akıllı otomatik tamamlama devre dışı",
        SubTitle: "Girdi '/' ile başlarsa otomatik tamamlama tetiklenir",
      },
      List: "Prompt listesi",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} yerleşik, ${custom} kullanıcı tanımlı`,
      Edit: "Düzenle",
      Modal: {
        Title: "Prompt listesi",
        Add: "Ekle",
        Search: "Prompt ara",
      },
    },
    HistoryCount: {
      Title: "Geçmiş mesaj sayısı",
      SubTitle: "Her isteğe eklenen geçmiş mesaj sayısı",
    },
    CompressThreshold: {
      Title: "Sıkıştırma eşiği",
      SubTitle:
        "Sıkıştırma, sıkıştırılmamış geçmiş mesajlar eşik değerini aşarsa yapılır",
    },
    Token: {
      Title: "API Key",
      SubTitle: "Kendi anahtarını kullanarak erişim kodu kısıtlamasını aş",
      Placeholder: "OpenAI API Key",
    },
    Endpoint: {
      Title: "API Temel URL",
      SubTitle: "Proxy ya da özel model sağlayıcı kullan",
      Placeholder: "örn. https://api.openai.com",
    },
    HealthCheck: {
      Title: "Sağlık kontrolü",
      Check: "Kontrol",
      Checking: "Kontrol ediliyor…",
      Ok: "Servis sağlıklı",
      Fail: (msg: string) => `Hata: ${msg}`,
    },
    Usage: {
      Title: "Bakiye",
      SubTitle(used: any, total: any) {
        return `Bu ay kullanılan $${used}, abonelik toplam $${total}`;
      },
      IsChecking: "Kontrol ediliyor…",
      Check: "Tekrar kontrol",
      NoAccess: "Bakiye için API Key veya erişim kodu gir",
    },
    AccessCode: {
      Title: "Erişim kodu",
      SubTitle: "Erişim kontrolü etkin",
      Placeholder: "Erişim kodunu girin",
    },
    Model: "Model (model)",
    Temperature: {
      Title: "Sıcaklık",
      SubTitle: "Yüksek değerler çıktıyı daha rastgele yapar",
    },
    MaxTokens: {
      Title: "Maks token",
      SubTitle: "Yanıt başına maksimum token",
    },
    PresencePenlty: {
      Title: "Varlık cezası",
      SubTitle: "Yüksek değerler yeni konuları artırır",
    },
  },
  Store: {
    DefaultTopic: "Yeni sohbet",
    BotHello: "Bugün nasıl yardımcı olabilirim?",
    Error: "Bir şeyler ters gitti, lütfen sonra tekrar deneyin.",
    Prompt: {
      History: (content: string) =>
        "AI ve kullanıcı arasındaki sohbet geçmişi özeti:" + content,
      Topic: "4-5 kelimelik kısa bir başlık verin, noktalama yok",
      Summarize: "Konuşmayı 200 karakter veya daha azda özetleyin",
    },
    ConfirmClearAll: "Tüm sohbetler ve ayarları silmeyi onayla?",
  },
  Copy: {
    Success: "Panoya kopyalandı",
    Failed: "Kopyalama başarısız, panoya izin verin",
  },
  Context: {
    Toast: (x: any) => `${x} bağlam promptları ayarlandı`,
    Edit: "Bağlam ve hafıza",
    Add: "Prompt ekle",
  },
};

export type LocaleType = typeof tr;
export default tr;
