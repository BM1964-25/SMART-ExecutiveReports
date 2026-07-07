import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  KeyRound,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  Plug,
  Plus,
  Printer,
  Save,
  Trash2,
  Unplug,
  Upload,
} from "lucide-react";
import { ChangeEvent, useEffect, useRef, useState } from "react";

type Status = "green" | "yellow" | "red";
type ReportType =
  | "Statusbericht"
  | "Projektbericht"
  | "Management Report"
  | "Steering Committee Report"
  | "Lenkungsausschussbericht"
  | "Monatsbericht"
  | "Quartalsbericht"
  | "Revisionsbericht"
  | "Due-Diligence-Bericht"
  | "ESG-Bericht"
  | "Claim Report"
  | "Risikobericht"
  | "Qualitätsbericht"
  | "Baustellenbericht"
  | "Bauherrenbericht"
  | "Investorenbericht"
  | "Bankbericht"
  | "Behördenbericht";
type SectionKey =
  | "header"
  | "schedule"
  | "costs"
  | "progress"
  | "risks"
  | "quality"
  | "decisions"
  | "resources"
  | "contract"
  | "nextSteps"
  | "attachments";

type Milestone = {
  id: string;
  label: string;
  planDate: string;
  actualDate: string;
  status: Status;
  delayDays: number;
  cause: string;
  action: string;
};

type Claim = {
  id: string;
  count: number;
  label: string;
  volume: number;
  status: string;
  owner: string;
  note: string;
};

type WorkPackage = {
  id: string;
  trade: string;
  planned: number;
  actual: number;
  status: Status;
  note: string;
};

type Risk = {
  id: string;
  title: string;
  type: "Risiko" | "Chance";
  description: string;
  probability: number;
  impact: number;
  status: Status;
  mitigation: string;
  owner: string;
  dueDate: string;
  trend: string;
};

type Decision = {
  id: string;
  point: string;
  decision: string;
  decider: string;
  dueDate: string;
  consequence: string;
  status: string;
  recommendation: string;
};

type TaskItem = {
  id: string;
  task: string;
  owner: string;
  dueDate: string;
  priority: string;
  status: string;
};

type Attachment = {
  id: string;
  caption: string;
  description: string;
  dataUrl: string;
};

type SectionNarrative = {
  notes: string;
  generated: string;
};

type Report = {
  id: string;
  reportType: ReportType;
  projectName: string;
  projectNo: string;
  client: string;
  periodFrom: string;
  periodTo: string;
  author: string;
  reportNo: string;
  phase: string;
  overallStatus: Status;
  scheduleStatus: Status;
  costStatus: Status;
  riskStatus: Status;
  lastEdited: string;
  sections: Record<SectionKey, boolean>;
  schedule: {
    criticalPath: string;
    largestDelay: string;
    delayCause: string;
    trend: string;
    milestones: Milestone[];
  };
  costs: {
    budget: number;
    actual: number;
    forecast: number;
    claims: Claim[];
  };
  progress: {
    overall: number;
    workPackages: WorkPackage[];
  };
  risks: Risk[];
  quality: {
    openDefects: number;
    inProgressDefects: number;
    resolvedDefects: number;
    upcomingApprovals: string;
    completedApprovals: string;
    criticalTopics: string;
  };
  decisions: Decision[];
  resources: {
    coreTeamLoad: string;
    bottlenecks: string;
    openProcurements: string;
    externalSupport: string;
    notes: string;
  };
  contract: {
    claimStatus: string;
    delayNotices: string;
    openReceivables: string;
    disputedItems: string;
    claimRisk: string;
    nextSteps: string;
  };
  nextSteps: TaskItem[];
  attachments: Attachment[];
  aiDrafts: Record<string, string>;
  sectionNarratives: Record<SectionKey, SectionNarrative>;
};

const APP_NAME = "SMART Executive Reports";
const STORAGE_KEY = "smart-executive-reports.v1";
const ANTHROPIC_KEY_STORAGE = "smart-executive-reports.anthropic-key";
const ANTHROPIC_MODEL = "claude-haiku-4-5";

const reportTypes: ReportType[] = [
  "Statusbericht",
  "Projektbericht",
  "Management Report",
  "Steering Committee Report",
  "Lenkungsausschussbericht",
  "Monatsbericht",
  "Quartalsbericht",
  "Revisionsbericht",
  "Due-Diligence-Bericht",
  "ESG-Bericht",
  "Claim Report",
  "Risikobericht",
  "Qualitätsbericht",
  "Baustellenbericht",
  "Bauherrenbericht",
  "Investorenbericht",
  "Bankbericht",
  "Behördenbericht",
];

const sectionLabels: Record<SectionKey, string> = {
  header: "Kopfdaten",
  schedule: "Termine",
  costs: "Kosten",
  progress: "Fortschritt und Leistung",
  risks: "Risiken und Chancen",
  quality: "Qualität",
  decisions: "Entscheidungen und Handlungsbedarf",
  resources: "Ressourcen und Personal",
  contract: "Vertrag und Claims",
  nextSteps: "Nächste Schritte",
  attachments: "Anhänge und Fotos",
};

const statusText: Record<Status, string> = {
  green: "Grün",
  yellow: "Gelb",
  red: "Rot",
};

const today = () => new Date().toISOString().slice(0, 10);
const uid = () => crypto.randomUUID();
const formatEuro = (value: number) =>
  new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value || 0);
const parseEuro = (value: string) => Number(value.replace(/[^\d,-]/g, "").replace(",", ".")) || 0;

const emptySections = (): Record<SectionKey, boolean> => ({
  header: true,
  schedule: true,
  costs: true,
  progress: true,
  risks: true,
  quality: true,
  decisions: true,
  resources: true,
  contract: true,
  nextSteps: true,
  attachments: true,
});

const emptySectionNarratives = (): Record<SectionKey, SectionNarrative> =>
  (Object.keys(sectionLabels) as SectionKey[]).reduce(
    (items, key) => ({
      ...items,
      [key]: {
        notes: "",
        generated: "",
      },
    }),
    {} as Record<SectionKey, SectionNarrative>,
  );

const createReport = (sequence = 1): Report => ({
  id: uid(),
  reportType: "Statusbericht",
  projectName: "Neues Bauprojekt",
  projectNo: `PRJ-${String(sequence).padStart(3, "0")}`,
  client: "Auftraggeber",
  periodFrom: today(),
  periodTo: today(),
  author: "Projektsteuerung",
  reportNo: String(sequence).padStart(2, "0"),
  phase: "Ausführung",
  overallStatus: "yellow",
  scheduleStatus: "yellow",
  costStatus: "green",
  riskStatus: "yellow",
  lastEdited: today(),
  sections: emptySections(),
  schedule: {
    criticalPath: "Rohbau, TGA-Koordination, Ausbau",
    largestDelay: "14 Tage",
    delayCause: "Lieferverzug technischer Komponenten",
    trend: "Stabil mit leichtem Terminrisiko",
    milestones: [
      {
        id: uid(),
        label: "Rohbau abgeschlossen",
        planDate: today(),
        actualDate: today(),
        status: "yellow",
        delayDays: 7,
        cause: "Materialverfügbarkeit",
        action: "Wochensteuerung verdichtet",
      },
    ],
  },
  costs: {
    budget: 18000000,
    actual: 8400000,
    forecast: 18600000,
    claims: [
      { id: uid(), count: 1, label: "TGA Mehrleistung", volume: 250000, status: "in Prüfung", owner: "Kostensteuerung", note: "Bewertung bis Monatsende" },
    ],
  },
  progress: {
    overall: 46,
    workPackages: [
      { id: uid(), trade: "Rohbau", planned: 60, actual: 56, status: "yellow", note: "Aufholplan aktiv" },
      { id: uid(), trade: "Fassade", planned: 25, actual: 24, status: "green", note: "im Plan" },
      { id: uid(), trade: "TGA", planned: 35, actual: 28, status: "red", note: "Planlauf klären" },
    ],
  },
  risks: [
    {
      id: uid(),
      title: "Lieferverzug TGA",
      type: "Risiko",
      description: "Kritische Komponenten mit verlängerter Lieferzeit.",
      probability: 4,
      impact: 4,
      status: "red",
      mitigation: "Alternativlieferanten und Freigaben beschleunigen",
      owner: "Projektleitung",
      dueDate: today(),
      trend: "steigend",
    },
  ],
  quality: {
    openDefects: 18,
    inProgressDefects: 9,
    resolvedDefects: 31,
    upcomingApprovals: "Fassadenmockup, TGA Musterraum",
    completedApprovals: "Rohbauabschnitt A",
    criticalTopics: "Dokumentation und Schnittstellenkoordination TGA",
  },
  decisions: [
    {
      id: uid(),
      point: "TGA Alternativprodukt",
      decision: "Freigabe des gleichwertigen Produkts",
      decider: "Auftraggeber",
      dueDate: today(),
      consequence: "Weitere Terminverschiebung im kritischen Pfad",
      status: "offen",
      recommendation: "Freigabe mit technischer Nebenbestimmung",
    },
  ],
  resources: {
    coreTeamLoad: "hoch, aber steuerbar",
    bottlenecks: "Fachplanung TGA",
    openProcurements: "Restleistungen Ausbau",
    externalSupport: "Termin- und Claim-Support empfohlen",
    notes: "Jour fixe Frequenz bleibt erhöht.",
  },
  contract: {
    claimStatus: "Ein größerer Nachtrag in Prüfung",
    delayNotices: "2 offene Behinderungsanzeigen",
    openReceivables: "keine kritischen offenen Forderungen",
    disputedItems: "Abgrenzung TGA Mehrleistung",
    claimRisk: "mittel",
    nextSteps: "Bewertung, Verhandlungsvorbereitung, Dokumentation",
  },
  nextSteps: [
    { id: uid(), task: "TGA Freigabe herbeiführen", owner: "Auftraggeber", dueDate: today(), priority: "hoch", status: "offen" },
  ],
  attachments: [],
  aiDrafts: {},
  sectionNarratives: emptySectionNarratives(),
});

const germanTextReplacements: Array<[string, string]> = [
  ["Ausfuehrung", "Ausführung"],
  ["Pruefung", "Prüfung"],
  ["pruefung", "prüfung"],
  ["fuer", "für"],
  ["spaetere", "spätere"],
  ["Materialverfuegbarkeit", "Materialverfügbarkeit"],
  ["klaeren", "klären"],
  ["verlaengerter", "verlängerter"],
  ["erhoeht", "erhöht"],
  ["groesserer", "größerer"],
  ["herbeifuehren", "herbeiführen"],
  ["Qualitaet", "Qualität"],
  ["Maengel", "Mängel"],
  ["Nachtraege", "Nachträge"],
  ["Leistungsstaende", "Leistungsstände"],
  ["Anhaenge", "Anhänge"],
  ["Unterstuetzung", "Unterstützung"],
  ["Massnahme", "Maßnahme"],
  ["Massnahmen", "Maßnahmen"],
  ["Gegenmassnahme", "Gegenmaßnahme"],
  ["Prioritaet", "Priorität"],
  ["Gruen", "Grün"],
  ["Loeschen", "Löschen"],
  ["Oeffnen", "Öffnen"],
  ["naechste", "nächste"],
  ["Naechste", "Nächste"],
];

const normalizeGermanText = (value: string) =>
  germanTextReplacements.reduce((text, [from, to]) => text.split(from).join(to), value);

const legacyAiPlaceholderFragment = "Platzhalter für spätere LLM-Anbindung";

const cleanAiDrafts = (drafts: Partial<Record<string, string>> = {}): Record<string, string> => {
  const cleaned: Record<string, string> = {};
  Object.entries(drafts).forEach(([key, value]) => {
    if (typeof value === "string" && !value.includes(legacyAiPlaceholderFragment)) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

const normalizeStoredText = <T,>(value: T, key = ""): T => {
  if (typeof value === "string") {
    return (key === "dataUrl" ? value : normalizeGermanText(value)) as T;
  }
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeStoredText(entry)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [entryKey, normalizeStoredText(entryValue, entryKey)]),
    ) as T;
  }
  return value;
};

const normalizeReports = (items: Partial<Report>[]): Report[] =>
  items.map((item, index) => {
    const normalizedItem = normalizeStoredText(item);
    return {
      ...createReport(index + 1),
      ...normalizedItem,
      reportType: reportTypes.includes(normalizedItem.reportType as ReportType) ? (normalizedItem.reportType as ReportType) : "Statusbericht",
      sections: { ...emptySections(), ...(normalizedItem.sections ?? {}) },
      aiDrafts: cleanAiDrafts(normalizedItem.aiDrafts),
      sectionNarratives: { ...emptySectionNarratives(), ...(normalizedItem.sectionNarratives ?? {}) },
    };
  });

function App() {
  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const [reports, setReports] = useState<Report[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeReports(JSON.parse(raw) as Partial<Report>[]) : [createReport(1)];
  });
  const [activeId, setActiveId] = useState(reports[0]?.id ?? "");
  const [view, setView] = useState<"dashboard" | "editor" | "preview" | "api">("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const activeReport = reports.find((report) => report.id === activeId) ?? reports[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  }, [reports]);

  const updateReport = (patch: Partial<Report>) => {
    setReports((items) =>
      items.map((report) => (report.id === activeReport.id ? { ...report, ...patch, lastEdited: today() } : report)),
    );
  };

  const updateNested = <K extends keyof Report>(key: K, value: Report[K]) => updateReport({ [key]: value } as Partial<Report>);

  const addReport = () => {
    const report = createReport(reports.length + 1);
    setReports((items) => [report, ...items]);
    setActiveId(report.id);
    setView("editor");
  };

  const duplicateReport = (source: Report, followUp = false) => {
    const nextNo = String(Number(source.reportNo || reports.length) + 1).padStart(2, "0");
    const report: Report = {
      ...structuredClone(source),
      id: uid(),
      reportNo: followUp ? nextNo : `${source.reportNo}-Kopie`,
      periodFrom: followUp ? source.periodTo : source.periodFrom,
      periodTo: today(),
      lastEdited: today(),
    };
    setReports((items) => [report, ...items]);
    setActiveId(report.id);
    setView("editor");
  };

  const deleteReport = (id: string) => {
    const remaining = reports.filter((report) => report.id !== id);
    setReports(remaining.length ? remaining : [createReport(1)]);
    if (id === activeId) setActiveId(remaining[0]?.id ?? "");
  };

  const exportLibrary = () => {
    const payload = {
      app: APP_NAME,
      exportedAt: new Date().toISOString(),
      reports,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smart-executive-reports-${today()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const restoreLibrary = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const parsed = JSON.parse(await file.text()) as Partial<Report>[] | { reports?: Partial<Report>[] };
      const importedReports = Array.isArray(parsed) ? parsed : parsed.reports;
      if (!Array.isArray(importedReports)) throw new Error("Die Datei enthält keine Berichtsbibliothek.");
      const normalized = normalizeReports(importedReports);
      setReports(normalized.length ? normalized : [createReport(1)]);
      setActiveId(normalized[0]?.id ?? "");
      setView("dashboard");
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Die Sicherungsdatei konnte nicht gelesen werden.");
    }
  };

  if (!activeReport) return null;

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-head">
          <div className="brand">
            <div className="brand-mark">S</div>
            <div className="brand-copy">
              <strong>{APP_NAME}</strong>
            </div>
          </div>
        </div>
        <nav>
          <button className={view === "dashboard" ? "active" : ""} title="Dashboard" onClick={() => setView("dashboard")}>
            <FileText size={18} /> <span>Dashboard</span>
          </button>
          <button className={view === "editor" ? "active" : ""} title="Editor" onClick={() => setView("editor")}>
            <Save size={18} /> <span>Editor</span>
          </button>
          <button className={view === "preview" ? "active" : ""} title="Vorschau" onClick={() => setView("preview")}>
            <Printer size={18} /> <span>Vorschau</span>
          </button>
          <button className={view === "api" ? "active" : ""} title="API-Schlüssel" onClick={() => setView("api")}>
            <KeyRound size={18} /> <span>API-Schlüssel</span>
          </button>
        </nav>
        <div className="sidebar-bottom">
          <button
            className="collapse-button"
            title={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
            aria-label={sidebarCollapsed ? "Sidebar ausklappen" : "Sidebar einklappen"}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            {!sidebarCollapsed && <span>Einklappen</span>}
          </button>
          <div className="sidebar-card backup-card">
            <h3>Datensicherung</h3>
            <div className="backup-actions">
              <button type="button" onClick={exportLibrary}>
                <Download size={16} />
                Sichern
              </button>
              <button type="button" onClick={() => restoreInputRef.current?.click()}>
                <Upload size={16} />
                Wiederherstellen
              </button>
            </div>
            <p>Komplette Bibliothek als JSON sichern oder wiederherstellen.</p>
            <input ref={restoreInputRef} className="backup-input" type="file" accept="application/json,.json" onChange={restoreLibrary} />
          </div>
          <div className="sidebar-card system-card">
            <h3>Systemstatus</h3>
            <dl>
              <div>
                <dt>Lizenz</dt>
                <dd>Aktiv</dd>
              </div>
              <div>
                <dt>KI</dt>
                <dd><span className="status-dot green" /> KI aktiv</dd>
              </div>
              <div>
                <dt>Speicher</dt>
                <dd><span className="status-dot blue" /> Browser-Speicher</dd>
              </div>
            </dl>
          </div>
        </div>
      </aside>

      <div className="app-frame">
        <header className="topbar">
          <div>
            <p className="eyebrow">{APP_NAME}</p>
            <h1>{activeReport.projectName}</h1>
            <span className="report-type-line">{activeReport.reportType}</span>
          </div>
          <div className="actions">
            <button onClick={addReport}>
              <Plus size={16} /> Neuer Bericht
            </button>
            <button onClick={() => setView("preview")}>
              <FileText size={16} /> Vorschau
            </button>
          </div>
        </header>

        <main className="workspace-scroll">
          <div className="workspace">
            {view === "dashboard" && (
              <Dashboard
                reports={reports}
                activeId={activeReport.id}
                onOpen={(id) => {
                  setActiveId(id);
                  setView("editor");
                }}
                onDuplicate={(report) => duplicateReport(report)}
                onFollowUp={(report) => duplicateReport(report, true)}
                onDelete={deleteReport}
                onCreate={addReport}
              />
            )}
            {view === "editor" && <Editor report={activeReport} onChange={updateReport} onNestedChange={updateNested} />}
            {view === "preview" && <ReportPreview report={activeReport} />}
            {view === "api" && <ApiSettings />}
          </div>
        </main>

      </div>
      <footer className="app-footer">
        <div className="footer-brand">
          <div className="footer-mark">S</div>
          <div>
            <strong>{APP_NAME}</strong>
            <span>Professionelle Executive Reports für Bauprojekte, Management und Steuerung.</span>
          </div>
        </div>
        <div className="footer-legal">
          <p>© 2026 SmartBuilt-AI · Powered by BuiltSmart Hub - Bernhard Metzger</p>
          <nav aria-label="Rechtliche Links">
            <a href="https://www.built-smart-hub.com/impressum" target="_blank" rel="noreferrer">Impressum</a>
            <span>|</span>
            <a href="https://www.built-smart-hub.com/datenschutz" target="_blank" rel="noreferrer">Datenschutz</a>
            <span>|</span>
            <a href="https://www.built-smart-hub.com/agb" target="_blank" rel="noreferrer">AGB</a>
            <span>|</span>
            <a href="https://www.built-smart-hub.com/widerrufbelehrung" target="_blank" rel="noreferrer">Widerrufbelehrung</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Dashboard({
  reports,
  activeId,
  onOpen,
  onDuplicate,
  onFollowUp,
  onDelete,
  onCreate,
}: {
  reports: Report[];
  activeId: string;
  onOpen: (id: string) => void;
  onDuplicate: (report: Report) => void;
  onFollowUp: (report: Report) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <section className="dashboard">
      <div className="section-head">
        <div>
          <h2>Berichtsübersicht</h2>
          <p>Gespeicherte Projekte, Berichtstypen, Status und Fortschreibungen.</p>
        </div>
        <button className="primary" onClick={onCreate}>
          <FilePlus2 size={16} /> Bericht erstellen
        </button>
      </div>
      <div className="type-library" aria-label="Unterstützte Berichtstypen">
        {reportTypes.map((type) => (
          <span key={type}>{type}</span>
        ))}
      </div>
      <div className="report-grid">
        {reports.map((report) => (
          <article key={report.id} className={`report-card ${report.id === activeId ? "selected" : ""}`}>
            <div className="card-top">
              <div>
                <p className="eyebrow">{report.reportType} {report.reportNo}</p>
                <h3>{report.projectName}</h3>
              </div>
              <StatusPill status={report.overallStatus} />
            </div>
            <dl>
              <div><dt>Berichtstyp</dt><dd>{report.reportType}</dd></div>
              <div><dt>Zeitraum</dt><dd>{report.periodFrom} bis {report.periodTo}</dd></div>
              <div><dt>Fortschritt</dt><dd>{report.progress.overall}%</dd></div>
              <div><dt>Kosten</dt><dd><StatusDot status={report.costStatus} /> {statusText[report.costStatus]}</dd></div>
              <div><dt>Termine</dt><dd><StatusDot status={report.scheduleStatus} /> {statusText[report.scheduleStatus]}</dd></div>
              <div><dt>Risiken</dt><dd><StatusDot status={report.riskStatus} /> {statusText[report.riskStatus]}</dd></div>
              <div><dt>Bearbeitet</dt><dd>{report.lastEdited}</dd></div>
            </dl>
            <div className="card-actions">
              <button onClick={() => onOpen(report.id)}>Öffnen</button>
              <button title="Duplizieren" onClick={() => onDuplicate(report)}><Copy size={16} /></button>
              <button title="Folgebericht" onClick={() => onFollowUp(report)}><FilePlus2 size={16} /></button>
              <button title="Löschen" onClick={() => onDelete(report.id)}><Trash2 size={16} /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function ApiSettings() {
  return (
    <section className="api-settings">
      <div className="section-head">
        <div>
          <h2>API-Schlüssel</h2>
          <p>Anthropic-Anbindung für KI-gestützte Berichtstexte und Verbindungsprüfung.</p>
        </div>
      </div>
      <AnthropicApiKeyManager />
      <Panel title="KI-Generierung im Bericht">
        <div className="info-grid">
          <div>
            <h3>Empfohlener Ablauf</h3>
            <p>
              Pro Berichtsabschnitt werden strukturierte Daten, Statuswerte und zusätzliche Stichpunkte gesammelt. Daraus erzeugt die KI
              einen professionellen Abschnittstext, der vor der Übernahme geprüft und bearbeitet werden kann.
            </p>
          </div>
          <div>
            <h3>Sinnvolle Eingabefelder</h3>
            <p>
              Ja: Ein Freitextfeld pro Abschnitt ist sinnvoll. Am besten heißt es „Stichpunkte / Management-Kommentar“ und wird mit den
              Tabellendaten zusammen an die KI übergeben.
            </p>
          </div>
          <div>
            <h3>Umgesetzter Workflow</h3>
            <p>
              Im Editor gibt es pro Abschnitt ein Feld für Stichpunkte und ein separates Feld für den generierten Berichtstext. So bleibt
              nachvollziehbar, was Eingabe war und was die KI formuliert hat.
            </p>
          </div>
        </div>
      </Panel>
    </section>
  );
}

type AnthropicConnectionState = "idle" | "saved" | "connecting" | "checking" | "connected" | "disconnected" | "error";

function AnthropicApiKeyManager() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(ANTHROPIC_KEY_STORAGE) ?? "");
  const [showKey, setShowKey] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [connectionState, setConnectionState] = useState<AnthropicConnectionState>(() =>
    localStorage.getItem(ANTHROPIC_KEY_STORAGE) ? "saved" : "idle",
  );
  const [feedback, setFeedback] = useState(
    localStorage.getItem(ANTHROPIC_KEY_STORAGE)
      ? "API-Schlüssel gespeichert. Verbindung noch nicht geprüft."
      : "Noch kein Anthropic API-Schlüssel gespeichert.",
  );

  const isBusy = connectionState === "connecting" || connectionState === "checking";
  const visibleValue = showKey || isFocused ? apiKey : maskAnthropicKey(apiKey);
  const inputType = showKey ? "text" : isFocused || !apiKey ? "password" : "text";

  const runAnthropicCheck = async (key: string, mode: "connect" | "check" | "save") => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setConnectionState("error");
      setFeedback("Bitte zuerst einen Anthropic API-Schlüssel eingeben.");
      return false;
    }

    setConnectionState(mode === "check" ? "checking" : "connecting");
    setFeedback(mode === "check" ? "Verbindung wird überprüft..." : "Verbindung wird hergestellt...");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": trimmedKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 1,
          messages: [{ role: "user", content: "Verbindungstest" }],
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        const apiMessage = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
        throw new Error(apiMessage);
      }

      setConnectionState("connected");
      setFeedback(mode === "check" ? "Verbindung erfolgreich überprüft." : "Verbindung erfolgreich hergestellt.");
      return true;
    } catch (error) {
      setConnectionState("error");
      setFeedback(error instanceof Error ? `Verbindung fehlgeschlagen: ${error.message}` : "Verbindung fehlgeschlagen.");
      return false;
    }
  };

  const handleSave = async () => {
    const trimmedKey = apiKey.trim();
    if (!trimmedKey) {
      localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
      setConnectionState("error");
      setFeedback("Leerer API-Schlüssel wurde nicht gespeichert.");
      return;
    }

    localStorage.setItem(ANTHROPIC_KEY_STORAGE, trimmedKey);
    setApiKey(trimmedKey);
    setFeedback("API-Schlüssel gespeichert. Verbindung wird geprüft...");
    await runAnthropicCheck(trimmedKey, "save");
  };

  const handleConnect = () => runAnthropicCheck(apiKey, "connect");
  const handleVerify = () => runAnthropicCheck(apiKey, "check");

  const handleDisconnect = () => {
    setConnectionState(apiKey.trim() ? "disconnected" : "idle");
    setFeedback(apiKey.trim() ? "Verbindung getrennt. API-Schlüssel bleibt gespeichert." : "Verbindung getrennt.");
  };

  const handleDelete = () => {
    localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
    setApiKey("");
    setShowKey(false);
    setIsFocused(false);
    setConnectionState("idle");
    setFeedback("API-Schlüssel gelöscht.");
  };

  return (
    <Panel title="Anthropic API-Schlüssel">
      <div className="api-key-manager">
        <div className="api-key-input-row">
          <label className="field api-key-field">
            <span>API-Schlüssel</span>
            <input
              autoComplete="off"
              inputMode="text"
              placeholder="sk-ant-..."
              type={inputType}
              value={visibleValue}
              onBlur={() => setIsFocused(false)}
              onChange={(event) => setApiKey(event.target.value)}
              onFocus={(event) => {
                setIsFocused(true);
                window.requestAnimationFrame(() => event.currentTarget.select());
              }}
            />
          </label>
          <button
            className="icon-button"
            title={showKey ? "API-Schlüssel verbergen" : "API-Schlüssel anzeigen"}
            onClick={() => setShowKey((value) => !value)}
            type="button"
          >
            {showKey ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
          <button className="icon-button danger" title="API-Schlüssel löschen" onClick={handleDelete} type="button">
            <Trash2 size={17} />
          </button>
        </div>

        <div className="api-key-actions">
          <button onClick={handleSave} disabled={isBusy} type="button">
            {isBusy && connectionState === "connecting" ? <Loader2 className="spin" size={16} /> : <Save size={16} />}
            Speichern
          </button>
          <button className={connectionState === "connected" ? "success-action" : ""} onClick={handleConnect} disabled={isBusy} type="button">
            {connectionState === "connecting" ? <Loader2 className="spin" size={16} /> : connectionState === "connected" ? <CheckCircle2 size={16} /> : <Plug size={16} />}
            {connectionState === "connected" ? "Verbindung OK" : "Verbindung"}
          </button>
          <button onClick={handleVerify} disabled={isBusy} type="button">
            {connectionState === "checking" ? <Loader2 className="spin" size={16} /> : <CheckCircle2 size={16} />}
            Verbindung überprüfen
          </button>
          <button onClick={handleDisconnect} disabled={isBusy} type="button">
            <Unplug size={16} />
            Verbindung trennen
          </button>
        </div>

        <div className={`connection-feedback ${connectionState}`}>
          {connectionState === "connected" ? <CheckCircle2 size={16} /> : connectionState === "error" ? <AlertCircle size={16} /> : <Plug size={16} />}
          <span>{feedback}</span>
        </div>
      </div>
    </Panel>
  );
}

function maskAnthropicKey(key: string) {
  if (!key) return "";
  const prefix = key.slice(0, Math.min(7, key.length));
  return `${prefix}${"•".repeat(8)}`;
}

const summarizeSectionData = (report: Report, section: SectionKey) => {
  switch (section) {
    case "header":
      return {
        projekt: report.projectName,
        auftraggeber: report.client,
        phase: report.phase,
        berichtszeitraum: `${report.periodFrom} bis ${report.periodTo}`,
        gesamtstatus: statusText[report.overallStatus],
      };
    case "schedule":
      return report.schedule;
    case "costs":
      return {
        budget: formatEuro(report.costs.budget),
        istKosten: formatEuro(report.costs.actual),
        prognose: formatEuro(report.costs.forecast),
        nachträge: report.costs.claims,
      };
    case "progress":
      return report.progress;
    case "risks":
      return report.risks;
    case "quality":
      return report.quality;
    case "decisions":
      return report.decisions;
    case "resources":
      return report.resources;
    case "contract":
      return report.contract;
    case "nextSteps":
      return report.nextSteps;
    case "attachments":
      return report.attachments.map(({ caption, description }) => ({ caption, description }));
    default:
      return {};
  }
};

const buildFallbackNarrative = (report: Report, section: SectionKey) => {
  const notes = report.sectionNarratives[section]?.notes.trim();
  const sectionData = summarizeSectionData(report, section);
  return [
    "Hinweis: Es ist kein Anthropic API-Schlüssel verbunden. Dieser lokale Entwurf basiert nur auf den vorhandenen Berichtsdaten.",
    `${sectionLabels[section]}: Für ${report.projectName} liegt der Abschnitt mit den aktuellen Berichtsdaten vor.`,
    notes ? `Management-Kommentar: ${notes}` : "Ein zusätzlicher Management-Kommentar wurde noch nicht hinterlegt.",
    `Datengrundlage: ${JSON.stringify(sectionData)}`,
  ].join("\n\n");
};

const summarizeReportForAi = (report: Report) => ({
  berichtstyp: report.reportType,
  projekt: report.projectName,
  auftraggeber: report.client,
  phase: report.phase,
  berichtszeitraum: `${report.periodFrom} bis ${report.periodTo}`,
  gesamtstatus: statusText[report.overallStatus],
  terminstatus: statusText[report.scheduleStatus],
  kostenstatus: statusText[report.costStatus],
  risikostatus: statusText[report.riskStatus],
  kosten: summarizeSectionData(report, "costs"),
  termine: summarizeSectionData(report, "schedule"),
  fortschritt: summarizeSectionData(report, "progress"),
  risiken: summarizeSectionData(report, "risks"),
  entscheidungen: summarizeSectionData(report, "decisions"),
  abschnittstexte: Object.entries(report.sectionNarratives)
    .filter(([, narrative]) => narrative.notes.trim() || narrative.generated.trim())
    .map(([section, narrative]) => ({
      abschnitt: sectionLabels[section as SectionKey],
      stichpunkte: narrative.notes,
      generierterText: narrative.generated,
    })),
});

const buildFallbackAiDraft = (report: Report, label: string) =>
  [
    "Hinweis: Es ist kein Anthropic API-Schlüssel verbunden. Dieser lokale Entwurf basiert nur auf den vorhandenen Berichtsdaten.",
    `${label}: ${report.projectName} befindet sich in der Phase ${report.phase}. Der Gesamtstatus ist ${statusText[report.overallStatus]}.`,
    `Terminstatus: ${statusText[report.scheduleStatus]}. Kostenstatus: ${statusText[report.costStatus]}. Risikostatus: ${statusText[report.riskStatus]}.`,
    "Bitte prüfen und fachlich ergänzen, bevor der Text in den finalen Bericht übernommen wird.",
  ].join("\n\n");

const sanitizeAiDraftText = (value: string) =>
  value
    .split("\n")
    .map((line) =>
      line
        .replace(/^#{1,6}\s*/, "")
        .replace(/\*\*/g, "")
        .replace(/[✅⚠️🔴🟢🟡]/g, "")
        .trim(),
    )
    .filter((line) => line && !/^[-_]{3,}$/.test(line) && !/^\|?[-:\s|]+\|?$/.test(line) && !line.includes("|"))
    .join("\n\n");

async function generateAiDraft(report: Report, label: string) {
  const apiKey = localStorage.getItem(ANTHROPIC_KEY_STORAGE)?.trim();
  if (!apiKey) {
    return buildFallbackAiDraft(report, label);
  }

  const messages: Array<{ role: "user" | "assistant"; content: string }> = [
    {
      role: "user",
      content: [
        "Erstelle den angeforderten Text für einen professionellen deutschen Executive Report.",
        "Schreibe präzise, sachlich und managementtauglich. Erfinde keine Fakten.",
        "Wichtig: Gib ausschließlich sauberen Fließtext zurück.",
        "Kein Markdown, keine Tabellen, keine Emojis, keine Trennlinien, keine Überschriften mit #.",
        "Schließe den Text vollständig ab. Nicht mitten im Satz oder mitten in einer Aufzählung enden.",
        "Wenn es mehrere Befunde gibt, priorisiere die wichtigsten und formuliere kompakt.",
        `Aufgabe: ${label}`,
        `Berichtsdaten: ${JSON.stringify(summarizeReportForAi(report))}`,
      ].join("\n"),
    },
  ];
  const chunks: string[] = [];

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1600,
        messages,
      }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const apiMessage = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
      throw new Error(apiMessage);
    }

    const text = payload?.content?.map((item: { text?: string }) => item.text).filter(Boolean).join("\n\n");
    if (!text) throw new Error("Anthropic hat keinen Text zurückgegeben.");
    chunks.push(text);

    if (payload?.stop_reason !== "max_tokens") {
      break;
    }

    messages.push({ role: "assistant", content: text });
    messages.push({
      role: "user",
      content:
        "Der Text wurde wegen des Tokenlimits abgeschnitten. Fahre direkt fort und schließe den Text vollständig ab. Wiederhole den bisherigen Text nicht.",
    });
  }

  return sanitizeAiDraftText(chunks.join("\n\n"));
}

async function generateSectionNarrative(report: Report, section: SectionKey) {
  const apiKey = localStorage.getItem(ANTHROPIC_KEY_STORAGE)?.trim();
  if (!apiKey) {
    return buildFallbackNarrative(report, section);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 650,
      messages: [
        {
          role: "user",
          content: [
            "Formuliere einen professionellen, sachlichen Executive-Report-Abschnitt auf Deutsch.",
            "Nutze klare Managementsprache, keine Übertreibungen und keine erfundenen Fakten.",
            `Berichtstyp: ${report.reportType}`,
            `Projekt: ${report.projectName}`,
            `Abschnitt: ${sectionLabels[section]}`,
            `Stichpunkte / Management-Kommentar: ${report.sectionNarratives[section]?.notes || "keine"}`,
            `Strukturierte Daten: ${JSON.stringify(summarizeSectionData(report, section))}`,
          ].join("\n"),
        },
      ],
    }),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const apiMessage = payload?.error?.message || payload?.message || `HTTP ${response.status}`;
    throw new Error(apiMessage);
  }

  const text = payload?.content?.map((item: { text?: string }) => item.text).filter(Boolean).join("\n\n");
  if (!text) throw new Error("Anthropic hat keinen Text zurückgegeben.");
  return text;
}

function Editor({
  report,
  onChange,
  onNestedChange,
}: {
  report: Report;
  onChange: (patch: Partial<Report>) => void;
  onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void;
}) {
  const costVariance = report.costs.forecast - report.costs.budget;
  const costVariancePct = report.costs.budget ? (costVariance / report.costs.budget) * 100 : 0;
  const [generatingSection, setGeneratingSection] = useState<SectionKey | null>(null);
  const [generatingAiDraft, setGeneratingAiDraft] = useState<string | null>(null);

  const aiAction = async (label: string) => {
    setGeneratingAiDraft(label);
    try {
      const draft = await generateAiDraft(report, label);
      onNestedChange("aiDrafts", {
        ...cleanAiDrafts(report.aiDrafts),
        [label]: draft,
      });
    } catch (error) {
      onNestedChange("aiDrafts", {
        ...cleanAiDrafts(report.aiDrafts),
        [label]: error instanceof Error ? `KI-Generierung fehlgeschlagen: ${error.message}` : "KI-Generierung fehlgeschlagen.",
      });
    } finally {
      setGeneratingAiDraft(null);
    }
  };

  const setSection = (key: SectionKey, value: boolean) => onChange({ sections: { ...report.sections, [key]: value } });
  const updateNarrative = (section: SectionKey, patch: Partial<SectionNarrative>) =>
    onChange({
      sectionNarratives: {
        ...report.sectionNarratives,
        [section]: {
          ...report.sectionNarratives[section],
          ...patch,
        },
      },
    });

  const handleGenerateSection = async (section: SectionKey) => {
    setGeneratingSection(section);
    try {
      const generated = await generateSectionNarrative(report, section);
      updateNarrative(section, { generated });
    } catch (error) {
      updateNarrative(section, {
        generated: error instanceof Error ? `KI-Generierung fehlgeschlagen: ${error.message}` : "KI-Generierung fehlgeschlagen.",
      });
    } finally {
      setGeneratingSection(null);
    }
  };

  const narrativeProps = (section: SectionKey) => ({
    section,
    narrative: report.sectionNarratives[section],
    isGenerating: generatingSection === section,
    onChange: (patch: Partial<SectionNarrative>) => updateNarrative(section, patch),
    onGenerate: () => handleGenerateSection(section),
  });

  return (
    <section className="editor">
      <div className="module-strip">
        {(Object.keys(sectionLabels) as SectionKey[]).map((key) => (
          <label key={key} className={report.sections[key] ? "enabled" : ""}>
            <input type="checkbox" checked={report.sections[key]} onChange={(event) => setSection(key, event.target.checked)} />
            {sectionLabels[key]}
          </label>
        ))}
      </div>

      <Panel title="Kopfdaten">
        <div className="form-grid">
          <ReportTypeSelect value={report.reportType} onChange={(reportType) => onChange({ reportType })} />
          <Field label="Projektname" value={report.projectName} onChange={(projectName) => onChange({ projectName })} />
          <Field label="Projekt-Nr." value={report.projectNo} onChange={(projectNo) => onChange({ projectNo })} />
          <Field label="Auftraggeber" value={report.client} onChange={(client) => onChange({ client })} />
          <Field label="Berichts-Nr." value={report.reportNo} onChange={(reportNo) => onChange({ reportNo })} />
          <Field label="Zeitraum von" type="date" value={report.periodFrom} onChange={(periodFrom) => onChange({ periodFrom })} />
          <Field label="Zeitraum bis" type="date" value={report.periodTo} onChange={(periodTo) => onChange({ periodTo })} />
          <Field label="Ersteller" value={report.author} onChange={(author) => onChange({ author })} />
          <Field label="Projektphase" value={report.phase} onChange={(phase) => onChange({ phase })} />
        </div>
        <div className="status-row">
          <StatusSelect label="Gesamtstatus" value={report.overallStatus} onChange={(overallStatus) => onChange({ overallStatus })} />
          <StatusSelect label="Terminstatus" value={report.scheduleStatus} onChange={(scheduleStatus) => onChange({ scheduleStatus })} />
          <StatusSelect label="Kostenstatus" value={report.costStatus} onChange={(costStatus) => onChange({ costStatus })} />
          <StatusSelect label="Risikostatus" value={report.riskStatus} onChange={(riskStatus) => onChange({ riskStatus })} />
        </div>
        <SectionNarrativeEditor {...narrativeProps("header")} />
      </Panel>

      <Panel title="Termine">
        <div className="form-grid">
          <Field label="Kritischer Pfad" value={report.schedule.criticalPath} onChange={(criticalPath) => onNestedChange("schedule", { ...report.schedule, criticalPath })} />
          <Field label="Größte Verzögerung" value={report.schedule.largestDelay} onChange={(largestDelay) => onNestedChange("schedule", { ...report.schedule, largestDelay })} />
          <Field label="Ursache der Verzögerung" value={report.schedule.delayCause} onChange={(delayCause) => onNestedChange("schedule", { ...report.schedule, delayCause })} />
          <Field label="Trend" value={report.schedule.trend} onChange={(trend) => onNestedChange("schedule", { ...report.schedule, trend })} />
        </div>
        <EditableMilestones report={report} onNestedChange={onNestedChange} />
        <SectionNarrativeEditor {...narrativeProps("schedule")} />
      </Panel>

      <Panel title="Kosten">
        <div className="form-grid">
          <CurrencyField label="Budget" value={report.costs.budget} onChange={(budget) => onNestedChange("costs", { ...report.costs, budget })} />
          <CurrencyField label="Ist-Kosten" value={report.costs.actual} onChange={(actual) => onNestedChange("costs", { ...report.costs, actual })} />
          <CurrencyField label="Prognose bis Fertigstellung" value={report.costs.forecast} onChange={(forecast) => onNestedChange("costs", { ...report.costs, forecast })} />
          <Readout label="Abweichung absolut" value={formatEuro(costVariance)} />
          <Readout label="Abweichung in Prozent" value={`${costVariancePct.toFixed(1)}%`} />
        </div>
        <EditableClaims report={report} onNestedChange={onNestedChange} />
        <SectionNarrativeEditor {...narrativeProps("costs")} />
      </Panel>

      <Panel title="Fortschritt und Leistung">
        <NumberField label="Gesamtfortschritt in Prozent" value={report.progress.overall} onChange={(overall) => onNestedChange("progress", { ...report.progress, overall })} />
        <EditableWorkPackages report={report} onNestedChange={onNestedChange} />
        <SectionNarrativeEditor {...narrativeProps("progress")} />
      </Panel>

      <Panel title="Risiken und Chancen">
        <EditableRisks report={report} onNestedChange={onNestedChange} />
        <SectionNarrativeEditor {...narrativeProps("risks")} />
      </Panel>

      <Panel title="Qualität">
        <div className="form-grid">
          <NumberField label="Offene Mängel" value={report.quality.openDefects} onChange={(openDefects) => onNestedChange("quality", { ...report.quality, openDefects })} />
          <NumberField label="Mängel in Beseitigung" value={report.quality.inProgressDefects} onChange={(inProgressDefects) => onNestedChange("quality", { ...report.quality, inProgressDefects })} />
          <NumberField label="Behobene Mängel" value={report.quality.resolvedDefects} onChange={(resolvedDefects) => onNestedChange("quality", { ...report.quality, resolvedDefects })} />
          <Field label="Anstehende Abnahmen" value={report.quality.upcomingApprovals} onChange={(upcomingApprovals) => onNestedChange("quality", { ...report.quality, upcomingApprovals })} />
          <Field label="Erfolgte Abnahmen" value={report.quality.completedApprovals} onChange={(completedApprovals) => onNestedChange("quality", { ...report.quality, completedApprovals })} />
          <Field label="Kritische Qualitätsthemen" value={report.quality.criticalTopics} onChange={(criticalTopics) => onNestedChange("quality", { ...report.quality, criticalTopics })} />
        </div>
        <SectionNarrativeEditor {...narrativeProps("quality")} />
      </Panel>

      <Panel title="Offene Entscheidungen und Handlungsbedarf">
        <EditableDecisions report={report} onNestedChange={onNestedChange} />
        <SectionNarrativeEditor {...narrativeProps("decisions")} />
      </Panel>

      <Panel title="Ressourcen, Vertrag und nächste Schritte">
        <div className="form-grid">
          {(["coreTeamLoad", "bottlenecks", "openProcurements", "externalSupport", "notes"] as const).map((key) => (
            <Field key={key} label={key} value={report.resources[key]} onChange={(value) => onNestedChange("resources", { ...report.resources, [key]: value })} />
          ))}
          {(["claimStatus", "delayNotices", "openReceivables", "disputedItems", "claimRisk", "nextSteps"] as const).map((key) => (
            <Field key={key} label={key} value={report.contract[key]} onChange={(value) => onNestedChange("contract", { ...report.contract, [key]: value })} />
          ))}
        </div>
        <EditableTasks report={report} onNestedChange={onNestedChange} />
        <SectionNarrativeEditor {...narrativeProps("resources")} />
        <SectionNarrativeEditor {...narrativeProps("contract")} />
        <SectionNarrativeEditor {...narrativeProps("nextSteps")} />
      </Panel>

      <Panel title="Anhänge und KI-Unterstützung">
        <AttachmentUpload report={report} onNestedChange={onNestedChange} />
        <SectionNarrativeEditor {...narrativeProps("attachments")} />
        <div className="ai-grid">
          {[
            "Management Summary erstellen",
            "Executive Summary erstellen",
            "Abschnittstexte formulieren",
            "Risiken ableiten",
            "Maßnahmen vorschlagen",
            "Widersprüche erkennen",
            "Änderungen zum Vorbericht",
            "Professionelle Formulierungen",
          ].map((label) => (
            <button key={label} onClick={() => aiAction(label)} disabled={generatingAiDraft === label}>
              {generatingAiDraft === label ? <Loader2 className="spin" size={16} /> : <Bot size={16} />}
              {label}
            </button>
          ))}
        </div>
        {Object.entries(cleanAiDrafts(report.aiDrafts)).map(([key, value]) => (
          <div className="ai-note" key={key}>
            <strong>{key}</strong>
            {sanitizeAiDraftText(value)
              .split("\n")
              .filter(Boolean)
              .map((paragraph, index) => (
                <p key={`${key}-${index}`}>{paragraph}</p>
              ))}
          </div>
        ))}
      </Panel>
    </section>
  );
}

function ReportPreview({ report }: { report: Report }) {
  const costUsage = report.costs.budget ? Math.round((report.costs.actual / report.costs.budget) * 100) : 0;
  const riskData = report.risks.map((risk) => ({ name: risk.title, value: risk.probability * risk.impact }));
  const progressData = report.progress.workPackages.map((item) => ({ name: item.trade, Plan: item.planned, Ist: item.actual }));
  const defectData = [
    { name: "Offen", value: report.quality.openDefects },
    { name: "In Arbeit", value: report.quality.inProgressDefects },
    { name: "Behoben", value: report.quality.resolvedDefects },
  ];

  const exportHtml = () => {
    const html = document.querySelector(".report-document")?.outerHTML ?? "";
    const blob = new Blob([`<!doctype html><html><head><title>${APP_NAME}</title><link rel="stylesheet" href="./src/styles.css"></head><body>${html}</body></html>`], {
      type: "text/html",
    });
    downloadBlob(blob, `${report.projectName}-bericht.html`);
  };

  const exportWord = () => {
    const html = document.querySelector(".report-document")?.outerHTML ?? "";
    downloadBlob(new Blob([html], { type: "application/msword" }), `${report.projectName}-bericht.doc`);
  };

  return (
    <section className="preview">
      <div className="preview-toolbar">
        <button onClick={exportHtml}><Download size={16} /> HTML</button>
        <button onClick={() => window.print()}><Printer size={16} /> PDF</button>
        <button onClick={exportWord}><Download size={16} /> Word</button>
      </div>
      <article className="report-document">
        <header className="report-cover">
          <p>{APP_NAME}</p>
          <h2>{report.projectName}</h2>
          <span>{report.reportType} {report.reportNo} | {report.periodFrom} bis {report.periodTo}</span>
        </header>
        <section className="kpi-grid">
          <Kpi title="Gesamtstatus" value={statusText[report.overallStatus]} status={report.overallStatus} />
          <Kpi title="Terminstatus" value={statusText[report.scheduleStatus]} status={report.scheduleStatus} />
          <Kpi title="Kostenstatus" value={statusText[report.costStatus]} status={report.costStatus} />
          <Kpi title="Risikostatus" value={statusText[report.riskStatus]} status={report.riskStatus} />
          <Kpi title="Projektfortschritt" value={`${report.progress.overall}%`} />
          <Kpi title="Budgetausnutzung" value={`${costUsage}%`} />
          <Kpi title="Offene Entscheidungen" value={String(report.decisions.length)} />
          <Kpi title="Offene Mängel" value={String(report.quality.openDefects)} />
        </section>
        <section className="report-section prominent">
          <h3>Executive Dashboard</h3>
          <div className="chart-grid">
            <ChartBox title="Fortschritt je Gewerk">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="Plan" fill="#8aa1bd" />
                  <Bar dataKey="Ist" fill="#0b3a63" />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Qualitätsstatus">
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie data={defectData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85}>
                    {["#b43b3b", "#d6a33c", "#2c7a57"].map((color) => <Cell key={color} fill={color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Risikowerte">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={riskData} layout="vertical">
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={110} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#b43b3b" />
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
            <ChartBox title="Termintrend">
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={report.schedule.milestones.map((m, i) => ({ name: m.label, Abweichung: m.delayDays, index: i + 1 }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="index" />
                  <YAxis />
                  <Tooltip />
                  <Line dataKey="Abweichung" stroke="#d6a33c" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </ChartBox>
          </div>
        </section>
        {report.sections.header && <ReportNarrative report={report} section="header" />}
        {report.sections.decisions && <ReportTable title="Offene Entscheidungen und Handlungsbedarf" rows={report.decisions} columns={["point", "decision", "decider", "dueDate", "status", "recommendation"]} />}
        {report.sections.decisions && <ReportNarrative report={report} section="decisions" />}
        {report.sections.schedule && <ReportTable title="Meilensteine" rows={report.schedule.milestones} columns={["label", "planDate", "actualDate", "status", "delayDays", "action"]} />}
        {report.sections.schedule && <ReportNarrative report={report} section="schedule" />}
        {report.sections.costs && <ReportTable title="Nachträge" rows={report.costs.claims} columns={["count", "label", "volume", "status", "owner", "note"]} />}
        {report.sections.costs && <ReportNarrative report={report} section="costs" />}
        {report.sections.progress && <ReportTable title="Leistungsstände" rows={report.progress.workPackages} columns={["trade", "planned", "actual", "status", "note"]} />}
        {report.sections.progress && <ReportNarrative report={report} section="progress" />}
        {report.sections.risks && <ReportTable title="Risiken und Chancen" rows={report.risks.map((risk) => ({ ...risk, score: risk.probability * risk.impact }))} columns={["title", "type", "probability", "impact", "score", "status", "mitigation", "owner"]} />}
        {report.sections.risks && <ReportNarrative report={report} section="risks" />}
        {report.sections.quality && <ReportNarrative report={report} section="quality" />}
        {report.sections.resources && <ReportNarrative report={report} section="resources" />}
        {report.sections.contract && <ReportNarrative report={report} section="contract" />}
        {report.sections.nextSteps && <ReportNarrative report={report} section="nextSteps" />}
        {report.sections.attachments && report.attachments.length > 0 && (
          <section className="report-section">
            <h3>Anhänge und Fotos</h3>
            <div className="photo-grid">
              {report.attachments.map((item) => (
                <figure key={item.id}>
                  <img src={item.dataUrl} alt={item.caption} />
                  <figcaption>{item.caption}<span>{item.description}</span></figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
        {report.sections.attachments && <ReportNarrative report={report} section="attachments" />}
      </article>
    </section>
  );
}

function ReportNarrative({ report, section }: { report: Report; section: SectionKey }) {
  const text = report.sectionNarratives[section]?.generated.trim();
  if (!text) return null;

  return (
    <section className="report-section narrative-report-section">
      <h3>{sectionLabels[section]} - Berichtstext</h3>
      {text.split("\n").filter(Boolean).map((paragraph, index) => (
        <p key={`${section}-${index}`}>{paragraph}</p>
      ))}
    </section>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function CurrencyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <CurrencyInput value={value} onChange={onChange} />
    </label>
  );
}

function CurrencyInput({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState(formatEuro(value));

  useEffect(() => {
    setDraft(formatEuro(value));
  }, [value]);

  const commit = () => {
    const nextValue = parseEuro(draft);
    onChange(nextValue);
    setDraft(formatEuro(nextValue));
  };

  return (
    <input
      inputMode="decimal"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onFocus={(event) => event.currentTarget.select()}
    />
  );
}

function Readout({ label, value }: { label: string; value: string }) {
  return <div className="readout"><span>{label}</span><strong>{value}</strong></div>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="panel"><h2>{title}</h2>{children}</section>;
}

function StatusSelect({ label, value, onChange }: { label: string; value: Status; onChange: (value: Status) => void }) {
  return (
    <label className="status-select">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value as Status)}>
        <option value="green">Grün</option>
        <option value="yellow">Gelb</option>
        <option value="red">Rot</option>
      </select>
    </label>
  );
}

function SectionNarrativeEditor({
  section,
  narrative,
  isGenerating,
  onChange,
  onGenerate,
}: {
  section: SectionKey;
  narrative: SectionNarrative;
  isGenerating: boolean;
  onChange: (patch: Partial<SectionNarrative>) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="narrative-editor">
      <div className="narrative-title">
        <h4>{sectionLabels[section]} - Berichtstext</h4>
      </div>
      <label className="field narrative-field">
        <span>Stichpunkte / Management-Kommentar</span>
        <textarea
          value={narrative.notes}
          placeholder={`Stichpunkte für ${sectionLabels[section]} eingeben...`}
          onChange={(event) => onChange({ notes: event.target.value })}
        />
      </label>
      <label className="field narrative-field">
        <span>Generierter Berichtstext</span>
        <textarea
          value={narrative.generated}
          placeholder="Hier erscheint der KI-generierte Abschnittstext."
          onChange={(event) => onChange({ generated: event.target.value })}
        />
      </label>
      <div className="narrative-actions">
        <button onClick={onGenerate} disabled={isGenerating} type="button">
          {isGenerating ? <Loader2 className="spin" size={16} /> : <Bot size={16} />}
          Abschnittstext generieren
        </button>
      </div>
    </div>
  );
}

function ReportTypeSelect({ value, onChange }: { value: ReportType; onChange: (value: ReportType) => void }) {
  return (
    <label className="field">
      <span>Berichtstyp</span>
      <select value={value} onChange={(event) => onChange(event.target.value as ReportType)}>
        {reportTypes.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPill({ status }: { status: Status }) {
  return <span className={`pill ${status}`}>{statusText[status]}</span>;
}

function StatusDot({ status }: { status: Status }) {
  return <span className={`dot ${status}`} />;
}

function Kpi({ title, value, status }: { title: string; value: string; status?: Status }) {
  return <div className="kpi"><span>{title}</span><strong>{value}</strong>{status && <StatusDot status={status} />}</div>;
}

function ChartBox({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="chart-box"><h4>{title}</h4>{children}</div>;
}

function ReportTable<T extends Record<string, unknown>>({ title, rows, columns }: { title: string; rows: T[]; columns: string[] }) {
  return (
    <section className="report-section">
      <h3>{title}</h3>
      <table>
        <thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>{columns.map((column) => <td key={column}>{formatReportCell(column, row[column])}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function formatReportCell(column: string, value: unknown) {
  if (column === "status" && (value === "green" || value === "yellow" || value === "red")) {
    return statusText[value];
  }
  if (column === "volume" && typeof value === "number") {
    return formatEuro(value);
  }
  return String(value ?? "");
}

type EditableColumn<T> = {
  key: keyof T;
  label: string;
  type?: "text" | "number" | "date" | "currency" | "status";
  span?: "wide" | "full";
};

function SimpleTable<T extends { id: string }>({
  rows,
  columns,
  onAdd,
  onRemove,
  onChange,
}: {
  rows: T[];
  columns: EditableColumn<T>[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, key: keyof T, value: string | number) => void;
}) {
  return (
    <div className="editable-list">
      {rows.map((row) => (
        <div className="editable-row" key={row.id}>
          {columns.map((column) => (
            <label className={`editable-cell ${column.span ?? ""}`} key={String(column.key)}>
              <span>{column.label}</span>
              <EditableCellInput row={row} column={column} onChange={onChange} />
            </label>
          ))}
          <button className="row-delete" title="Zeile löschen" onClick={() => onRemove(row.id)}>
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button className="secondary" onClick={onAdd}><Plus size={16} /> Zeile hinzufügen</button>
    </div>
  );
}

function EditableCellInput<T extends { id: string }>({
  row,
  column,
  onChange,
}: {
  row: T;
  column: EditableColumn<T>;
  onChange: (id: string, key: keyof T, value: string | number) => void;
}) {
  const value = row[column.key];

  if (column.type === "status") {
    return (
      <select value={String(value ?? "green")} onChange={(event) => onChange(row.id, column.key, event.target.value)}>
        <option value="green">Grün</option>
        <option value="yellow">Gelb</option>
        <option value="red">Rot</option>
      </select>
    );
  }

  if (column.type === "currency") {
    return (
      <CurrencyInput value={Number(value) || 0} onChange={(nextValue) => onChange(row.id, column.key, nextValue)} />
    );
  }

  return (
    <input
      type={column.type === "number" || column.type === "date" ? column.type : "text"}
      value={String(value ?? "")}
      onChange={(event) => onChange(row.id, column.key, column.type === "number" ? Number(event.target.value) : event.target.value)}
    />
  );
}

function EditableMilestones({ report, onNestedChange }: { report: Report; onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void }) {
  const rows = report.schedule.milestones;
  const setRows = (milestones: Milestone[]) => onNestedChange("schedule", { ...report.schedule, milestones });
  return <SimpleTable rows={rows} columns={[{ key: "label", label: "Bezeichnung", span: "wide" }, { key: "planDate", label: "Plantermin", type: "date" }, { key: "actualDate", label: "Ist/Prognose", type: "date" }, { key: "status", label: "Status", type: "status" }, { key: "delayDays", label: "Abw. Tage", type: "number" }, { key: "cause", label: "Ursache", span: "wide" }, { key: "action", label: "Maßnahme", span: "wide" }]} onAdd={() => setRows([...rows, { id: uid(), label: "", planDate: today(), actualDate: today(), status: "green", delayDays: 0, cause: "", action: "" }])} onRemove={(id) => setRows(rows.filter((row) => row.id !== id))} onChange={(id, key, value) => setRows(rows.map((row) => row.id === id ? { ...row, [key]: value } : row))} />;
}

function EditableClaims({ report, onNestedChange }: { report: Report; onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void }) {
  const rows = report.costs.claims;
  const setRows = (claims: Claim[]) => onNestedChange("costs", { ...report.costs, claims });
  return <SimpleTable rows={rows} columns={[{ key: "count", label: "Anzahl", type: "number" }, { key: "label", label: "Bezeichnung", span: "wide" }, { key: "volume", label: "Volumen", type: "currency" }, { key: "status", label: "Status" }, { key: "owner", label: "Verantwortlicher" }, { key: "note", label: "Bemerkung", span: "wide" }]} onAdd={() => setRows([...rows, { id: uid(), count: 1, label: "", volume: 0, status: "", owner: "", note: "" }])} onRemove={(id) => setRows(rows.filter((row) => row.id !== id))} onChange={(id, key, value) => setRows(rows.map((row) => row.id === id ? { ...row, [key]: value } : row))} />;
}

function EditableWorkPackages({ report, onNestedChange }: { report: Report; onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void }) {
  const rows = report.progress.workPackages;
  const setRows = (workPackages: WorkPackage[]) => onNestedChange("progress", { ...report.progress, workPackages });
  return <SimpleTable rows={rows} columns={[{ key: "trade", label: "Gewerk", span: "wide" }, { key: "planned", label: "Plan", type: "number" }, { key: "actual", label: "Ist", type: "number" }, { key: "status", label: "Status", type: "status" }, { key: "note", label: "Bemerkung", span: "wide" }]} onAdd={() => setRows([...rows, { id: uid(), trade: "", planned: 0, actual: 0, status: "green", note: "" }])} onRemove={(id) => setRows(rows.filter((row) => row.id !== id))} onChange={(id, key, value) => setRows(rows.map((row) => row.id === id ? { ...row, [key]: value } : row))} />;
}

function EditableRisks({ report, onNestedChange }: { report: Report; onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void }) {
  const rows = report.risks;
  const setRows = (risks: Risk[]) => onNestedChange("risks", risks);
  return <SimpleTable rows={rows} columns={[{ key: "title", label: "Titel", span: "wide" }, { key: "type", label: "Typ" }, { key: "description", label: "Beschreibung", span: "wide" }, { key: "probability", label: "Wahrscheinlichkeit", type: "number" }, { key: "impact", label: "Auswirkung", type: "number" }, { key: "status", label: "Ampel", type: "status" }, { key: "mitigation", label: "Gegenmaßnahme", span: "wide" }, { key: "owner", label: "Verantwortlicher" }, { key: "dueDate", label: "Termin", type: "date" }, { key: "trend", label: "Trend" }]} onAdd={() => setRows([...rows, { id: uid(), title: "", type: "Risiko", description: "", probability: 1, impact: 1, status: "green", mitigation: "", owner: "", dueDate: today(), trend: "" }])} onRemove={(id) => setRows(rows.filter((row) => row.id !== id))} onChange={(id, key, value) => setRows(rows.map((row) => row.id === id ? { ...row, [key]: value } : row))} />;
}

function EditableDecisions({ report, onNestedChange }: { report: Report; onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void }) {
  const rows = report.decisions;
  const setRows = (decisions: Decision[]) => onNestedChange("decisions", decisions);
  return <SimpleTable rows={rows} columns={[{ key: "point", label: "Punkt" }, { key: "decision", label: "Entscheidung" }, { key: "decider", label: "Entscheider" }, { key: "dueDate", label: "Frist", type: "date" }, { key: "consequence", label: "Konsequenz" }, { key: "status", label: "Status" }, { key: "recommendation", label: "Empfehlung" }]} onAdd={() => setRows([...rows, { id: uid(), point: "", decision: "", decider: "", dueDate: today(), consequence: "", status: "offen", recommendation: "" }])} onRemove={(id) => setRows(rows.filter((row) => row.id !== id))} onChange={(id, key, value) => setRows(rows.map((row) => row.id === id ? { ...row, [key]: value } : row))} />;
}

function EditableTasks({ report, onNestedChange }: { report: Report; onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void }) {
  const rows = report.nextSteps;
  const setRows = (nextSteps: TaskItem[]) => onNestedChange("nextSteps", nextSteps);
  return <SimpleTable rows={rows} columns={[{ key: "task", label: "Aufgabe" }, { key: "owner", label: "Verantwortlicher" }, { key: "dueDate", label: "Termin", type: "date" }, { key: "priority", label: "Priorität" }, { key: "status", label: "Status" }]} onAdd={() => setRows([...rows, { id: uid(), task: "", owner: "", dueDate: today(), priority: "mittel", status: "offen" }])} onRemove={(id) => setRows(rows.filter((row) => row.id !== id))} onChange={(id, key, value) => setRows(rows.map((row) => row.id === id ? { ...row, [key]: value } : row))} />;
}

function AttachmentUpload({ report, onNestedChange }: { report: Report; onNestedChange: <K extends keyof Report>(key: K, value: Report[K]) => void }) {
  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        onNestedChange("attachments", [
          ...report.attachments,
          { id: uid(), caption: file.name, description: "Bezug zum Bericht ergänzen", dataUrl: String(reader.result) },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };
  return (
    <div className="upload">
      <input type="file" accept="image/*" multiple onChange={handleFiles} />
      <div className="photo-grid compact">
        {report.attachments.map((item) => <img key={item.id} src={item.dataUrl} alt={item.caption} />)}
      </div>
    </div>
  );
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.replace(/\//g, "-");
  anchor.click();
  URL.revokeObjectURL(url);
}

export default App;
