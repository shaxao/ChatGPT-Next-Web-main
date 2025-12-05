import { SubmitKey } from "../store/app";

const it = {
  WIP: "In arrivo...",
  Error: {
    Unauthorized:
      "Accesso non autorizzato, inserisci il codice di accesso nelle impostazioni.",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} messaggi`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} messaggi con ChatGPT`,
    Actions: {
      ChatList: "Vai alla lista chat",
      CompressedHistory: "Vedi storico compresso",
      Export: "Esporta storico",
      Copy: "Copia",
      Stop: "Ferma",
      Retry: "Riprova",
      Delete: "Elimina",
    },
    Rename: "Rinomina chat",
    Typing: "Sta scrivendo…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} per inviare`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter per andare a capo";
      }
      return inputHints + ", / per autocompletare";
    },
    Send: "Invia",
  },
  Export: {
    Title: "Esporta cronologia chat",
    Copy: "Copia tutto",
    Download: "Scarica file",
    MessageFromYou: "Messaggio da te",
    MessageFromChatGPT: "Messaggio da ChatGPT",
  },
  Memory: {
    Title: "Riassunto storico",
    EmptyContent: "Nessun riassunto",
    Send: "Invia riassunto",
    Copy: "Copia riassunto",
    Reset: "Reimposta chat",
    ResetConfirm: "Confermi il ripristino? Verrà cancellato lo storico",
  },
  Home: {
    NewChat: "Nuova chat",
    DeleteChat: "Eliminare la chat selezionata?",
    DeleteToast: "Chat eliminata",
    Revert: "Annulla",
  },
  Settings: {
    Title: "Impostazioni",
    SubTitle: "Opzioni",
    Actions: {
      ClearAll: "Cancella tutti i dati",
      ResetAll: "Ripristina tutte le opzioni",
      Close: "Chiudi",
      ConfirmResetAll: {
        Confirm: "Ripristinare tutte le impostazioni?",
      },
      ConfirmClearAll: {
        Confirm: "Cancellare tutte le chat?",
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
      Title: "Dimensione font",
      SubTitle: "Regola la dimensione del testo della chat",
    },

    Update: {
      Version: (x: string) => `Versione: ${x}`,
      IsLatest: "Ultimo",
      CheckUpdate: "Controlla aggiornamenti",
      IsChecking: "Controllo aggiornamenti...",
      FoundUpdate: (x: string) => `Nuova versione trovata: ${x}`,
      GoToUpdate: "Aggiorna",
    },
    SendKey: "Tasto invio",
    Theme: "Tema",
    TightBorder: "Bordi stretti",
    SendPreviewBubble: "Anteprima invio",
    Prompt: {
      Disable: {
        Title: "Disattiva completamento automatico",
        SubTitle: "Inizia con / per attivare l'autocompletamento",
      },
      List: "Lista prompt",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} integrati, ${custom} personalizzati`,
      Edit: "Modifica",
      Modal: {
        Title: "Lista prompt",
        Add: "Aggiungi",
        Search: "Cerca prompt",
      },
    },
    HistoryCount: {
      Title: "Numero di messaggi storici",
      SubTitle: "Numero di messaggi storici allegati a ogni richiesta",
    },
    CompressThreshold: {
      Title: "Soglia di compressione",
      SubTitle:
        "La compressione viene eseguita se i messaggi non compressi superano la soglia",
    },
    Token: {
      Title: "API Key",
      SubTitle: "Usa la tua chiave per ignorare il codice di accesso",
      Placeholder: "OpenAI API Key",
    },
    Endpoint: {
      Title: "URL base API",
      SubTitle: "Usa proxy o provider modello personalizzato",
      Placeholder: "es. https://api.openai.com",
    },
    HealthCheck: {
      Title: "Controllo salute",
      Check: "Controlla",
      Checking: "Controllo…",
      Ok: "Servizio OK",
      Fail: (msg: string) => `Errore: ${msg}`,
    },
    Usage: {
      Title: "Saldo",
      SubTitle(used: any, total: any) {
        return `Usato questo mese $${used}, abbonamento totale $${total}`;
      },
      IsChecking: "Verifica…",
      Check: "Verifica di nuovo",
      NoAccess: "Inserisci API Key o codice accesso per vedere il saldo",
    },
    AccessCode: {
      Title: "Codice di accesso",
      SubTitle: "Controllo accesso abilitato",
      Placeholder: "Inserisci codice di accesso",
    },
    Model: "Modello (model)",
    Temperature: {
      Title: "Temperatura",
      SubTitle: "Valori alti rendono l'uscita più casuale",
    },
    MaxTokens: {
      Title: "Max token",
      SubTitle: "Massimo token per risposta",
    },
    PresencePenlty: {
      Title: "Penalità presenza",
      SubTitle: "Valori alti aumentano nuovi argomenti",
    },
  },
  Store: {
    DefaultTopic: "Nuova chat",
    BotHello: "Come posso aiutarti oggi?",
    Error: "Qualcosa è andato storto, riprova più tardi.",
    Prompt: {
      History: (content: string) =>
        "Questo è un riassunto della cronologia tra IA e utente:" + content,
      Topic: "Fornisci un breve titolo in 4-5 parole, senza punteggiatura",
      Summarize: "Riassumi la conversazione in 200 caratteri o meno",
    },
    ConfirmClearAll: "Confermi di cancellare tutte le chat e impostazioni?",
  },
  Copy: {
    Success: "Copiato negli appunti",
    Failed: "Copia fallita, consenti permessi agli appunti",
  },
  Context: {
    Toast: (x: any) => `${x} prompt di contesto impostati`,
    Edit: "Contesto e memoria",
    Add: "Aggiungi prompt",
  },
};

export type LocaleType = typeof it;
export default it;
