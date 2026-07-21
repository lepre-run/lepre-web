import type { TranslationCatalog } from "./en";

export const italian = {
  home: {
    opening: "Apertura degli allenamenti locali…",
    heroTitle: "Allenati con metodo.",
    heroDescription: "Scopri la struttura di ogni corsa, non soltanto la sua media.",
    connectStrava: "Connetti Strava",
  },
  actions: {
    sync: "Sincronizza",
    syncing: "Sincronizzazione…",
    paused: "In pausa",
    download: "Scarica",
    disconnect: "Disconnetti",
  },
  notices: {
    reconnectError: "Riconnetti Strava per sincronizzare gli allenamenti.",
    synchronizationError: "Al momento non è possibile sincronizzare gli allenamenti.",
    rateLimited_one:
      "Strava ha raggiunto il limite di richieste. L’importazione è in pausa e riprenderà automaticamente tra circa {{count}} minuto.",
    rateLimited_other:
      "Strava ha raggiunto il limite di richieste. L’importazione è in pausa e riprenderà automaticamente tra circa {{count}} minuti.",
    disconnectError: "Non è stato possibile disconnettere Strava.",
    offline: "Sei offline. Stai visualizzando gli allenamenti salvati su questo dispositivo.",
    reauthorization:
      "Riconnetti Strava per sincronizzare. Gli allenamenti locali restano disponibili.",
  },
  feed: {
    eyebrow: "Registro allenamenti",
    title: "I tuoi allenamenti, fase per fase.",
    storedCount_one: "{{count}} allenamento salvato in locale",
    storedCount_other: "{{count}} allenamenti salvati in locale",
    importing: "Importazione delle corse recenti…",
    emptyTitle: "Nessuna corsa trovata",
    emptyDescription:
      "Gli allenamenti completati appariranno qui dopo la classificazione dei giri.",
  },
  workout: {
    date: "Data",
    distance: "Distanza",
    lapStructure: "Struttura dei giri",
    moving: "in movimento",
    noLaps: "Strava non ha fornito i dati dei giri per questa corsa.",
  },
  download: {
    eyebrow: "Storico portabile",
    title: "Scarica lo storico degli allenamenti",
    description: "Scegli un intervallo di date e scarica un file JSON pronto per un LLM.",
    from: "Dal",
    to: "Al",
    workoutCount_one: "Sarà incluso {{count}} allenamento",
    workoutCount_other: "Saranno inclusi {{count}} allenamenti",
    downloadJson: "Scarica JSON",
    cancel: "Annulla",
  },
  classification: {
    intervals: "Ripetute: {{repetitions}} × {{work}}, recupero {{recovery}}",
    progressive: "Progressivo in {{stageCount}} fasi",
    tempo: "Corsa a ritmo medio di {{distance}}",
    repeatedHills: "{{repetitions}} ripetute in salita con recupero in corsa lenta",
    steadyStructuredRun: "Corsa strutturata a ritmo costante",
    freeRun: "Corsa libera",
    unknown: "Allenamento non classificato",
  },
  connectFailed: {
    title: "Connessione non riuscita",
    tryAgain: "Riprova",
    reference: "rif: {{id}}",
    reasons: {
      userDenied: "Hai rifiutato l’autorizzazione di Strava.",
      stateInvalid: "Il collegamento è scaduto o non corrisponde. Riprova.",
      missingCode: "Strava non ha restituito un codice di autorizzazione.",
      stravaExchangeFailed: "Non è stato possibile raggiungere Strava. Riprova.",
      stravaNotConfigured: "La connessione a Strava non è ancora configurata.",
      scopeInsufficient: "Sono necessarie tutte e tre le autorizzazioni per collegare l’account.",
      databaseFailure: "Si è verificato un problema da parte nostra. Riprova.",
      unknown: "Si è verificato un problema. Riprova.",
    },
  },
} as const satisfies TranslationCatalog;
