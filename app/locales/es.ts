import { SubmitKey } from "../store/app";

const es = {
  WIP: "Próximamente...",
  Error: {
    Unauthorized:
      "Acceso no autorizado, ingresa el código de acceso en la página de configuración.",
  },
  ChatItem: {
    ChatItemCount: (count: number) => `${count} mensajes`,
  },
  Chat: {
    SubTitle: (count: number) => `${count} mensajes con ChatGPT`,
    Actions: {
      ChatList: "Ir a la lista de chats",
      CompressedHistory: "Ver historial comprimido",
      Export: "Exportar historia",
      Copy: "Copiar",
      Stop: "Detener",
      Retry: "Reintentar",
      Delete: "Eliminar",
    },
    Rename: "Renombrar chat",
    Typing: "Escribiendo…",
    Input: (submitKey: string) => {
      var inputHints = `${submitKey} para enviar`;
      if (submitKey === String(SubmitKey.Enter)) {
        inputHints += ", Shift + Enter para salto de línea";
      }
      return inputHints + ", / para autocompletar";
    },
    Send: "Enviar",
  },
  Export: {
    Title: "Exportar historial de chat",
    Copy: "Copiar todo",
    Download: "Descargar archivo",
    MessageFromYou: "Mensaje de usted",
    MessageFromChatGPT: "Mensaje de ChatGPT",
  },
  Memory: {
    Title: "Resumen del historial",
    EmptyContent: "Sin resumen",
    Send: "Enviar resumen",
    Copy: "Copiar resumen",
    Reset: "Reiniciar chat",
    ResetConfirm: "¿Confirmar reinicio? Se borrará el historial y el resumen.",
  },
  Home: {
    NewChat: "Nuevo chat",
    DeleteChat: "¿Eliminar el chat seleccionado?",
    DeleteToast: "Chat eliminado",
    Revert: "Deshacer",
  },
  Settings: {
    Title: "Configuración",
    SubTitle: "Opciones",
    Actions: {
      ClearAll: "Borrar todos los datos",
      ResetAll: "Restablecer todas las opciones",
      Close: "Cerrar",
      ConfirmResetAll: {
        Confirm: "¿Seguro que quieres restablecer todas las configuraciones?",
      },
      ConfirmClearAll: {
        Confirm: "¿Seguro que quieres borrar todos los chats?",
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
      Title: "Tamaño de fuente",
      SubTitle: "Ajusta el tamaño de la fuente del chat",
    },

    Update: {
      Version: (x: string) => `Versión: ${x}`,
      IsLatest: "Actualizado",
      CheckUpdate: "Buscar actualizaciones",
      IsChecking: "Buscando actualizaciones...",
      FoundUpdate: (x: string) => `Nueva versión encontrada: ${x}`,
      GoToUpdate: "Actualizar",
    },
    SendKey: "Tecla de envío",
    Theme: "Tema",
    TightBorder: "Borde ajustado",
    SendPreviewBubble: "Burbuja de vista previa",
    Prompt: {
      Disable: {
        Title: "Desactivar autocompletado",
        SubTitle: "Empieza con / para activar autocompletado",
      },
      List: "Lista de prompts",
      ListCount: (builtin: number, custom: number) =>
        `${builtin} integrados, ${custom} personalizados`,
      Edit: "Editar",
      Modal: {
        Title: "Lista de prompts",
        Add: "Añadir",
        Search: "Buscar prompts",
      },
    },
    HistoryCount: {
      Title: "Cantidad de mensajes históricos",
      SubTitle: "Número de mensajes históricos adjuntos por solicitud",
    },
    CompressThreshold: {
      Title: "Umbral de compresión",
      SubTitle:
        "Se comprimirá si los mensajes históricos sin comprimir superan el umbral",
    },
    Token: {
      Title: "API Key",
      SubTitle: "Usa tu clave para omitir el código de acceso",
      Placeholder: "OpenAI API Key",
    },
    Endpoint: {
      Title: "URL base del API",
      SubTitle: "Usa un proxy o proveedor de modelos personalizado",
      Placeholder: "p.ej. https://api.openai.com",
    },
    HealthCheck: {
      Title: "Chequeo de salud",
      Check: "Comprobar",
      Checking: "Comprobando…",
      Ok: "Servicio OK",
      Fail: (msg: string) => `Error: ${msg}`,
    },
    Usage: {
      Title: "Saldo",
      SubTitle(used: any, total: any) {
        return `Usado este mes $${used}, suscripción total $${total}`;
      },
      IsChecking: "Comprobando…",
      Check: "Comprobar de nuevo",
      NoAccess: "Ingresa API Key o código de acceso para ver saldo",
    },
    AccessCode: {
      Title: "Código de acceso",
      SubTitle: "Control de acceso habilitado",
      Placeholder: "Ingresa el código de acceso",
    },
    Model: "Modelo (model)",
    Temperature: {
      Title: "Temperatura",
      SubTitle: "Valores altos hacen la salida más aleatoria",
    },
    MaxTokens: {
      Title: "Máx tokens",
      SubTitle: "Máximo de tokens por respuesta",
    },
    PresencePenlty: {
      Title: "Penalización de presencia",
      SubTitle: "Valores altos aumentan la probabilidad de nuevos temas",
    },
  },
  Store: {
    DefaultTopic: "Nuevo chat",
    BotHello: "¿En qué puedo ayudarte hoy?",
    Error: "Algo salió mal, intenta de nuevo más tarde.",
    Prompt: {
      History: (content: string) =>
        "Resumen del historial entre IA y usuario:" + content,
      Topic: "Proporciona un título breve de 4-5 palabras, sin puntuación",
      Summarize: "Resume la conversación en 200 caracteres o menos",
    },
    ConfirmClearAll: "¿Confirmas borrar todos los chats y configuraciones?",
  },
  Copy: {
    Success: "Copiado al portapapeles",
    Failed: "Falló la copia, concede permisos al portapapeles",
  },
  Context: {
    Toast: (x: any) => `${x} prompts de contexto establecidos`,
    Edit: "Contexto y memoria",
    Add: "Añadir prompt",
  },
};

export type LocaleType = typeof es;
export default es;
