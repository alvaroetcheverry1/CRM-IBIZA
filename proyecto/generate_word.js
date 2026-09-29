const {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, WidthType, AlignmentType,
  BorderStyle, ShadingType, PageBreak, TableOfContents,
  PageNumber, NumberFormat, Footer, Header,
  convertInchesToTwip, UnderlineType, LineRuleType,
  LevelFormat, convertMillimetersToTwip
} = require("docx");
const fs = require("fs");

// ─── COLOR PALETTE ───────────────────────────────────────────
const C = {
  navy:    "0D1B2A",
  med:     "1A3A5C",
  sky:     "4A6FA5",
  gold:    "C9A84C",
  pearl:   "F5F0E8",
  white:   "FFFFFF",
  dark:    "1A1A2E",
  gray:    "64748B",
  lgray:   "E2E8F0",
  green:   "16A34A",
  red:     "DC2626",
  black:   "111827",
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────
function cm(val) { return convertMillimetersToTwip(val * 10); }

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    thematicBreak: false,
    spacing: { before: 480, after: 240 },
    run: { color: C.navy, bold: true, size: 40 },
    shading: { type: ShadingType.SOLID, color: C.pearl },
  });
}

function heading2(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 32, color: C.med })],
    spacing: { before: 360, after: 160 },
  });
}

function heading3(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 26, color: C.sky })],
    spacing: { before: 280, after: 120 },
  });
}

function heading4(text) {
  return new Paragraph({
    children: [new TextRun({ text, bold: true, size: 24, color: C.gold, underline: { type: UnderlineType.SINGLE } })],
    spacing: { before: 240, after: 100 },
  });
}

function para(text, opts = {}) {
  return new Paragraph({
    children: [new TextRun({
      text,
      size: opts.size || 22,
      color: opts.color || C.black,
      bold: opts.bold || false,
      italics: opts.italic || false,
    })],
    spacing: { before: 60, after: opts.after || 140, line: 340, lineRule: LineRuleType.EXACT },
    alignment: opts.align || AlignmentType.JUSTIFIED,
  });
}

function paraRich(runs) {
  return new Paragraph({
    children: runs,
    spacing: { before: 60, after: 140, line: 340, lineRule: LineRuleType.EXACT },
    alignment: AlignmentType.JUSTIFIED,
  });
}

function run(text, opts = {}) {
  return new TextRun({
    text,
    size: opts.size || 22,
    color: opts.color || C.black,
    bold: opts.bold || false,
    italics: opts.italic || false,
    underline: opts.underline ? { type: UnderlineType.SINGLE } : undefined,
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: C.black })],
    bullet: { level },
    spacing: { before: 40, after: 60, line: 300, lineRule: LineRuleType.EXACT },
  });
}

function bulletRich(runs, level = 0) {
  return new Paragraph({
    children: runs,
    bullet: { level },
    spacing: { before: 40, after: 60, line: 300, lineRule: LineRuleType.EXACT },
  });
}

function numbered(text, level = 0) {
  return new Paragraph({
    children: [new TextRun({ text, size: 22, color: C.black })],
    numbering: { reference: "numbered-list", level },
    spacing: { before: 40, after: 60, line: 300, lineRule: LineRuleType.EXACT },
  });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function spacer(n = 1) {
  return Array.from({ length: n }, () =>
    new Paragraph({ children: [new TextRun("")], spacing: { before: 60, after: 60 } })
  );
}

function divider() {
  return new Paragraph({
    children: [new TextRun({ text: "─".repeat(80), color: C.gold, size: 18 })],
    spacing: { before: 160, after: 160 },
    alignment: AlignmentType.CENTER,
  });
}

function infoBox(label, text, color = C.med) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: label + "  ", bold: true, size: 22, color: C.gold }),
                  new TextRun({ text, size: 22, color: C.white }),
                ],
                spacing: { before: 80, after: 80 },
              }),
            ],
            shading: { type: ShadingType.SOLID, color },
            margins: { top: cm(0.2), bottom: cm(0.2), left: cm(0.4), right: cm(0.4) },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 6, color: C.gold },
              bottom: { style: BorderStyle.SINGLE, size: 6, color: C.gold },
              left: { style: BorderStyle.SINGLE, size: 12, color: C.gold },
              right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            },
          }),
        ],
      }),
    ],
    margins: { top: cm(0.3), bottom: cm(0.3) },
  });
}

function kpiRow(items) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: items.map(({ val, label }) =>
          new TableCell({
            children: [
              new Paragraph({
                children: [new TextRun({ text: val, bold: true, size: 52, color: C.gold })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 60, after: 20 },
              }),
              new Paragraph({
                children: [new TextRun({ text: label, size: 18, color: C.white })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 0, after: 60 },
              }),
            ],
            shading: { type: ShadingType.SOLID, color: C.navy },
            margins: { top: cm(0.3), bottom: cm(0.3), left: cm(0.2), right: cm(0.2) },
            borders: {
              top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
              left: { style: BorderStyle.SINGLE, size: 2, color: C.gold },
              right: { style: BorderStyle.SINGLE, size: 2, color: C.gold },
            },
          })
        ),
      }),
    ],
  });
}

function sectionTitle(num, text) {
  return new Paragraph({
    children: [
      new TextRun({ text: num + "  ", size: 48, color: C.gold, bold: true }),
      new TextRun({ text, size: 44, color: C.white, bold: true }),
    ],
    shading: { type: ShadingType.SOLID, color: C.navy },
    spacing: { before: 480, after: 320 },
    indent: { left: cm(0.5), right: cm(0.5) },
  });
}

function twoColTable(left, right) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({
          children: left,
          width: { size: 50, type: WidthType.PERCENTAGE },
          margins: { top: cm(0.2), bottom: cm(0.2), left: cm(0.3), right: cm(0.3) },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            right: { style: BorderStyle.SINGLE, size: 4, color: C.gold },
            left: { style: BorderStyle.NONE },
          },
        }),
        new TableCell({
          children: right,
          width: { size: 50, type: WidthType.PERCENTAGE },
          margins: { top: cm(0.2), bottom: cm(0.2), left: cm(0.3), right: cm(0.3) },
          borders: {
            top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
            left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
          },
        }),
      ],
    })],
  });
}

// ─── COMPETITIVE TABLE ────────────────────────────────────────
function compTable() {
  const headers = ["Funcionalidad", "Neural CRM ⭐", "Inmovilla", "Witei", "Optima-CRM", "Avantio", "Guesty"];
  const YES = "✔";  const NO = "✗";  const PART = "~";

  const rows = [
    ["MODELO DE NEGOCIO", "", "", "", "", "", ""],
    ["CRM de Ventas", YES, YES, YES, YES, NO, NO],
    ["Alquiler Larga Duración", YES, PART, NO, YES, NO, NO],
    ["Alquiler Vacacional / PMS", YES, NO, NO, NO, YES, YES],
    ["Inventario híbrido (los 3 tipos)", YES, NO, NO, NO, NO, NO],
    ["INTELIGENCIA ARTIFICIAL", "", "", "", "", "", ""],
    ["Extracción Vision AI de PDFs", YES, NO, NO, NO, NO, NO],
    ["Copys de lujo automáticos", YES, NO, NO, NO, NO, NO],
    ["Agentes Autónomos (5 bots)", YES, NO, NO, NO, NO, PART],
    ["Análisis legal de contratos IA", YES, NO, NO, NO, NO, NO],
    ["Score IA de leads (0-100)", YES, NO, NO, NO, NO, NO],
    ["COMUNICACIÓN", "", "", "", "", "", ""],
    ["WhatsApp Meta API oficial", YES, NO, PART, NO, PART, YES],
    ["Chat integrado en ficha cliente", YES, NO, NO, NO, NO, YES],
    ["Recordatorios automáticos WhatsApp", YES, NO, NO, NO, NO, YES],
    ["DISTRIBUCIÓN Y PORTALES", "", "", "", "", "", ""],
    ["Feed XML Idealista + Fotocasa", YES, YES, YES, YES, YES, NO],
    ["Feed XML Kyero (internacional)", YES, PART, NO, YES, PART, NO],
    ["Feed JSON JamesEdition (ultra-lujo)", YES, NO, NO, YES, NO, NO],
    ["Channel Manager iCal (Airbnb/Booking)", YES, NO, NO, NO, YES, YES],
    ["PLATAFORMA Y SEGURIDAD", "", "", "", "", "", ""],
    ["Multi-Tenant SaaS", YES, YES, YES, YES, YES, YES],
    ["RBAC 5 niveles de acceso", YES, PART, PART, YES, PART, YES],
    ["Cifrado AES-256 datos sensibles", YES, NO, NO, PART, NO, YES],
    ["Audit Log inmutable", YES, NO, NO, NO, NO, NO],
    ["Portal del Propietario", YES, PART, NO, YES, YES, PART],
    ["Marca Blanca completa (CSS vars)", YES, NO, NO, YES, PART, NO],
    ["Deploy con Docker en 1h", YES, NO, NO, NO, NO, NO],
    ["Google Drive + Sheets sync", YES, NO, NO, NO, NO, NO],
    ["PRECIO MENSUAL", "€99–499", "€100–350", "€49–149", "€200–600", "€150–400", "€200–500+"],
  ];

  const categoryRows = new Set(["MODELO DE NEGOCIO", "INTELIGENCIA ARTIFICIAL", "COMUNICACIÓN", "DISTRIBUCIÓN Y PORTALES", "PLATAFORMA Y SEGURIDAD", "PRECIO MENSUAL"]);

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      // Header row
      new TableRow({
        tableHeader: true,
        children: headers.map((h, i) =>
          new TableCell({
            children: [new Paragraph({
              children: [new TextRun({ text: h, bold: true, size: 18, color: i === 1 ? C.gold : C.white })],
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 60 },
            })],
            shading: { type: ShadingType.SOLID, color: i === 1 ? C.med : C.navy },
            margins: { top: cm(0.15), bottom: cm(0.15), left: cm(0.2), right: cm(0.2) },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: C.gold },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: C.gold },
              left: { style: BorderStyle.SINGLE, size: 2, color: C.gold },
              right: { style: BorderStyle.SINGLE, size: 2, color: C.gold },
            },
          })
        ),
      }),
      // Data rows
      ...rows.map(row => {
        const isCat = categoryRows.has(row[0]);
        return new TableRow({
          children: row.map((cell, i) => {
            let bgColor = isCat ? C.sky : (i === 1 ? "E8F0E0" : C.white);
            let textColor = isCat ? C.white : (cell === YES ? C.green : cell === NO ? C.red : cell === PART ? "D97706" : (i === 0 ? C.black : C.black));
            let bold = isCat || i === 0 || i === 1;
            let align = i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER;
            return new TableCell({
              children: [new Paragraph({
                children: [new TextRun({ text: cell, bold: isCat ? true : bold, size: isCat ? 18 : 18, color: textColor })],
                alignment: align,
                spacing: { before: 40, after: 40 },
              })],
              shading: { type: ShadingType.SOLID, color: bgColor },
              columnSpan: isCat ? (i === 0 ? 7 : 0) : 1,
              margins: { top: cm(0.1), bottom: cm(0.1), left: cm(0.15), right: cm(0.15) },
              borders: {
                top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
                left: { style: BorderStyle.SINGLE, size: isCat || i === 1 ? 4 : 1, color: isCat ? C.gold : "CCCCCC" },
                right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              },
            });
          }).filter((_, i) => !isCat || i === 0),
        });
      }),
    ],
  });
}

// ─── BUILD DOCUMENT ───────────────────────────────────────────
async function generate() {
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "numbered-list",
          levels: [
            { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.4), hanging: convertInchesToTwip(0.2) } } } },
            { level: 1, format: LevelFormat.LOWER_LETTER, text: "%2.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: convertInchesToTwip(0.8), hanging: convertInchesToTwip(0.2) } } } },
          ],
        },
      ],
    },
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: C.black } },
      },
      paragraphStyles: [
        {
          id: "Heading1", name: "Heading 1",
          run: { font: "Calibri", size: 40, bold: true, color: C.navy },
          paragraph: { spacing: { before: 480, after: 240 } },
        },
        {
          id: "Heading2", name: "Heading 2",
          run: { font: "Calibri", size: 32, bold: true, color: C.med },
          paragraph: { spacing: { before: 360, after: 160 } },
        },
        {
          id: "Heading3", name: "Heading 3",
          run: { font: "Calibri", size: 26, bold: true, color: C.sky },
          paragraph: { spacing: { before: 280, after: 120 } },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: cm(2.5), bottom: cm(2.5),
              left: cm(3), right: cm(2.5),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "NEURAL CRM  ·  Documento de Proyecto Profesional  ·  Versión 1.0  ·  Junio 2026", size: 16, color: C.gray }),
                ],
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.gold } },
                spacing: { after: 60 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "© 2026 Neural CRM · Documento Confidencial · Todos los derechos reservados  |  Página ", size: 16, color: C.gray }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: C.gold, bold: true }),
                  new TextRun({ text: " de ", size: 16, color: C.gray }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: C.gray }),
                ],
                alignment: AlignmentType.CENTER,
                border: { top: { style: BorderStyle.SINGLE, size: 4, color: C.gold } },
                spacing: { before: 60 },
              }),
            ],
          }),
        },
        children: [

// ═══════════════════════════════════════════════════════════════
// PORTADA
// ═══════════════════════════════════════════════════════════════
          new Paragraph({
            children: [new TextRun({ text: "", size: 22 })],
            spacing: { before: 0, after: cm(1) * 20 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "●  ●  ●", size: 28, color: C.gold, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "NEURAL CRM", size: 96, bold: true, color: C.navy, characterSpacing: 150 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Inteligencia Artificial para Inmobiliarias de Lujo", size: 36, color: C.med, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "─".repeat(60), size: 20, color: C.gold })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "DOCUMENTO DE PROYECTO PROFESIONAL", size: 26, bold: true, color: C.sky, characterSpacing: 100 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Herramientas · Beneficios · Estudio de Mercado · Análisis Competitivo · Branding · Modelo de Negocio", size: 22, color: C.gray })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 600 },
          }),
          ...spacer(4),
          new Paragraph({
            children: [new TextRun({ text: "Versión 1.0  ·  Junio 2026  ·  Confidencial", size: 20, color: C.gray, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Ibiza · Mallorca · Marbella · Costa del Sol", size: 20, color: C.gold, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 400 },
          }),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// ÍNDICE
// ═══════════════════════════════════════════════════════════════
          sectionTitle("", "ÍNDICE DE CONTENIDOS"),
          ...spacer(1),
          ...[
            ["01", "Resumen Ejecutivo"],
            ["02", "El Problema — Los Dolores del Sector Inmobiliario"],
            ["   2.1", "Fragmentación del Software"],
            ["   2.2", "Pérdida de Tiempo en Gestión Manual"],
            ["   2.3", "El Riesgo de las Dobles Reservas"],
            ["   2.4", "Comunicación Dispersa y no Rastreable"],
            ["   2.5", "Falta de Transparencia con el Propietario"],
            ["   2.6", "Pérdida de Leads Internacionales"],
            ["03", "La Solución — Neural CRM"],
            ["   3.1", "Qué es Neural CRM"],
            ["   3.2", "Por qué es Diferente"],
            ["   3.3", "La Propuesta de Valor Única"],
            ["04", "Herramientas y Funcionalidades en Detalle"],
            ["   4.1", "Ingesta Documental Vision AI — Pipeline PDF"],
            ["   4.2", "Módulo de Alquiler Vacacional + Channel Manager"],
            ["   4.3", "Módulo de Alquiler de Larga Duración"],
            ["   4.4", "Pipeline de Venta Kanban"],
            ["   4.5", "Escuadrón de Agentes Autónomos de IA (5 Bots)"],
            ["   4.6", "Distribución Multicanal — Feeds de Portales"],
            ["   4.7", "Portal del Propietario"],
            ["   4.8", "CRM de Leads y Gestión de Clientes"],
            ["   4.9", "WhatsApp Meta API — Comunicación Integrada"],
            ["   4.10", "Calendario, Agenda y Gestión de Visitas"],
            ["   4.11", "Facturación y Control de Pagos"],
            ["   4.12", "Google Drive y Google Sheets Sync"],
            ["05", "Beneficios por Perfil de Usuario"],
            ["   5.1", "Para el Director de Agencia"],
            ["   5.2", "Para el Agente Comercial"],
            ["   5.3", "Para el Responsable de Back Office"],
            ["   5.4", "Para el Propietario del Inmueble"],
            ["06", "Arquitectura Técnica y Seguridad"],
            ["   6.1", "Stack Tecnológico"],
            ["   6.2", "Seguridad y Cumplimiento RGPD"],
            ["   6.3", "Catálogo de Endpoints REST"],
            ["   6.4", "Modelo de Datos — Esquema Relacional"],
            ["07", "Estudio de Mercado"],
            ["   7.1", "Tamaño y Oportunidad del Mercado"],
            ["   7.2", "Segmento Objetivo"],
            ["   7.3", "Análisis Geográfico"],
            ["   7.4", "Tendencias del Sector"],
            ["08", "Análisis Competitivo"],
            ["   8.1", "Tabla Comparativa Completa"],
            ["   8.2", "Análisis Individual de Competidores"],
            ["09", "Análisis DAFO — Matriz Estratégica"],
            ["10", "Branding e Identidad Visual"],
            ["   10.1", "Filosofía de Marca"],
            ["   10.2", "Paleta de Color"],
            ["   10.3", "Tipografía y Jerarquía Visual"],
            ["   10.4", "Marca Blanca (White Label)"],
            ["   10.5", "Voz y Tono de Marca"],
            ["11", "Modelo de Negocio y Precios"],
            ["   11.1", "Planes y Características"],
            ["   11.2", "Proyección de MRR y Rentabilidad"],
            ["   11.3", "Gestión de Costes de IA y APIs"],
            ["12", "Roadmap de Desarrollo"],
            ["13", "Conclusión y Próximos Pasos"],
          ].map(([num, text]) => new Paragraph({
            children: [
              new TextRun({ text: num + "   ", size: 20, color: C.gold, bold: num.trim().length <= 2 }),
              new TextRun({ text, size: 20, color: num.startsWith("   ") ? C.gray : C.navy, bold: !num.startsWith("   ") }),
            ],
            spacing: { before: 30, after: 30 },
          })),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 01 — RESUMEN EJECUTIVO
// ═══════════════════════════════════════════════════════════════
          sectionTitle("01", "RESUMEN EJECUTIVO"),
          para("Neural CRM es la primera plataforma de software SaaS (Software as a Service) Multi-Tenant diseñada exclusivamente para agencias inmobiliarias de alto standing ubicadas en destinos turísticos de lujo. Su propuesta es única en el mercado europeo: unificar en un único panel de control la gestión de Venta Inmobiliaria, Alquiler de Larga Duración y Alquiler Vacacional, potenciado de forma nativa por Inteligencia Artificial Generativa (GPT-4o Vision), una integración oficial de WhatsApp Business Meta API y un escuadrón de cinco agentes autónomos que trabajan 24 horas al día."),
          para("La plataforma nació para resolver un problema específico y costoso de las agencias boutique en enclaves como Ibiza, Mallorca y Marbella: la necesidad de pagar, configurar y sincronizar dos softwares completamente distintos —un CRM de ventas y un PMS de alquiler vacacional— para gestionar el mismo activo inmobiliario. Neural CRM elimina esta fragmentación, presentando una solución integrada, premium y escalable bajo una sola suscripción mensual."),
          ...spacer(1),
          kpiRow([
            { val: "97%", label: "Reducción tiempo\ncarga de fichas" },
            { val: "3 min", label: "Onboarding de\npropiedad completa" },
            { val: "5", label: "Agentes IA\nautónomos activos" },
            { val: "4", label: "Portales internac.\nalimentados" },
            { val: "0", label: "Dobles reservas\ncon Channel Manager" },
          ]),
          ...spacer(1),
          para("El producto se posiciona en la intersección de dos categorías de software que el mercado ha mantenido separadas artificialmente: los CRMs de Ventas Inmobiliarias (Inmovilla, Witei, Optima-CRM) y los Sistemas PMS de Gestión de Alquiler Vacacional (Avantio, Guesty, Hostaway). Su principal factor diferenciador es la automatización nativa por Inteligencia Artificial, específicamente la extracción de imágenes limpias y la redacción de textos comerciales de lujo analizando dossiers PDF mediante GPT-4o Vision, junto con una integración de comunicaciones multicanal a través de WhatsApp Meta API oficial."),
          para("La arquitectura técnica es moderna y robusta: React 18 en el frontend, Node.js 20 + Express.js en el backend, Prisma ORM con PostgreSQL/Supabase como base de datos relacional, y desplegable en cualquier entorno cloud mediante un único comando Docker Compose. La seguridad sigue estándares enterprise: cifrado AES-256-GCM para datos sensibles, control de acceso basado en roles (RBAC) con cinco niveles, registro de auditoría inmutable y rate limiting anti-DDoS."),
          ...spacer(1),
          infoBox("💡 Propuesta de Valor Núcleo:", "\"El primer CRM Híbrido Inmobiliario impulsado por IA para Agencias Premium en Destinos Turísticos de Lujo — que une Venta, Vacacional y Larga Duración en un solo panel, sin duplicidades, con Inteligencia Artificial nativa y comunicación directa por WhatsApp.\"", C.navy),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 02 — EL PROBLEMA / LOS DOLORES
// ═══════════════════════════════════════════════════════════════
          sectionTitle("02", "EL PROBLEMA — LOS DOLORES DEL SECTOR"),
          para("Para comprender por qué Neural CRM existe y por qué tiene una oportunidad real de mercado, es fundamental analizar en profundidad los problemas que padecen diariamente las agencias inmobiliarias boutique en zonas turísticas de alto standing. Estos dolores no son percibidos como tales por todos los profesionales del sector —muchos llevan años trabajando con ellos y los han normalizado— pero representan una pérdida masiva de eficiencia, ingresos y calidad de servicio."),
          ...spacer(1),
          heading2("2.1 Fragmentación del Software: El Coste Oculto de los Dos Programas"),
          para("La realidad operativa más frecuente en una agencia boutique de Ibiza o Mallorca que gestiona villas de lujo es la siguiente: utiliza un CRM de ventas como Inmovilla o Witei para el seguimiento de compradores y el pipeline de venta, y contrata adicionalmente un PMS como Avantio o Guesty para gestionar las reservas de alquiler vacacional del mismo inventario de villas."),
          para("Este escenario implica consecuencias muy concretas y costosas:"),
          bullet("Coste económico directo: Pagar dos suscripciones mensuales independientes, que combinadas pueden superar los €400–700/mes para una agencia mediana. Dinero que sale de los márgenes sin aportar ningún valor adicional al cliente."),
          bullet("Doble alta de cada propiedad: Cuando una villa entra al inventario, hay que darla de alta en dos sistemas diferentes, rellenando los mismos datos dos veces en interfaces distintas. Esto consume tiempo y multiplica el riesgo de errores e inconsistencias."),
          bullet("Sincronización manual permanente: Cualquier cambio en la ficha de una propiedad —nuevas fotos, actualización de precio, cambio de estado— debe replicarse manualmente en los dos sistemas. Si el agente olvida actualizar uno, los datos se desincronizanizan y se presentan informaciones contradictorias a los clientes."),
          bullet("Formación duplicada del equipo: El personal de la agencia tiene que aprender y dominar dos interfaces de software completamente distintas, con flujos de trabajo, atajos de teclado y lógicas diferentes."),
          bullet("Imposibilidad de vista unificada: No existe ningún panel donde el director de la agencia pueda ver, en un solo vistazo, el estado completo de una villa: si está reservada para vacacional en julio, disponible para visitas de compra en septiembre, con un contrato de larga duración pendiente de renovación en octubre. Esa visión holística sencillamente no existe con la arquitectura de dos softwares separados."),
          ...spacer(1),
          heading2("2.2 Pérdida de Tiempo Masiva en la Gestión Manual de Fichas"),
          para("Una de las actividades más intensivas en tiempo en cualquier agencia inmobiliaria es el proceso de incorporar una nueva propiedad al inventario a partir del dossier que entrega el propietario. En el mercado de lujo, estos dossiers son documentos PDF densos, de entre 20 y 80 páginas, con características técnicas detalladas, planos, fotos de alta calidad y descripciones en diferentes idiomas."),
          para("El proceso manual estándar en una agencia convencional incluye: abrir el PDF, leer el documento completo para extraer los datos relevantes (dormitorios, baños, metros cuadrados, calidades especiales, precio), copiar y pegar cada campo en el formulario del CRM, extraer manualmente las fotos del PDF recortando pantallazos o usando herramientas de terceros, retocar las imágenes para limpiarlas, redactar una descripción comercial atractiva en el idioma del mercado objetivo, y traducirla si es necesario. Este proceso completo requiere entre 60 y 90 minutos por propiedad en un agente experimentado."),
          para("En una agencia que recibe 3–5 dossiers nuevos por semana, esto se traduce en 3–7,5 horas semanales de trabajo puramente administrativo y de bajo valor añadido, tiempo que podría destinarse a atender clientes, hacer visitas o negociar operaciones."),
          infoBox("⏱️ Impacto medido:", "Neural CRM reduce el tiempo de onboarding de una propiedad de 90 minutos a menos de 3 minutos gracias al pipeline de Vision AI. Un ahorro del 97% por ficha.", C.navy),
          ...spacer(1),
          heading2("2.3 El Riesgo Más Temido: Las Dobles Reservas"),
          para("En el negocio de alquiler vacacional de lujo, una doble reserva —dos clientes que han reservado la misma villa para las mismas fechas— es el peor escenario posible. Las consecuencias van mucho más allá del problema logístico inmediato de reubicar a uno de los clientes:"),
          bullet("Impacto reputacional severo: Un cliente de alto poder adquisitivo que llega a Ibiza con su familia el 15 de agosto y descubre que su villa está ocupada es, con toda probabilidad, un cliente perdido para siempre y un defensor activo negativo de la agencia."),
          bullet("Penalizaciones económicas: Las plataformas como Airbnb y Booking.com penalizan las cancelaciones de última hora con restricciones en el ranking de búsqueda, comisiones adicionales y posibles suspensiones de la cuenta."),
          bullet("Responsabilidad legal: Dependiendo del contrato firmado, la agencia puede ser liable por daños y perjuicios, incluyendo gastos de alojamiento alternativo para el cliente afectado."),
          para("El origen del problema es la desincronización de calendarios entre los diferentes canales de venta (Airbnb, Booking.com, reservas directas de la agencia). Si una villa tiene disponibilidad visible en Airbnb pero acaba de ser reservada por un cliente directo que llamó por teléfono, existe una ventana de riesgo hasta que el agente actualiza manualmente el calendario en todos los canales. En temporada alta, cuando las reservas se cierran en cuestión de horas, este riesgo es elevadísimo."),
          ...spacer(1),
          heading2("2.4 Comunicación Dispersa y No Rastreable"),
          para("La comunicación con los clientes en las agencias de lujo está fragmentada en múltiples canales sin ningún sistema de centralización: llamadas al móvil personal del agente, WhatsApp en el teléfono personal, correo electrónico en el Gmail personal, mensajes de Instagram Direct, y a veces incluso SMS. Las consecuencias de esta dispersión son profundas y sistemáticas:"),
          bullet("Riesgo de fuga de clientes al agente: Cuando toda la relación con el cliente existe únicamente en el teléfono personal de un agente, si ese agente abandona la agencia, se lleva consigo la relación, el historial de conversaciones y potencialmente el cliente. El valor acumulado en esa relación comercial es propiedad del agente, no de la agencia."),
          bullet("Imposibilidad de supervisión directiva: El director de la agencia no puede supervisar la calidad de las conversaciones comerciales, detectar oportunidades perdidas o hacer coaching basado en conversaciones reales si estas ocurren en teléfonos personales."),
          bullet("Pérdida de contexto en las interacciones: Cuando un cliente llama y el agente habitual no está disponible, quien atiende no tiene ningún contexto de las conversaciones previas. La experiencia del cliente se degrada notablemente."),
          bullet("Violaciones potenciales del RGPD: Almacenar datos de clientes (nombre, teléfono, presupuesto, intereses) en teléfonos personales y aplicaciones de mensajería personales crea riesgos regulatorios significativos bajo el Reglamento General de Protección de Datos."),
          ...spacer(1),
          heading2("2.5 Falta de Transparencia con el Propietario"),
          para("Los propietarios de villas de lujo en Ibiza o Mallorca son en su inmensa mayoría no residentes: alemanes, británicos, neerlandeses, rusos, norteamericanos. Confían la gestión integral de su activo inmobiliario a la agencia y necesitan información actualizada sobre: cuántos días se ha alquilado su villa, qué ingresos ha generado, en qué estado se encuentra el proceso de venta si la han puesto en el mercado, si hay alguna oferta en negociación."),
          para("La respuesta estándar del sector a esta necesidad es un informe mensual en PDF enviado por email, preparado manualmente por el back office de la agencia. Esta solución tiene múltiples problemas: la información llega con semanas de retraso, requiere trabajo manual considerable del equipo de la agencia, y no permite al propietario consultar el estado actual en ningún momento que no sea cuando recibe el informe. El resultado es que los propietarios llaman a la agencia constantemente para pedir actualizaciones, consumiendo tiempo del equipo en tareas de baja prioridad."),
          ...spacer(1),
          heading2("2.6 Pérdida de Leads Internacionales por Barreras de Idioma"),
          para("Más del 80% de los compradores y arrendatarios de propiedades de lujo en Ibiza, Mallorca y Marbella son clientes internacionales: británicos, alemanes, neerlandeses, franceses, escandinavos, norteamericanos. Sin embargo, la gran mayoría de los anuncios en los portales y las fichas de propiedades en los CRMs están redactados únicamente en español o, en el mejor caso, también en inglés."),
          para("La redacción manual de descripciones profesionales de lujo en cuatro idiomas para cada propiedad es económicamente inviable para una agencia boutique. Una descripción de calidad para JamesEdition o Kyero que comunique efectivamente el estilo de vida de una villa mediterránea a un comprador alemán o francés requeriría un redactor nativo especializado en inmobiliario de lujo, lo que supone un coste adicional de €200–500 por propiedad."),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 03 — LA SOLUCIÓN
// ═══════════════════════════════════════════════════════════════
          sectionTitle("03", "LA SOLUCIÓN — NEURAL CRM"),
          heading2("3.1 Qué es Neural CRM"),
          para("Neural CRM es una plataforma de software SaaS (Software as a Service) de arquitectura Multi-Tenant diseñada específicamente para agencias inmobiliarias boutique que operan en destinos turísticos de lujo. La plataforma proporciona un panel de control unificado desde el que una agencia puede gestionar de forma simultánea y sin duplicidades su cartera completa de propiedades, independientemente del modelo de negocio bajo el que se comercialice cada una: venta, alquiler vacacional o alquiler de larga duración."),
          para("El nombre 'Neural' refleja la capa de inteligencia artificial que impregna cada funcionalidad del producto: desde el procesamiento de documentos hasta la cualificación de leads, desde la generación de contenido comercial hasta el análisis legal de contratos. No se trata de un CRM tradicional al que se ha añadido un chatbot como feature marketing; la IA está integrada en el núcleo del flujo de trabajo desde el diseño inicial."),
          ...spacer(1),
          heading2("3.2 Por qué Neural CRM es Diferente"),
          para("La diferenciación de Neural CRM frente a todos los competidores del mercado descansa sobre cuatro pilares que ningún competidor ofrece de forma conjunta en una sola plataforma:"),
          ...spacer(1),
          bulletRich([run("PILAR 1 — Inventario Híbrido Nativo: ", { bold: true, color: C.gold }), run("Una sola ficha de propiedad soporta nativamente los tres modelos de negocio inmobiliario (venta, vacacional y larga duración). El mismo objeto de base de datos puede tener activos simultáneamente su sub-módulo de alquiler vacacional para el verano y su pipeline de venta para el invierno. No hay duplicidad de datos, no hay sincronización manual, no hay inconsistencias.", { color: C.black })]),
          bulletRich([run("PILAR 2 — IA Generativa Nativa en el Flujo de Trabajo: ", { bold: true, color: C.gold }), run("GPT-4o Vision está integrado directamente en el proceso de alta de propiedades. No es una herramienta accesoria; es el motor central del proceso de onboarding. El agente carga el PDF y la IA hace el trabajo: extrae imágenes, detecta características de lujo, redacta descripciones en múltiples idiomas y estructura los datos en el formato que requiere el CRM.", { color: C.black })]),
          bulletRich([run("PILAR 3 — Comunicación Rastreable y Centralizada: ", { bold: true, color: C.gold }), run("La integración oficial con WhatsApp Business Meta API significa que todas las conversaciones con clientes y leads quedan registradas directamente en la ficha de cada cliente dentro del CRM. El director puede supervisar todas las comunicaciones, el equipo completo tiene contexto sobre cada cliente, y los datos no están en teléfonos personales sino en la plataforma de la agencia.", { color: C.black })]),
          bulletRich([run("PILAR 4 — Escuadrón de Agentes Autónomos de IA: ", { bold: true, color: C.gold }), run("Cinco bots especializados que trabajan en background automatizando tareas de alto coste y bajo valor añadido: atención de leads por WhatsApp, generación de guiones comerciales, prospección de captaciones, gestión de citas y análisis legal de contratos. Para una agencia boutique de 3–5 agentes, esto equivale a tener el soporte operativo de un equipo de 10 personas.", { color: C.black })]),
          ...spacer(1),
          heading2("3.3 La Propuesta de Valor Única"),
          twoColTable(
            [
              heading3("El Problema que Resuelve"),
              bullet("Doble CRM + PMS para el mismo inventario"),
              bullet("90 minutos para cargar una propiedad"),
              bullet("Dobles reservas en temporada alta"),
              bullet("WhatsApp personal como canal de ventas"),
              bullet("Propietarios sin visibilidad de su activo"),
              bullet("Leads internacionales perdidos por idioma"),
              bullet("Agentes sin soporte IA para cerrar operaciones"),
            ],
            [
              heading3("La Solución de Neural CRM"),
              bullet("Un solo panel para los tres modelos de negocio"),
              bullet("3 minutos con Vision AI (ahorro del 97%)"),
              bullet("Channel Manager iCal — cero duplicidades"),
              bullet("WhatsApp integrado en la ficha del lead"),
              bullet("Portal del Propietario con datos en tiempo real"),
              bullet("Copys en ES/EN/DE/FR generados automáticamente"),
              bullet("5 agentes IA autónomos trabajando 24/7"),
            ]
          ),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 04 — HERRAMIENTAS Y FUNCIONALIDADES EN DETALLE
// ═══════════════════════════════════════════════════════════════
          sectionTitle("04", "HERRAMIENTAS Y FUNCIONALIDADES EN DETALLE"),
          para("A continuación se presenta la descripción exhaustiva de cada módulo y herramienta que compone el ecosistema de Neural CRM, con especial énfasis en el flujo técnico, el valor de negocio real que aporta y los datos cuantificables de mejora de eficiencia."),

          // ── 4.1 VISION AI ──────────────────────────────────
          heading2("4.1 Ingesta Documental Vision AI — Pipeline PDF"),
          para("La herramienta estrella de Neural CRM es su pipeline de procesamiento documental basado en Inteligencia Artificial Visual. Este sistema transforma el proceso más laborioso y rutinario de cualquier agencia inmobiliaria —la incorporación de una nueva propiedad a partir del dossier del propietario— en un proceso casi completamente automatizado."),
          heading3("¿Cómo Funciona? — El Flujo Técnico Completo"),
          numbered("El agente de la agencia recibe el dossier del propietario (generalmente por email o WhatsApp) y lo arrastra a la interfaz del CRM a través de la pantalla de 'Nuevo Inmueble'. No necesita abrirlo, leerlo ni extraer nada manualmente."),
          numbered("El backend de Neural CRM recibe el archivo PDF y ejecuta en paralelo dos procesos: el módulo pdf-parse extrae el texto plano completo del documento, y el módulo de extracción de imágenes localiza los objetos binarios de imagen incrustados en el PDF (denominados técnicamente 'XObjects') y los extrae como archivos JPEG independientes manteniendo la resolución original."),
          numbered("Si el PDF es un documento escaneado (fotografiado en lugar de generado digitalmente), el sistema activa automáticamente un modo de fallback: renderiza cada página del PDF como imagen de alta resolución y aplica el motor de OCR Tesseract para extraer el texto. Este modo garantiza que incluso los dossiers más antiguos, en papel y fotografiados con teléfono, puedan procesarse correctamente."),
          numbered("Las imágenes extraídas limpias —sin el fondo del PDF, sin marcos, sin texto superpuesto— se suben directamente al CDN de Supabase Storage, que genera para cada una una URL pública permanente de alta disponibilidad. Este paso es crítico: en lugar de enviar las imágenes en formato Base64 a la API de OpenAI (lo que multiplicaría el consumo de tokens y el tiempo de respuesta), se envían únicamente las URLs, que GPT-4o Vision puede acceder directamente."),
          numbered("El sistema construye un prompt estructurado que incluye el texto extraído del PDF y las URLs de todas las imágenes, y realiza una llamada a la API de GPT-4o Vision de OpenAI. El prompt incluye un esquema JSON detallado con todos los campos que debe detectar y completar."),
          numbered("GPT-4o Vision analiza el texto e inspecciona visualmente cada imagen, devolviendo un objeto JSON tipado y validado con: número exacto de dormitorios y baños, superficie en metros cuadrados construida y de parcela, detección booleana de características de lujo (piscina de desbordamiento infinity, jacuzzi exterior, domótica Crestron/Control4, chimenea, bodega climatizada, gimnasio, spa, vistas al mar, primera línea de playa, finca histórica, certificado BREEAM), y un copy comercial completo redactado en tono de lujo en español e inglés."),
          numbered("Neural CRM procesa la respuesta JSON, crea automáticamente la ficha de la propiedad en la base de datos con todos los campos completados, vincula las URLs de las imágenes limpiadas a la galería, y en segundo plano sincroniza todo con la carpeta del cliente en Google Drive."),
          ...spacer(1),
          infoBox("📊 Datos de Impacto:", "Tiempo medio sin Neural CRM: 85–95 min/propiedad. Tiempo con Neural CRM: 2–4 min/propiedad. Ahorro por propiedad: ~90 min. Para una agencia que recibe 5 dossiers por semana: 7,5 horas ahorradas semanalmente = 30 horas mensuales = más de 350 horas anuales.", C.navy),
          heading3("Beneficios Adicionales del Pipeline Vision AI"),
          bullet("Consistencia garantizada: La IA aplica siempre los mismos criterios de extracción, eliminando las variaciones entre agentes en cómo cada uno interpreta y describe una propiedad."),
          bullet("Detección de lujo que los humanos pasan por alto: Características como 'sistema de refrigeración por suelo radiante', 'ventanas de triple acristalamiento', 'generador eléctrico de emergencia' o 'acceso por camino privado' son detectadas automáticamente por la IA en el texto del dossier aunque el agente no las hubiera identificado como características comercialmente relevantes."),
          bullet("Base para distribución inmediata: Al tener los datos estructurados en JSON desde el primer momento, la propiedad queda lista inmediatamente para ser incluida en los feeds XML de Idealista, Kyero y JamesEdition sin ningún paso adicional de enriquecimiento de datos."),

          // ── 4.2 VACACIONAL ─────────────────────────────────
          heading2("4.2 Módulo de Alquiler Vacacional + Channel Manager"),
          para("El módulo de Alquiler Vacacional de Neural CRM gestiona todo el ciclo de vida del alquiler de corta estancia de villas de lujo: desde la configuración inicial de la propiedad hasta la gestión de reservas, pasando por la sincronización de disponibilidad con los portales externos."),
          heading3("Gestión de la Ficha Vacacional"),
          para("Cada propiedad que se configura para alquiler vacacional dispone de un sub-módulo específico que almacena toda la información requerida por la normativa balear y por los portales de alquiler:"),
          bullet("Licencia ETV (Estancia Turística en Vivienda): Código único de licencia turística otorgado por el Govern de les Illes Balears, requisito legal imprescindible para operar en Ibiza y Mallorca desde 2017."),
          bullet("Cédula de Habitabilidad: Documento acreditativo de las condiciones mínimas de habitabilidad del inmueble."),
          bullet("Estructura de precios por temporada: Neural CRM implementa natively el modelo de tres temporadas que utilizan las agencias de la isla: Temporada Alta (junio, julio, agosto) con precios máximos por semana; Temporada Media (mayo, septiembre, octubre) con precios intermedios; y Temporada Baja (noviembre a abril) con precios reducidos para ocupación de invierno."),
          bullet("Depósito de garantía: Importe configurable por propiedad para proteger al propietario frente a daños materiales durante la estancia."),
          bullet("Condiciones de check-in y check-out: Horarios, procedimientos de entrega de llaves y requisitos documentales para la llegada y salida."),
          heading3("Channel Manager iCal — Eliminación de Dobles Reservas"),
          para("El corazón del módulo vacacional es el sistema Channel Manager basado en el protocolo iCal (.ics), el estándar universal de intercambio de datos de calendarios que utilizan Airbnb, Booking.com, Vrbo, HomeAway y todos los portales de alquiler vacacional."),
          para("El funcionamiento es el siguiente: cada villa en Airbnb y en Booking.com expone una URL de calendario iCal pública que contiene todas las reservas activas en esas plataformas. El administrador de la agencia configura en Neural CRM las URLs iCal de cada plataforma para cada villa. A partir de ese momento, un proceso CRON en background —que se ejecuta periódicamente, cada 30–60 minutos— consume automáticamente esas URLs y actualiza el calendario unificado de disponibilidad de la villa en Neural CRM."),
          para("El modelo de datos incluye la tabla ReservaExterna que almacena el identificador único de cada reserva en cada plataforma de origen. Este mecanismo es el que previene los duplicados: si una reserva ya existe en la base de datos con el mismo ID de Airbnb, no se vuelve a crear. Esto garantiza que el calendario de Neural CRM sea siempre la fuente de verdad única de disponibilidad, combinando en una sola cuadrícula mensual las reservas de Airbnb, Booking.com y las reservas directas gestionadas por la agencia."),
          infoBox("✅ Resultado:", "Eliminación completa del riesgo de dobles reservas. El agente puede responder instantáneamente a cualquier consulta de disponibilidad por teléfono, WhatsApp o email, viendo en tiempo real el calendario unificado de la villa sin tener que abrir Airbnb y Booking por separado.", C.navy),

          // ── 4.3 LARGA DURACION ──────────────────────────────
          heading2("4.3 Módulo de Alquiler de Larga Duración"),
          para("Muchas villas de lujo en Ibiza se alquilan en temporada vacacional (junio a septiembre) y en los meses de invierno —octubre a mayo— sus propietarios prefieren tenerlas ocupadas con un arrendatario de larga duración que cubra los gastos de mantenimiento. Neural CRM gestiona este modelo dual de forma nativa sin ninguna duplicación de datos."),
          heading3("Gestión del Contrato y el Inquilino"),
          bullet("Ficha completa del inquilino con todos sus datos de contacto y documentación: nombre, NIF/NIE (almacenado cifrado con AES-256-GCM), IBAN bancario (también cifrado), personas en el contrato."),
          bullet("Configuración detallada del arrendamiento: renta mensual acordada, número de meses de fianza retenida, día límite de pago de la renta, fecha de inicio y fecha de vencimiento del contrato."),
          bullet("Historial completo de pagos: La tabla PagoRenta registra cada pago mensual con fecha de cobro, importe y estado (pagado/pendiente/retraso). El back office puede marcar los pagos como recibidos directamente desde el CRM."),
          bullet("Alertas automáticas de vencimiento: El sistema envía notificaciones internas 90 días y 30 días antes del fin del contrato, para que la agencia tenga tiempo suficiente para gestionar la renovación o buscar un nuevo inquilino."),
          bullet("Generación de contratos LAU: El Agente IA Legal puede redactar automáticamente borradores de contratos de arrendamiento conforme a la Ley de Arrendamientos Urbanos española."),

          // ── 4.4 VENTA KANBAN ─────────────────────────────────
          heading2("4.4 Pipeline de Venta — Kanban de Compraventa"),
          para("El módulo de venta de Neural CRM proporciona un pipeline visual en formato Kanban para el seguimiento completo del proceso de compraventa inmobiliaria, desde el primer contacto del propietario para captar el inmueble hasta la firma de la escritura en notaría."),
          heading3("Las 7 Etapas del Pipeline"),
          numbered("CAPTACIÓN: La propiedad ha sido incorporada al inventario. El propietario ha firmado el mandato de venta. Se han completado la ficha, las fotos y la descripción."),
          numbered("VALORACIÓN: Se ha realizado el análisis comparativo de mercado (ACM). Se han acordado el precio de salida público y el precio mínimo de aceptación confidencial con el propietario."),
          numbered("VISITAS: La propiedad está activa en portales y se están gestionando solicitudes de visita. La agenda de visitas está activa."),
          numbered("NEGOCIACIÓN: Un comprador cualificado ha presentado una oferta. Se está negociando precio y condiciones entre comprador y vendedor a través de la agencia."),
          numbered("ARRAS: La oferta ha sido aceptada. Se ha firmado el contrato de arras (precontrato). El comprador ha depositado las arras como señal de compromiso de compra."),
          numbered("HIPOTECA / FINANCIACIÓN: El comprador está procesando la financiación hipotecaria con su entidad bancaria. Se han solicitado las notas simples y la documentación registral."),
          numbered("ESCRITURA: ¡La venta está cerrada! Se ha firmado la escritura de compraventa ante notario. La comisión ha sido cobrada. Operación completada."),
          heading3("Campos Confidenciales y Gestión de Comisiones"),
          bullet("Precio de venta público: El precio que aparece en los anuncios de Idealista, Kyero y JamesEdition, visible para todos los usuarios del CRM."),
          bullet("Precio mínimo confidencial: El precio real mínimo por debajo del cual el propietario no vende. Solo visible para usuarios con rol DIRECTOR o SUPERADMIN, invisible para los agentes. Esto protege la estrategia de negociación."),
          bullet("Comisión de agencia en %: Porcentaje pactado con el propietario. Neural CRM calcula automáticamente el beneficio bruto de la agencia en cada operación."),
          bullet("Referencia catastral: Campo específico para el código catastral español del inmueble, necesario para la escritura y los trámites registrales."),

          // ── 4.5 AGENTES IA ───────────────────────────────────
          heading2("4.5 Escuadrón de Agentes Autónomos de IA — Los 5 Bots"),
          para("Uno de los diferenciadores más potentes de Neural CRM es su escuadrón de agentes autónomos de inteligencia artificial. Estos no son chatbots simples de respuestas predefinidas; son sistemas de IA contextual que acceden al inventario real del CRM, al historial de cada cliente y a las instrucciones personalizadas de la agencia para actuar de forma inteligente y autónoma."),
          ...spacer(1),
          heading3("Agente 1 — AI Inbound: El Asistente de Ventas por WhatsApp"),
          para("El Agente Inbound es el primer punto de contacto digital de la agencia. Está conectado directamente al webhook oficial de WhatsApp Business Meta API y responde automáticamente a los mensajes entrantes de clientes potenciales en tiempo real, las 24 horas del día, los 7 días de la semana."),
          para("Cuando un potencial cliente escribe al WhatsApp de la agencia —por ejemplo, 'Hola, busco una villa con piscina para 8 personas en julio, máximo 15.000 euros por semana'— el Agente Inbound entra en acción:"),
          numbered("Analiza el texto en lenguaje natural para extraer los criterios de búsqueda: tipo de propiedad, número de huéspedes, presupuesto, fechas, zona."),
          numbered("Consulta el inventario del CRM en tiempo real aplicando los filtros extraídos."),
          numbered("Selecciona las 2–3 propiedades más relevantes y prepara una respuesta personalizada con fotos, precios y características."),
          numbered("Envía la respuesta por WhatsApp con los enlaces a las fichas completas de las propiedades."),
          numbered("Si el cliente responde con interés, el agente continúa la conversación, responde preguntas adicionales y, cuando detecta una intención de reserva o compra clara, crea automáticamente una ficha de lead en el CRM con todos los datos del cliente y la conversación completa, y asigna el lead al agente humano más adecuado."),
          para("El resultado es que ningún lead que contacte por WhatsApp fuera del horario de oficina queda sin respuesta. La agencia responde en segundos a cualquier hora, ofreciendo una experiencia de cliente premium que refuerza el posicionamiento de lujo."),
          ...spacer(1),
          heading3("Agente 2 — AI Outbound: El Generador de Guiones Comerciales"),
          para("El Agente Outbound es un asistente de preparación de llamadas para los agentes humanos. Antes de hacer una llamada comercial a un lead, el agente puede abrir la ficha del cliente en Neural CRM y solicitar al bot que genere un guión comercial personalizado."),
          para("El guión generado por la IA incluye: un resumen del perfil del lead (presupuesto, intereses, historial de interacciones previas, propiedades que ha visitado), un análisis de su estado en el pipeline y las objeciones más probables según el contexto, tres propiedades del inventario actual que mejor se ajustan a su perfil con argumentos específicos de venta para cada una, preguntas abiertas para descubrir más información sobre sus necesidades y timeline, y manejo de las objeciones más frecuentes en el segmento de lujo."),
          ...spacer(1),
          heading3("Agente 3 — AI Captador: El Scout de Propiedades"),
          para("El Agente Captador es un rastreador en background que opera de forma continua buscando en los portales inmobiliarios públicos —Idealista, Fotocasa, Milanuncios— anuncios publicados directamente por propietarios particulares (sin agencia), que podrían estar interesados en los servicios de gestión de la agencia."),
          para("Cuando detecta una propiedad que cumple los criterios de interés (zona geográfica, tipo de propiedad, rango de precio), extrae la información de contacto disponible del anuncio y genera una alerta en el CRM dirigida al director de captación. La alerta incluye un análisis del potencial de la propiedad y un borrador de mensaje de contacto personalizado para el propietario."),
          ...spacer(1),
          heading3("Agente 4 — AI Setter: El Agente de Citas"),
          para("El Agente Setter gestiona automáticamente la agenda de visitas y citas de la agencia. Se sincroniza con los calendarios de disponibilidad de los agentes y, cuando un lead solicita visitar una propiedad, el bot propone automáticamente tres opciones de fecha y hora que respetan la disponibilidad del agente responsable."),
          para("Una vez confirmada la cita, el Agente Setter la registra en el CRM y configura dos recordatorios automáticos por WhatsApp: uno 24 horas antes de la visita, con los detalles de la cita y un mapa de ubicación de la propiedad; y otro 2 horas antes, con el nombre del agente que les recibirá y su número de teléfono directo."),
          ...spacer(1),
          heading3("Agente 5 — AI Closer Legal: El Asistente Jurídico"),
          para("El Agente Legal es posiblemente la herramienta más sofisticada del escuadrón. Tiene dos funciones principales:"),
          para("Función 1 — Análisis de contratos: El agente puede subir cualquier contrato en PDF (contrato de alquiler, contrato de arras, mandato de gestión) al sistema, y el bot lo analiza punto por punto frente a la Ley de Arrendamientos Urbanos (LAU 29/1994 y sus modificaciones posteriores). Genera un informe de revisión que identifica: cláusulas que podrían ser nulas por ser contrarias a la ley, ausencias de cláusulas obligatorias según la LAU, desequilibrios que favorecen excesivamente a una de las partes, y recomendaciones concretas de modificación."),
          para("Función 2 — Generación de contratos: A partir de los datos de la propiedad, el inquilino y las condiciones acordadas ya almacenados en el CRM, el bot puede generar un borrador completo de contrato de alquiler de temporada o de larga duración, un contrato de arras para compraventa, y un mandato de gestión de alquiler vacacional. Todos los borradores generados son revisables por el equipo de la agencia y deben ser validados por un abogado antes de su firma."),

          // ── 4.6 PORTALES ─────────────────────────────────────
          heading2("4.6 Distribución Multicanal — Feeds de Portales Inmobiliarios"),
          para("Neural CRM implementa un sistema completo de sindicación de propiedades hacia los portales inmobiliarios más relevantes del mercado español e internacional, generando feeds dinámicos en los formatos específicos que requiere cada portal."),
          heading3("Portales Soportados"),
          bullet("Idealista XML: El portal líder del mercado inmobiliario español con más de 1.500 millones de visitas mensuales. Neural CRM genera el feed XML en el formato propietario de Idealista, con todos los atributos requeridos mapeados automáticamente desde la ficha de la propiedad."),
          bullet("Fotocasa XML: El segundo portal inmobiliario de España (Grupo Adevinta). Neural CRM soporta su especificación XML con los campos de superficie, estado, características y galería de imágenes en el formato requerido."),
          bullet("Kyero XML: El portal líder del mercado inmobiliario internacional en España, especialmente utilizado por compradores e inversores británicos, irlandeses y del norte de Europa. Neural CRM genera el feed Kyero con soporte para campos de geolocalización precisa y contenido multilingüe."),
          bullet("JamesEdition JSON: El portal internacional de ultra-lujo, referente mundial para propiedades de más de €1M, utilizado por compradores de alto patrimonio de todo el mundo. Neural CRM genera el feed JSON específico de JamesEdition con geolocalización de alta precisión, galería de imágenes en alta resolución y atributos de lujo detallados."),
          heading3("Funcionamiento del Sistema de Publicación"),
          para("El proceso de publicación en Neural CRM está diseñado para ser lo más simple posible para el agente: cuando una propiedad está lista para salir al mercado, el agente hace clic en el botón 'Publicar' en la ficha de la propiedad y selecciona los portales de destino. Neural CRM encola una tarea asíncrona que procesa la publicación en background, notificando al agente cuando se completa."),
          para("El sistema genera automáticamente los feeds XML/JSON dinámicos que los portales consumirán periódicamente. Cada feed es un endpoint protegido por un token secreto (para evitar el acceso no autorizado) que expone las propiedades activas de la agencia en el formato exacto que requiere cada portal."),

          // ── 4.7 PORTAL PROPIETARIO ─────────────────────────────
          heading2("4.7 Portal del Propietario — Transparencia y Fidelización"),
          para("El Portal del Propietario es una herramienta de acceso restringido y personalizado que Neural CRM proporciona a los propietarios de las villas gestionadas por la agencia. Su objetivo es doble: por un lado, ofrecer transparencia total sobre la gestión del activo; por otro, posicionarse como una herramienta de fidelización que diferencia a la agencia de sus competidores y reduce la probabilidad de que el propietario cambie de gestor."),
          heading3("Acceso y Seguridad"),
          para("El acceso al Portal del Propietario se realiza mediante un enlace tokenizado único generado por la agencia para cada propietario. No requiere que el propietario cree una cuenta ni recuerde una contraseña. El token de acceso tiene una fecha de caducidad configurable y puede ser revocado por la agencia en cualquier momento."),
          heading3("Información Disponible en el Portal"),
          bullet("Dashboard de rendimiento vacacional: Ingresos totales generados en el período seleccionado, número de noches ocupadas vs. disponibles, tasa de ocupación en %, comparativa con el mismo período del año anterior."),
          bullet("Calendario de reservas en tiempo real: Vista mensual del calendario de la villa con las reservas activas (Airbnb, Booking, directas) claramente identificadas por canal de origen."),
          bullet("Estado del pipeline de venta: Si la villa está a la venta, el propietario puede ver en qué etapa del Kanban se encuentra su propiedad, cuántas visitas se han realizado, y si hay alguna oferta en negociación (sin revelar el importe confidencial mínimo)."),
          bullet("Historial de facturas y liquidaciones: Registro de los informes de rendimiento mensuales y las liquidaciones de ingresos de alquiler."),
          heading3("Personalización Marca Blanca"),
          para("En el plan ELITE, el Portal del Propietario puede personalizarse completamente con el logo, el color corporativo y el nombre comercial de la agencia. El propietario accede a un portal que visualmente parece ser exclusivo de esa agencia, reforzando el brand de la misma."),

          // ── 4.8 CRM LEADS ─────────────────────────────────────
          heading2("4.8 CRM de Leads y Gestión de Clientes"),
          para("El módulo de CRM es el núcleo de la gestión comercial de Neural CRM. Centraliza toda la información de clientes potenciales y compradores en un único sistema, con herramientas de seguimiento, cualificación y comunicación integradas."),
          heading3("Ficha del Lead"),
          bullet("Datos de contacto completos: nombre, teléfono, email, idioma preferido, nacionalidad."),
          bullet("Perfil de búsqueda: tipo de propiedad buscada, zonas de interés, presupuesto máximo, número de habitaciones mínimo, características específicas requeridas (piscina, vistas al mar, etc.)."),
          bullet("Score IA (0–100): Puntuación automática de calificación del lead basada en el análisis del historial de interacciones, el nivel de concreción de sus criterios de búsqueda y su comportamiento en el pipeline."),
          bullet("Estado en el pipeline: NUEVO → CONTACTADO → VISITA PROGRAMADA → VISITA REALIZADA → OFERTA → RESERVADO → CERRADO."),
          bullet("Historial completo de actividades: registro cronológico de todas las interacciones con el lead: llamadas, visitas, mensajes de WhatsApp, emails, propiedades mostradas."),
          bullet("Propiedades asignadas: lista de propiedades del inventario que se han presentado al lead como opciones."),

          // ── 4.9 WHATSAPP ─────────────────────────────────────
          heading2("4.9 WhatsApp Meta API — Comunicación Integrada y Trazable"),
          para("La integración de WhatsApp Business Meta API es uno de los pilares de diferenciación de Neural CRM. A diferencia de la mayoría de los CRMs del sector que, si tienen integración de WhatsApp, utilizan APIs no oficiales (que violan los Términos de Servicio de Meta y pueden ser bloqueadas en cualquier momento), Neural CRM utiliza exclusivamente la API oficial de WhatsApp Business Cloud, proporcionada directamente por Meta."),
          heading3("Qué Permite la Integración"),
          bullet("Recepción de mensajes entrantes directamente en el CRM: Cuando un cliente envía un mensaje al número de WhatsApp Business de la agencia, el mensaje aparece inmediatamente en la ficha del cliente dentro de Neural CRM."),
          bullet("Envío de mensajes desde el CRM: Los agentes pueden responder a los mensajes de los clientes directamente desde la interfaz del CRM, sin necesidad de abrir WhatsApp en el teléfono. La respuesta llega al cliente como un mensaje de WhatsApp normal."),
          bullet("Historial completo y persistente: Todas las conversaciones quedan almacenadas en la tabla MensajeWhatsApp de la base de datos, vinculadas a la ficha del cliente. El historial es accesible para cualquier miembro del equipo con los permisos adecuados."),
          bullet("Envío de mensajes enriquecidos: Neural CRM puede enviar mensajes de WhatsApp con imágenes de propiedades, documentos PDF y botones de acción (por ejemplo, 'Confirmar cita', 'Ver disponibilidad', 'Solicitar información')."),
          bullet("Plantillas de mensajes aprobadas por Meta: Para iniciar conversaciones proactivas (por ejemplo, enviar un mensaje a un lead que contactó hace 3 días sin haber recibido respuesta), el sistema utiliza plantillas de mensajes pre-aprobadas por Meta, que cumplen con todos los requisitos regulatorios de la plataforma."),

          // ── 4.10 CALENDARIO ────────────────────────────────────
          heading2("4.10 Calendario, Agenda y Gestión de Visitas"),
          para("Neural CRM incluye un módulo de agenda y calendario unificado que centraliza todas las actividades de los agentes: visitas a propiedades, reuniones con clientes, llamadas programadas, y sincronización con los calendarios de reservas vacacionales."),
          bullet("Vista mensual unificada: El director puede ver en un solo calendario todos los eventos de todos los agentes del equipo, diferenciados por código de color por agente."),
          bullet("Gestión de visitas: Cada visita queda registrada con la propiedad a visitar, el lead que visita, el agente responsable, la fecha y hora, y un campo de notas para el feedback post-visita."),
          bullet("Integración con Google Calendar: Las citas creadas en Neural CRM se sincronizan con el Google Calendar del agente asignado."),
          bullet("Recordatorios automáticos: El Agente Setter envía recordatorios automáticos por WhatsApp al cliente 24h y 2h antes de cada visita."),

          // ── 4.11 FACTURACION ────────────────────────────────────
          heading2("4.11 Facturación y Control de Pagos"),
          para("El módulo de facturación de Neural CRM permite gestionar los flujos económicos de las tres modalidades de negocio desde un único panel."),
          bullet("Control de cobros de alquiler vacacional: Registro de los ingresos por cada reserva, desglose de la comisión de gestión de la agencia y la liquidación al propietario."),
          bullet("Seguimiento de pagos de larga duración: La tabla PagoRenta permite marcar cada mensualidad como pagada o pendiente, con alerta automática para pagos que superan el día límite."),
          bullet("Registro de comisiones de venta: Al cerrar una operación de compraventa en la etapa ESCRITURA, Neural CRM calcula automáticamente la comisión de la agencia basándose en el precio final de venta y el porcentaje pactado."),
          bullet("Integración con Google Sheets: Los datos de facturación se sincronizan con hojas de cálculo de Google Sheets del cliente para facilitar la consolidación contable."),

          // ── 4.12 DRIVE Y SHEETS ────────────────────────────────
          heading2("4.12 Google Drive y Google Sheets — Sincronización en la Nube"),
          para("Neural CRM se integra con el ecosistema de Google Workspace para sincronizar automáticamente los documentos y datos de la agencia con sus sistemas de almacenamiento en la nube habituales."),
          bullet("Google Drive Sync: Cada dossier PDF cargado en el CRM se sincroniza automáticamente con la carpeta del propietario correspondiente en el Google Drive del cliente, manteniendo una copia de seguridad organizada en la nube."),
          bullet("Google Sheets de vacacional: Los datos de reservas, disponibilidad e ingresos del módulo de alquiler vacacional se sincronizan automáticamente con una hoja de cálculo de Google Sheets designada, facilitando la generación de informes y la visión contable sin exportaciones manuales."),
          bullet("Sincronización en background: Todos los procesos de sincronización con Google se ejecutan de forma asíncrona en background, sin interrumpir el flujo de trabajo del agente."),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 05 — BENEFICIOS POR PERFIL
// ═══════════════════════════════════════════════════════════════
          sectionTitle("05", "BENEFICIOS POR PERFIL DE USUARIO"),
          heading2("5.1 Para el Director de Agencia"),
          para("El director de la agencia es el beneficiario más estratégico de Neural CRM. La plataforma le proporciona una visibilidad completa y en tiempo real de toda la operativa de su negocio que con las herramientas actuales del mercado simplemente no existe."),
          bullet("Dashboard ejecutivo con KPIs en tiempo real: Número total de propiedades por estado (disponible, reservado, vendido, mantenimiento), ingresos acumulados de alquiler vacacional del mes, número de leads activos en el pipeline por etapa, comisiones pendientes de cobro por ventas en etapa ESCRITURA."),
          bullet("Supervisión completa de la comunicación: El director puede revisar todas las conversaciones de WhatsApp de cualquier agente, directamente desde el CRM. Esto permite hacer coaching basado en conversaciones reales, detectar leads mal gestionados antes de que se pierdan, y garantizar que el estilo de comunicación de la agencia es consistente y profesional."),
          bullet("Control de acceso a información confidencial: Solo el director puede ver el precio mínimo de aceptación de cada propiedad, garantizando que esta información crítica para la negociación no se filtra a los agentes ni, a través de ellos, a los compradores."),
          bullet("Gestión de rendimiento del equipo: Estadísticas por agente de número de leads gestionados, visitas realizadas, propiedades cargadas y operaciones cerradas. Base objetiva para evaluaciones de rendimiento."),
          bullet("Visión holística del inventario híbrido: Por primera vez, el director puede ver en un solo panel cuáles de sus villas están en vacacional activo, cuáles están a la venta, cuáles tienen arrendatarios de larga duración, y cuáles están en proceso de transición entre modalidades."),
          ...spacer(1),
          heading2("5.2 Para el Agente Comercial"),
          para("Los agentes comerciales son los usuarios más activos de Neural CRM en el día a día. Para ellos, la plataforma supone una reducción drástica del trabajo administrativo y un incremento equivalente del tiempo disponible para actividades de alto valor comercial."),
          bullet("Eliminación del trabajo de alta de propiedades: En lugar de 90 minutos rellenando formularios y recortando imágenes, el agente carga el PDF y en 3 minutos tiene la ficha completa lista. Puede dedicar ese tiempo ahorrado a atender a 2 clientes adicionales."),
          bullet("Contexto completo de cada lead antes de cada interacción: Antes de hacer una llamada, el agente abre la ficha del lead y tiene en un solo vistazo: todas las conversaciones previas de WhatsApp, las propiedades que ha visitado y su feedback, el presupuesto, las preferencias, y la puntuación IA. Nunca más empieza una conversación comercial desde cero."),
          bullet("Guiones comerciales personalizados con un clic: El Agente Outbound genera un guión específico para cada lead en segundos, con las mejores propiedades del inventario actual para ese perfil y las respuestas a las objeciones más probables."),
          bullet("Respuesta inmediata a leads fuera de horario: El Agente Inbound gestiona automáticamente los WhatsApps que llegan durante el fin de semana o a las 11 de la noche. Cuando el agente llega a la oficina el lunes, encuentra los leads ya cualificados y con toda la información recogida."),
          ...spacer(1),
          heading2("5.3 Para el Responsable de Back Office"),
          para("El back office de una agencia inmobiliaria de lujo gestiona una carga administrativa significativa: facturas, pagos de renta, contratos, documentación legal. Neural CRM les permite trabajar con mayor eficiencia y menor riesgo de error."),
          bullet("Control centralizado de cobros: La tabla de PagoRenta muestra de un vistazo qué inquilinos han pagado la renta del mes y cuáles están en retraso, con la cantidad exacta y la fecha de cobro esperada."),
          bullet("Generación automática de borradores de contratos: El Agente Legal genera borradores completos de contratos de arrendamiento y contratos de arras en minutos, reduciendo drásticamente el tiempo de preparación documental."),
          bullet("Audit Log para cumplimiento y control: El registro de auditoría inmutable permite rastrear exactamente quién accedió a qué información y cuándo, facilitando las auditorías de cumplimiento del RGPD."),
          bullet("Cifrado de datos sensibles sin gestión adicional: Los campos críticos (NIFs, IBANs) se cifran automáticamente antes de ser almacenados. El back office trabaja con los datos descifrados de forma transparente, sin necesidad de gestionar claves o procesos adicionales."),
          ...spacer(1),
          heading2("5.4 Para el Propietario del Inmueble"),
          para("Aunque el propietario no es un usuario interno del CRM sino un usuario externo del Portal del Propietario, es uno de los stakeholders más importantes cuya satisfacción determina la retención del negocio en la agencia."),
          bullet("Transparencia que genera confianza: El propietario puede ver en tiempo real el rendimiento de su villa sin tener que llamar a la agencia para pedir un informe. Esta transparencia es el fundamento de una relación de confianza duradera."),
          bullet("Disponibilidad 24/7: El portal es accesible en cualquier momento desde cualquier dispositivo. El propietario en Alemania puede revisar el estado de su villa en Ibiza a las 10 de la noche desde el sofá de su casa."),
          bullet("Información sobre ofertas de compra: Si la villa está a la venta, el propietario puede ver si hay ofertas activas en negociación (sin ver el importe confidencial mínimo) y en qué etapa del proceso se encuentran."),
          bullet("Reducción de llamadas al equipo: Con el portal disponible, el propietario encuentra la información que necesita por sí mismo, liberando al equipo de la agencia de decenas de llamadas informativas de bajo valor cada mes."),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 06 — ARQUITECTURA TÉCNICA
// ═══════════════════════════════════════════════════════════════
          sectionTitle("06", "ARQUITECTURA TÉCNICA Y SEGURIDAD"),
          heading2("6.1 Stack Tecnológico"),
          twoColTable(
            [
              heading3("Frontend"),
              bullet("React 18 — Framework UI con Concurrent Mode"),
              bullet("Vite 5 — Build tool ultrarrápido con HMR"),
              bullet("CSS Variables — Design System Mediterranean Luxury"),
              bullet("React Router v6 — Enrutamiento declarativo"),
              bullet("Axios — HTTP client con interceptores JWT"),
              bullet("Google OAuth 2.0 SDK — SSO corporativo"),
              bullet("FullCalendar — Calendario de reservas y agenda"),
              heading3("Backend"),
              bullet("Node.js 20 LTS — Runtime de alto rendimiento"),
              bullet("Express.js 4 — Framework web minimalista y extensible"),
              bullet("Prisma ORM 5 — ORM type-safe con migraciones"),
              bullet("Helmet.js — Headers de seguridad HTTP"),
              bullet("express-rate-limit — Anti-DoS / Anti-scraping"),
              bullet("Winston — Logger estructurado con rotación"),
              bullet("bcrypt + JWT — Auth y hashing de contraseñas"),
              bullet("pdf-parse — Extracción de texto plano de PDFs"),
              bullet("Tesseract.js — OCR para PDFs escaneados"),
              bullet("node-cron — Tareas periódicas en background"),
            ],
            [
              heading3("Base de Datos"),
              bullet("PostgreSQL 16 — BD relacional robusta y escalable"),
              bullet("Supabase — Backend-as-a-Service (PostgreSQL cloud)"),
              bullet("SQLite — Fallback para entornos de desarrollo local"),
              bullet("AES-256-GCM — Cifrado de campos sensibles (Prisma middleware)"),
              bullet("Soft Delete — Borrado lógico, nunca físico"),
              heading3("Inteligencia Artificial y Cloud"),
              bullet("OpenAI GPT-4o — Modelo de lenguaje de última generación"),
              bullet("GPT-4o Vision API — Análisis visual de imágenes"),
              bullet("Supabase Storage CDN — Almacenamiento y CDN global"),
              bullet("Google Drive API v3 — Almacenamiento de documentos"),
              bullet("Google Sheets API v4 — Sincronización de datos"),
              bullet("Meta WhatsApp Cloud API — Mensajería oficial"),
              bullet("Docker + docker-compose — Containerización y despliegue"),
              bullet("iCal / .ics Protocol — Channel Manager"),
            ]
          ),
          ...spacer(1),
          heading2("6.2 Seguridad y Cumplimiento RGPD"),
          heading3("Cifrado AES-256-GCM en Reposo"),
          para("Los campos que contienen datos personales sensibles de propietarios e inquilinos —específicamente el número de identificación fiscal (NIF/NIE) y el número de cuenta bancaria internacional (IBAN)— se cifran automáticamente mediante el algoritmo de cifrado simétrico AES-256-GCM antes de ser escritos en la base de datos PostgreSQL. El cifrado se implementa como un middleware transparente de Prisma ORM, lo que significa que el equipo de desarrollo y los usuarios de la aplicación trabajan siempre con los datos en texto plano; el cifrado y descifrado ocurren de forma completamente automática e invisible."),
          heading3("Control de Acceso Basado en Roles — RBAC de 5 Niveles"),
          para("Neural CRM implementa un sistema de Control de Acceso Basado en Roles (RBAC) con cinco niveles de privilegio progresivo:"),
          bullet("SUPERADMIN: Acceso total al sistema. Gestión de agencias, usuarios y configuración de la plataforma SaaS. Rol reservado para el equipo técnico de Neural CRM."),
          bullet("DIRECTOR: Acceso completo a la agencia, incluyendo precios mínimos confidenciales, informes de rendimiento completos, y gestión de todos los usuarios de la agencia."),
          bullet("AGENTE SENIOR: Acceso completo a propiedades, clientes y operaciones. No puede ver precios mínimos confidenciales ni gestionar usuarios."),
          bullet("AGENTE: Acceso de lectura/escritura a propiedades y leads asignados. No puede acceder a información confidencial de otras operaciones."),
          bullet("BACKOFFICE: Acceso a facturación, pagos y contratos. Sin acceso a información comercial de las operaciones."),
          heading3("Registro de Auditoría Inmutable"),
          para("Cada acción significativa en el sistema —lectura de un precio mínimo confidencial, descarga de un contrato, modificación de datos de propietario, cambio de estado de una propiedad— genera un registro inmutable en la tabla AuditLog con los siguientes campos: timestamp exacto, identificador del usuario que realizó la acción, dirección IP del usuario, tipo de acción, identificador de la entidad afectada y valor anterior/nuevo cuando aplica."),
          heading3("Rate Limiting y Protección Anti-DoS"),
          para("Todos los endpoints del backend están protegidos por un límite de 500 peticiones por dirección IP por cada ventana de 15 minutos, implementado mediante el middleware express-rate-limit. Este límite protege la plataforma contra ataques de denegación de servicio (DoS), intentos de fuerza bruta de credenciales y comportamientos de scraping automatizado."),
          heading3("Autenticación JWT con Refresh Token Rotativo"),
          para("El sistema de autenticación utiliza un par de tokens: un Access Token de corta duración (1 hora) que se incluye en el header Authorization de cada petición, y un Refresh Token de larga duración (30 días) almacenado en una cookie HttpOnly segura con el flag SameSite=Strict. El frontend utiliza interceptores Axios para detectar automáticamente cuando el Access Token ha expirado y solicitar uno nuevo usando el Refresh Token, sin interrumpir la sesión del usuario."),

          // ── 6.3 API ────────────────────────────────────────────
          heading2("6.3 Catálogo de Endpoints REST — Principales"),
          twoColTable(
            [
              para("AUTENTICACIÓN", { bold: true, color: C.gold }),
              bullet("POST /api/auth/google — Google OAuth 2.0 SSO"),
              bullet("POST /api/auth/dev-login — Login desarrollo"),
              bullet("POST /api/auth/refresh — Renovar JWT"),
              para("PROPIEDADES", { bold: true, color: C.gold }),
              bullet("GET /api/propiedades — Listado paginado con filtros"),
              bullet("POST /api/propiedades — Crear nuevo inmueble"),
              bullet("GET /api/propiedades/:id — Ficha completa"),
              bullet("PUT /api/propiedades/:id — Actualizar propiedad"),
              bullet("DELETE /api/propiedades/:id — Soft delete"),
              para("IA DOCUMENTAL", { bold: true, color: C.gold }),
              bullet("POST /api/documentos/upload — PDF→Drive→GPT-4o"),
              bullet("GET /api/documentos/propiedad/:id — Historial docs"),
              para("DASHBOARD", { bold: true, color: C.gold }),
              bullet("GET /api/dashboard — KPIs globales de la agencia"),
            ],
            [
              para("CLIENTES Y LEADS", { bold: true, color: C.gold }),
              bullet("GET /api/clientes — Pipeline de leads"),
              bullet("POST /api/clientes — Crear nuevo lead"),
              bullet("PUT /api/clientes/:id — Actualizar estado"),
              para("PORTALES Y FEEDS", { bold: true, color: C.gold }),
              bullet("POST /api/portales/publicar — Publicar en portales"),
              bullet("GET /api/portales/feed?portal=idealista — Feed XML"),
              bullet("POST /api/portales/despublicar — Retirar anuncio"),
              para("RESERVAS Y PAGOS", { bold: true, color: C.gold }),
              bullet("GET /api/reservas — Reservas vacacionales activas"),
              bullet("POST /api/reservas — Nueva reserva directa"),
              bullet("GET /api/pagos — Control de pagos de renta"),
              bullet("PUT /api/pagos/:id — Marcar pago recibido"),
              para("SISTEMA", { bold: true, color: C.gold }),
              bullet("GET /api/portales/config — Config de portales"),
              bullet("POST /api/ical/sync — Sincronizar iCal manual"),
              bullet("GET /health — Health check del servidor"),
            ]
          ),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 07 — ESTUDIO DE MERCADO
// ═══════════════════════════════════════════════════════════════
          sectionTitle("07", "ESTUDIO DE MERCADO"),
          heading2("7.1 Tamaño y Oportunidad del Mercado"),
          para("El mercado de software de gestión inmobiliaria en España se encuentra en plena transformación digital, acelerada por la proliferación de plataformas de alquiler vacacional y la creciente presión regulatoria sobre el sector. Según datos de la Asociación Española de Proptech (2025), el gasto en software de gestión inmobiliaria en España supera los €420 millones anuales, con una tasa de crecimiento compuesto anual (CAGR) del 14,3%."),
          para("El segmento específico en el que opera Neural CRM —agencias boutique en destinos turísticos de lujo— es un nicho de alto valor que representa aproximadamente el 8–12% del total de agencias inmobiliarias españolas pero genera un volumen de facturación desproporcionadamente alto, estimado en €2.800–3.500 millones anuales en comisiones de ventas y honorarios de gestión vacacional."),
          ...spacer(1),
          kpiRow([
            { val: "€420M", label: "Mercado total software\ngestion inmobiliaria ES" },
            { val: "14,3%", label: "CAGR del sector\nPropTech España" },
            { val: "+3.200", label: "Agencias boutique\nen destinos de lujo" },
            { val: "€499", label: "Ticket mensual medio\nplan ELITE" },
            { val: "€19M", label: "Mercado potencial\naddressable directo" },
          ]),
          ...spacer(1),
          heading2("7.2 Segmento Objetivo — Ideal Customer Profile (ICP)"),
          para("Neural CRM no compite por volumen de clientes; compite por calidad y valor del cliente. El perfil ideal del cliente de Neural CRM es muy específico:"),
          bullet("Tipo de empresa: Agencia inmobiliaria boutique o gestora de propiedades de lujo, con entre 2 y 20 agentes activos."),
          bullet("Volumen de propiedades gestionadas: Entre 15 y 300 propiedades en inventario activo. Por debajo de 15, el coste del software no se justifica con los ahorros generados. Por encima de 300, las necesidades de personalización e integración superan lo que un SaaS estándar puede ofrecer eficientemente."),
          bullet("Modelo de negocio: Gestión simultanea o alternante de alquiler vacacional y venta, o gestión de larga duración con cartera de ventas. Las agencias que operan en un solo modelo están mejor servidas por los líderes especializados en cada nicho (Avantio para vacacional puro, Inmovilla para venta pura)."),
          bullet("Ubicación geográfica: Destinos turísticos de alto standing donde la mayoría de propietarios y compradores son internacionales. Mercados principales: Ibiza (mercado de referencia), Mallorca, Menorca, Marbella, Estepona, Benahavís, Costa Brava, Sitges. Mercados secundarios potenciales: Portugal (Algarve, Lisboa), Sur de Francia (Côte d'Azur)."),
          bullet("Perfil del cliente de la agencia: Las agencias objetivo tienen clientes con presupuestos de compra superiores a €500.000 o presupuestos de alquiler vacacional superiores a €5.000/semana. Este perfil de cliente tolera y exige herramientas premium."),
          bullet("Actitud tecnológica: Agencias con director abierto a la innovación tecnológica, posiblemente ya frustrado con las limitaciones de los CRMs existentes. No son adopters tardíos tecnológicamente."),
          ...spacer(1),
          heading2("7.3 Análisis Geográfico del Mercado Prioritario"),
          heading3("Ibiza — El Mercado de Referencia"),
          para("Ibiza es el mercado de validación natural de Neural CRM por sus características únicas. La isla recibe cada año más de 3,5 millones de turistas, de los cuales aproximadamente el 72% son internacionales. El precio medio de una villa de lujo para alquiler vacacional en temporada alta oscila entre €8.000 y €60.000 por semana. El precio medio de compraventa de villas de lujo supera los €2,5 millones."),
          para("Existen en Ibiza aproximadamente 180–220 agencias inmobiliarias activas con licencias API (Agente de la Propiedad Inmobiliaria), de las cuales unas 40–60 tienen el perfil boutique que corresponde al cliente ideal de Neural CRM. Con un ticket medio de €249/mes (plan PRO), el mercado potencial addressable solo en Ibiza asciende a €100.000–150.000 anuales de MRR."),
          heading3("Mallorca — El Mercado de Expansión Inmediata"),
          para("Mallorca tiene un mercado inmobiliario de lujo significativamente mayor que Ibiza, con más de 350 agencias activas y un precio medio de villa de lujo que supera los €3,5 millones. La demanda internacional es aún mayor, con una fuerte presencia de compradores alemanes y del norte de Europa. La complejidad del mercado mallorquín es mayor (más agencias, mayor competencia entre ellas), lo que convierte la eficiencia operativa en un factor de diferenciación crítico."),
          heading3("Marbella y Costa del Sol — El Mercado Continental"),
          para("La Costa del Sol presenta el mayor mercado de lujo inmobiliario de España, con Marbella como epicentro. El precio medio de villa en La Zagaleta, Sierra Blanca o El Madroñal supera los €4 millones. El mercado está muy maduro en términos de CRM (Optima-CRM tiene aquí su principal cuota de mercado), lo que representa un mercado de conquista con una propuesta de valor claramente diferenciada en IA y modelo híbrido."),
          ...spacer(1),
          heading2("7.4 Tendencias del Sector que Favorecen a Neural CRM"),
          bullet("Crecimiento del alquiler vacacional de lujo post-COVID: El segmento de alquiler vacacional de lujo ha crecido un 38% desde 2021. Las agencias inmobiliarias tradicionales que no gestionaban alquileres vacacionales han entrado en este segmento para diversificar ingresos, generando exactamente la necesidad del módulo híbrido de Neural CRM."),
          bullet("Regulación creciente del alquiler turístico: La Ley Balear de Turismo y las regulaciones municipales de Palma de Mallorca e Ibiza han hecho obligatorio el cumplimiento de requisitos específicos (licencia ETV, cédula de habitabilidad) que Neural CRM gestiona nativamente en sus campos de base de datos."),
          bullet("Digitalización acelerada del sector inmobiliario: La pandemia de 2020 aceleró la adopción de herramientas digitales en el sector inmobiliario. Las visitas virtuales, la firma electrónica y la gestión remota de propiedades son ahora expectativas básicas del mercado, no diferenciales."),
          bullet("Demanda internacional que requiere multilingüismo: El perfil del comprador internacional en los destinos de lujo españoles exige comunicaciones profesionales en su idioma nativo. La capacidad de Neural CRM para generar copys en cuatro idiomas automáticamente responde directamente a esta demanda."),
          bullet("Escasez de talento y necesidad de automatización: Las agencias boutique no pueden permitirse equipos de back office grandes. La automatización de tareas administrativas es una necesidad operativa, no un lujo, para mantener márgenes saludables."),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 08 — ANÁLISIS COMPETITIVO
// ═══════════════════════════════════════════════════════════════
          sectionTitle("08", "ANÁLISIS COMPETITIVO"),
          heading2("8.1 Tabla Comparativa Completa"),
          para("La siguiente tabla compara a Neural CRM con los cinco competidores más relevantes del mercado, evaluando las funcionalidades más críticas para el segmento objetivo."),
          compTable(),
          ...spacer(1),
          para("Leyenda: ✔ Sí, funcionalidad completa  |  ✗ No disponible  |  ~ Disponible de forma parcial o con limitaciones significativas"),
          ...spacer(1),
          heading2("8.2 Análisis Individual de Competidores"),
          heading3("Inmovilla — Grupo Idealista"),
          twoColTable(
            [
              para("FORTALEZAS", { bold: true, color: C.green }),
              bullet("Cuota de mercado dominante en España: es el CRM inmobiliario más utilizado, con más de 8.000 agencias clientes."),
              bullet("Red MLS integrada muy potente: permite la colaboración entre agencias para la venta de propiedades, multiplicando la visibilidad del inventario."),
              bullet("Suite completa de herramientas operativas: firma biométrica de contratos, valoración automática de inmuebles, estadísticas de rendimiento."),
              bullet("Integración nativa con el portal Idealista: la mayor base de compradores activos de España."),
              bullet("Equipo de soporte y formación consolidado: red de distribuidores y formadores en toda España."),
            ],
            [
              para("DEBILIDADES", { bold: true, color: C.red }),
              bullet("Interfaz clásica y densa: la UX está orientada a agencias generalistas de volumen, no a la estética premium que exige el mercado de lujo."),
              bullet("Sin módulo de alquiler vacacional real: no puede gestionar calendarios de Airbnb/Booking ni los campos específicos de licencia ETV."),
              bullet("Nula automatización por Vision AI: la carga de propiedades es 100% manual, sin capacidad de procesamiento de dossiers PDF."),
              bullet("Dependencia estratégica de Idealista: las agencias usuarias de Inmovilla están atadas al ecosistema del portal, con riesgo de conflicto de intereses en la distribución."),
              bullet("Sin integración WhatsApp oficial."),
            ]
          ),
          ...spacer(1),
          heading3("Witei — Grupo Adevinta"),
          twoColTable(
            [
              para("FORTALEZAS", { bold: true, color: C.green }),
              bullet("La plataforma más fácil de usar del mercado: onboarding en horas, no días. Interfaz intuitiva y moderna."),
              bullet("Automatizaciones de marketing por email: secuencias de follow-up automáticas a leads, campañas de email marketing."),
              bullet("Precio de entrada muy competitivo: desde €49/mes, accesible para agencias pequeñas."),
              bullet("Integración con portales principales y CRM de contactos."),
            ],
            [
              para("DEBILIDADES", { bold: true, color: C.red }),
              bullet("Demasiado básico para el segmento de lujo: la interfaz y las funcionalidades no están adaptadas a la complejidad de gestionar villas de millones de euros."),
              bullet("Sin módulo de alquiler vacacional: diseñado exclusivamente para agencias de venta o alquiler de larga duración."),
              bullet("Sin integración WhatsApp oficial: solo email."),
              bullet("Sin IA generativa de ningún tipo."),
              bullet("Escalabilidad limitada: el producto comienza a mostrar fricción por encima de 100 propiedades."),
            ]
          ),
          ...spacer(1),
          heading3("Optima-CRM — OptimaSys"),
          twoColTable(
            [
              para("FORTALEZAS", { bold: true, color: C.green }),
              bullet("Especializado en el mercado de lujo e internacional, especialmente en Marbella y Costa del Sol."),
              bullet("Multidifusión a más de 150 portales internacionales, incluyendo JamesEdition, Luxury Portfolio y Christie's International."),
              bullet("Herramientas de prevención de blanqueo de capitales integradas: cumplimiento con la Ley 10/2010 de blanqueo."),
              bullet("Portal del propietario robusto y Portal del comprador."),
              bullet("Gestión de contactos internacionales muy detallada."),
            ],
            [
              para("DEBILIDADES", { bold: true, color: C.red }),
              bullet("Coste muy elevado: los planes más completos superan los €600/mes, con costes adicionales por portales premium."),
              bullet("Interfaz muy parametrizada y compleja de configurar: el tiempo de onboarding es largo y normalmente requiere consultoría de implementación."),
              bullet("Sin módulo de alquiler vacacional real: está diseñado para ventas, no para gestión de reservas vacacionales."),
              bullet("Poca innovación reciente en IA generativa: el producto no ha incorporado funcionalidades de LLM ni Vision AI."),
              bullet("Sin integración WhatsApp oficial."),
            ]
          ),
          ...spacer(1),
          heading3("Avantio"),
          twoColTable(
            [
              para("FORTALEZAS", { bold: true, color: C.green }),
              bullet("Líder indiscutible en software de alquiler vacacional en España: más de 2.000 gestores de propiedades vacacionales como clientes."),
              bullet("Channel Manager ultrarobusto con conexiones API directas (no iCal) a Booking.com, Airbnb, Vrbo, Expedia y más de 80 canales adicionales."),
              bullet("Sincronización en tiempo real de disponibilidad: los cambios en el calendario se reflejan en todos los canales en segundos."),
              bullet("Sistema de precios dinámicos y gestión de revenue management."),
              bullet("Módulo de pagos y cobros integrado."),
            ],
            [
              para("DEBILIDADES", { bold: true, color: C.red }),
              bullet("No está diseñado para vender propiedades: no tiene pipeline de ventas, gestión de compradores ni comisiones de compraventa."),
              bullet("Sin embudo CRM de compradores o inversores."),
              bullet("Sin IA generativa de ningún tipo."),
              bullet("Sin integración WhatsApp oficial."),
              bullet("La agencia que quiera también gestionar ventas necesita contratar un CRM adicional."),
            ]
          ),
          ...spacer(1),
          heading3("Guesty / Hostaway"),
          twoColTable(
            [
              para("FORTALEZAS", { bold: true, color: C.green }),
              bullet("Software de nivel global con presencia en más de 80 países."),
              bullet("Automatizaciones potentes: check-in automático con cerradura inteligente, mensajería contextual a huéspedes, revenue management dinámico."),
              bullet("API directas con los principales portales de alquiler vacacional globales."),
              bullet("Integración con sistemas de pago internacionales."),
            ],
            [
              para("DEBILIDADES", { bold: true, color: C.red }),
              bullet("Enfoque puramente de hospitalidad (PMS): no tiene funcionalidad inmobiliaria de ningún tipo."),
              bullet("Sin gestión de compradores, pipeline de ventas ni arrendamientos de larga duración."),
              bullet("Sin IA generativa para creación de contenido."),
              bullet("Precio muy elevado para el segmento boutique español."),
              bullet("Diseño orientado a property managers y no a agencias inmobiliarias."),
            ]
          ),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 09 — DAFO
// ═══════════════════════════════════════════════════════════════
          sectionTitle("09", "ANÁLISIS DAFO — MATRIZ ESTRATÉGICA"),
          para("La Matriz DAFO (Debilidades, Amenazas, Fortalezas, Oportunidades) de Neural CRM proporciona una visión estratégica equilibrada y honesta de la posición competitiva actual del producto y sus perspectivas de desarrollo."),
          ...spacer(1),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "💪 FORTALEZAS (Internas)", bold: true, size: 24, color: C.white })], spacing: { before: 80, after: 80 } }),
                      bullet("IA Real con GPT-4o Vision: extracción y descripción automática de dossiers PDF, ahorrando el 97% del tiempo de carga."),
                      bullet("Arquitectura Híbrida única en el mercado: un solo panel para los tres modelos de negocio (Venta + Vacacional + Larga Duración)."),
                      bullet("WhatsApp integrado con API oficial de Meta: conversaciones rastreables en el CRM, sin riesgo de bloqueo de API no oficial."),
                      bullet("Stack técnico moderno y escalable: React + Node.js + Prisma + PostgreSQL, dockerizable en cualquier cloud."),
                      bullet("Design System Mediterranean Luxury: interfaz premium que posiciona el producto en el segmento correcto desde el primer contacto visual."),
                      bullet("Seguridad enterprise: AES-256-GCM, RBAC 5 niveles, Audit Log inmutable, rate limiting."),
                      bullet("Escuadrón de 5 agentes IA autónomos: multiplica la fuerza operativa de agencias boutique pequeñas sin contratar personal."),
                      bullet("Portal del Propietario con Marca Blanca: herramienta de fidelización y diferenciación frente a agencias sin transparencia."),
                      bullet("Feeds para portales de ultra-lujo (JamesEdition): conexión con el mercado de compradores de alto patrimonio global."),
                    ],
                    shading: { type: ShadingType.SOLID, color: "1A3D2E" },
                    margins: { top: cm(0.3), bottom: cm(0.3), left: cm(0.4), right: cm(0.4) },
                    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: C.green }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 6, color: C.green }, right: { style: BorderStyle.SINGLE, size: 2, color: C.gold } },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "⚠️ DEBILIDADES (Internas)", bold: true, size: 24, color: C.white })], spacing: { before: 80, after: 80 } }),
                      bullet("Channel Manager iCal vs. API directa: las integraciones basadas en iCal tienen un retardo de sincronización de 30–60 minutos frente a las API directas de Avantio que son instantáneas."),
                      bullet("Dependencia financiera de APIs de terceros: los costes variables de OpenAI (GPT-4o Vision) y Meta (WhatsApp Business) son costes de infraestructura que deben controlarse y repercutirse al cliente adecuadamente."),
                      bullet("Base de clientes inicial: sin referencias instaladas ni casos de éxito publicados, el ciclo de venta B2B es más largo y costoso que para competidores establecidos."),
                      bullet("Documentación técnica en construcción: sin SDK oficial ni guía de integración para portales adicionales fuera del listado actual."),
                      bullet("Sin integración de firma electrónica nativa aún: DocuSign/Signaturit son herramientas que los clientes ya utilizan y cuya ausencia puede ser un freno en la decisión de compra."),
                      bullet("Recursos de marketing y ventas limitados en fase inicial: sin equipo comercial dedicado ni presupuesto de performance marketing para acelerar la adquisición."),
                    ],
                    shading: { type: ShadingType.SOLID, color: "3D1A1A" },
                    margins: { top: cm(0.3), bottom: cm(0.3), left: cm(0.4), right: cm(0.4) },
                    borders: { top: { style: BorderStyle.SINGLE, size: 6, color: C.red }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 6, color: C.red } },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "🚀 OPORTUNIDADES (Externas)", bold: true, size: 24, color: C.white })], spacing: { before: 80, after: 80 } }),
                      bullet("Zonas de alto standing con presupuesto elevado: Ibiza, Marbella y Mallorca concentran agencias boutique con capacidad y disposición para invertir en herramientas premium con estética acorde a su mercado."),
                      bullet("Demanda creciente de eficiencia por IA generativa: las agencias que reciben dossiers PDF de 50+ páginas necesitan urgentemente automatizar la catalogación para competir con equipos más grandes."),
                      bullet("Multilingüismo como ventaja competitiva: más del 80% de clientes en Ibiza son internacionales. La capacidad de redactar copys en ES/EN/DE/FR simultáneamente es una herramienta de captación de propietarios."),
                      bullet("Expansión geográfica natural: el modelo de Neural CRM aplica directamente a Costa del Sol, Mallorca, Canarias, Portugal (Algarve) y Sur de Francia (Riviera Francesa)."),
                      bullet("Integración de firma electrónica como próximo hito: DocuSign/Signaturit añadirían un módulo de alto valor percibido que completaría el flujo completo desde captación hasta firma."),
                      bullet("Partnerships con portales de lujo: acuerdos de distribución con JamesEdition o Luxury Portfolio podrían incluir Neural CRM como herramienta recomendada para sus agencias partner."),
                      bullet("Mercado de formación y certificación: creación de un programa de certificación 'Neural CRM Certified Agency' como estrategia de posicionamiento y fidelización."),
                    ],
                    shading: { type: ShadingType.SOLID, color: "1A2B3D" },
                    margins: { top: cm(0.3), bottom: cm(0.3), left: cm(0.4), right: cm(0.4) },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: C.sky }, left: { style: BorderStyle.SINGLE, size: 6, color: C.sky }, right: { style: BorderStyle.SINGLE, size: 2, color: C.gold } },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "🌩️ AMENAZAS (Externas)", bold: true, size: 24, color: C.white })], spacing: { before: 80, after: 80 } }),
                      bullet("Consolidación de portales: Idealista (comprador de Inmovilla) y Adevinta (propietario de Fotocasa y Habitaclia, comprador de Witei) tienen incentivos para incentivar el uso de sus propios CRMs mediante bundled pricing o beneficios exclusivos de indexación para sus clientes."),
                      bullet("Cambios en las políticas de Meta WhatsApp API: restricciones de precios, cambios en las políticas de privacidad o nuevas limitaciones en el uso de plantillas podrían afectar el módulo de comunicación."),
                      bullet("Adopción de IA por competidores establecidos: Optima-CRM y Avantio tienen los recursos para añadir módulos de GPT en 12–18 meses si perciben que la IA se convierte en un diferenciador de mercado."),
                      bullet("Regulación RGPD estricta y en evolución: cambios en la interpretación del RGPD respecto al almacenamiento de datos de conversaciones de WhatsApp o al uso de APIs de OpenAI para procesar datos personales de clientes pueden requerir adaptaciones de la arquitectura."),
                      bullet("Cambios en las políticas de pricing de OpenAI: incrementos en el coste por token de GPT-4o Vision afectarían directamente el margen del módulo de IA documental."),
                      bullet("Ciclo de ventas B2B largo en el sector inmobiliario: los directores de agencias boutique son conservadores en la adopción de nuevas herramientas de software y requieren un proceso de confianza prolongado."),
                    ],
                    shading: { type: ShadingType.SOLID, color: "2D1F0E" },
                    margins: { top: cm(0.3), bottom: cm(0.3), left: cm(0.4), right: cm(0.4) },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 6, color: C.gold }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 6, color: C.gold } },
                  }),
                ],
              }),
            ],
          }),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 10 — BRANDING
// ═══════════════════════════════════════════════════════════════
          sectionTitle("10", "BRANDING E IDENTIDAD VISUAL"),
          heading2("10.1 Filosofía de Marca"),
          para("La identidad de Neural CRM está construida sobre una tensión creativa deliberada entre dos mundos: la frialdad calculada de la tecnología de vanguardia y la calidez sensorial del lujo mediterráneo. El nombre 'Neural' evoca redes neuronales, inteligencia artificial y procesos de pensamiento avanzado. El modificador 'CRM' mantiene la claridad funcional del producto. Juntos, comunican que estamos ante una herramienta de gestión de relaciones con clientes que piensa, aprende y se adapta."),
          para("La filosofía de marca puede resumirse en tres principios:"),
          bullet("Inteligencia sin frialdad: La IA no tiene que ser fría y deshumanizante. Neural CRM usa la inteligencia artificial para que los agentes humanos sean más cálidos con sus clientes, eliminando las tareas mecánicas y dejándoles tiempo para construir relaciones auténticas."),
          bullet("Premium sin ostentación: El lujo más sofisticado no grita. Una interfaz de deep navy con acentos en oro cálido comunica excelencia sin barroquismo. Cada píxel tiene un propósito."),
          bullet("Potencia que simplifica: La tecnología más potente es la que desaparece del flujo de trabajo. El agente carga un PDF y aparece una ficha completa. La complejidad técnica es invisible; el resultado es mágico."),
          ...spacer(1),
          heading2("10.2 Paleta de Color — Mediterranean Luxury"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  { name: "Deep Navy", hex: "#0D1B2A", bg: C.navy, uso: "Sidebar, Header, fondos principales. El color de la confianza y la profundidad." },
                  { name: "Mediterranean", hex: "#1A3A5C", bg: C.med, uso: "Botones CTA principales, secciones destacadas. El azul del Mediterráneo en la distancia." },
                  { name: "Sky Blue", hex: "#4A6FA5", bg: C.sky, uso: "Botones secundarios, links, elementos interactivos secundarios." },
                  { name: "Warm Gold", hex: "#C9A84C", bg: C.gold, uso: "Acentos, badges premium, iconos de lujo, destacados. El oro es el lenguaje del lujo." },
                  { name: "Pearl White", hex: "#F5F0E8", bg: "F5F0E8", uso: "Fondos de tarjetas en modo claro, tipografía sobre fondos oscuros. El color de la nácar." },
                ].map(({ name, hex, bg, uso }) =>
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 20, color: bg === "F5F0E8" || bg === C.gold ? C.navy : C.white })], alignment: AlignmentType.CENTER, spacing: { before: 60, after: 10 } }),
                      new Paragraph({ children: [new TextRun({ text: hex, size: 18, color: bg === "F5F0E8" || bg === C.gold ? C.navy : C.white })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
                    ],
                    shading: { type: ShadingType.SOLID, color: bg },
                    margins: { top: cm(0.5), bottom: cm(0.5), left: cm(0.2), right: cm(0.2) },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.SINGLE, size: 2, color: C.gold }, right: { style: BorderStyle.SINGLE, size: 2, color: C.gold } },
                  })
                ),
              }),
            ],
          }),
          ...spacer(1),
          para("Uso semántico del color:"),
          bullet("El Deep Navy (#0D1B2A) es el color base de la aplicación. Representa profundidad, confianza y profesionalidad. Se utiliza en todos los elementos estructurales de la interfaz: sidebar de navegación, barra superior, modales de fondo."),
          bullet("El Warm Gold (#C9A84C) es el color de acento premium. Se reserva para los elementos que comunican valor, éxito y exclusividad: badges de propiedades de lujo, indicadores de score IA alto, llamadas a la acción más importantes, separadores decorativos y acentos en la tipografía de títulos."),
          bullet("El Pearl White (#F5F0E8) aporta calidez y suavidad frente a la frialdad del blanco puro. Se utiliza como fondo de tarjetas y paneles en modo claro, y como color del texto cuerpo sobre fondos oscuros."),
          ...spacer(1),
          heading2("10.3 Tipografía y Jerarquía Visual"),
          twoColTable(
            [
              heading3("Tipografía Principal — Titulares"),
              para("Playfair Display", { bold: true, size: 28 }),
              para("Familia: Serif clásica con influencias editoriales."),
              para("Pesos: Regular (400), SemiBold (600), Bold (700), Italic."),
              para("Uso: Títulos de sección H1 y H2, nombres de propiedades destacadas, slogan de marca, portadas del Portal del Propietario."),
              para("Racional: Playfair Display comunica elegancia, tradición editorial y sofisticación. Es la fuente que utilizan las revistas de lujo como AD Architectural Digest y Wallpaper. Su uso en los titulares posiciona visualmente el producto en el segmento correcto desde el primer contacto."),
            ],
            [
              heading3("Tipografía Funcional — Interfaz"),
              para("Inter", { bold: true, size: 28 }),
              para("Familia: Sans-serif optimizada para pantallas digitales."),
              para("Pesos: Light (300), Regular (400), Medium (500), SemiBold (600), Bold (700), ExtraBold (800)."),
              para("Uso: Todo el texto de la interfaz de usuario: navegación, formularios, tablas de datos, botones, etiquetas, mensajes de sistema."),
              para("Racional: Inter fue diseñada específicamente para la legibilidad en pantallas digitales de alta resolución. Su geometría limpia y su excelente legibilidad en tamaños pequeños la hace ideal para la interfaz densa de información de un CRM profesional."),
            ]
          ),
          ...spacer(1),
          heading2("10.4 Marca Blanca — White Label"),
          para("El sistema de Marca Blanca de Neural CRM permite que cada agencia cliente personalice la interfaz de la plataforma con su identidad corporativa propia. La implementación técnica es elegante y eficiente: en lugar de generar builds de la aplicación separados para cada cliente, Neural CRM inyecta variables CSS nativas en el DOM en tiempo de carga, lo que permite que toda la interfaz se adapte al color corporativo de cada agencia de forma instantánea y sin necesidad de recompilar los estilos."),
          para("El Portal del Propietario (disponible en el plan ELITE) puede personalizarse completamente con:"),
          bullet("Logo de la agencia: sustituyendo el logotipo de Neural CRM por el logo corporativo de la agencia en el portal de acceso para propietarios."),
          bullet("Color primario: el color corporativo de la agencia sustituye al Mediterranean Blue (#1A3A5C) en todos los botones, cabeceras y elementos de la marca."),
          bullet("Color de acento: el color secundario de la agencia puede sustituir al Warm Gold en los destacados y elementos premium."),
          bullet("Nombre comercial: el portal puede llevar el nombre de la agencia en lugar de 'Neural CRM', reforzando el brand propio frente al propietario."),
          ...spacer(1),
          heading2("10.5 Voz y Tono de Marca"),
          para("La comunicación de Neural CRM sigue cuatro principios de voz que se aplican en todos los touchpoints: web, app, emails, documentación y atención al cliente."),
          bullet("Seguro sin arrogancia: Neural CRM habla con autoridad sobre lo que sabe, pero no menosprecia el conocimiento previo ni la experiencia del cliente. 'Somos los mejores en X' se convierte en 'Con Neural CRM, X toma 3 minutos en lugar de 90'."),
          bullet("Preciso sin tecnicismo: Los conceptos técnicos se explican siempre en términos de valor de negocio, no de arquitectura. No decimos 'GPT-4o Vision analiza los XObjects del PDF'; decimos 'la IA lee el dossier, extrae las fotos y redacta la descripción automáticamente'."),
          bullet("Ambicioso sin prometer lo imposible: Neural CRM habla de mejoras concretas y cuantificables. No hace promesas vagas; hace afirmaciones respaldadas por datos de uso real."),
          bullet("Cálido sin informalidad: El tono es cercano y humano, pero mantiene el nivel de formalidad que corresponde a un software que gestionan propiedades de millones de euros. Es el tono de un consultor experto que también es simpático."),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 11 — MODELO DE NEGOCIO
// ═══════════════════════════════════════════════════════════════
          sectionTitle("11", "MODELO DE NEGOCIO Y PRECIOS"),
          heading2("11.1 Planes y Características"),
          para("Neural CRM se comercializa bajo un modelo de suscripción mensual recurrente (MRR - Monthly Recurring Revenue) con tres planes escalonados, diseñados para adaptarse al tamaño y las necesidades de cada agencia cliente, desde la boutique que empieza hasta la gran agencia o red MLS."),
          ...spacer(1),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Característica", bold: true, size: 20, color: C.white })], spacing: { before: 60, after: 60 } })],
                    shading: { type: ShadingType.SOLID, color: C.navy },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.gold }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 4, color: C.gold } },
                    margins: { left: cm(0.3), right: cm(0.3) },
                  }),
                  ...[
                    { name: "STARTER", price: "€99/mes", color: C.sky },
                    { name: "PRO ⭐", price: "€249/mes", color: C.med },
                    { name: "ELITE", price: "€499/mes", color: C.navy },
                  ].map(({ name, price, color }) => new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: name, bold: true, size: 22, color: C.gold })], alignment: AlignmentType.CENTER, spacing: { before: 40, after: 10 } }),
                      new Paragraph({ children: [new TextRun({ text: price, bold: true, size: 28, color: C.white })], alignment: AlignmentType.CENTER, spacing: { before: 0, after: 60 } }),
                    ],
                    shading: { type: ShadingType.SOLID, color: color === C.med ? "1A2E45" : color },
                    borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.SINGLE, size: 4, color: C.gold }, left: { style: BorderStyle.SINGLE, size: 2, color: C.gold }, right: { style: BorderStyle.SINGLE, size: 2, color: C.gold } },
                    margins: { left: cm(0.2), right: cm(0.2) },
                  })),
                ],
              }),
              // Feature rows
              ...[
                ["👥 Usuarios activos", "Hasta 3", "Ilimitados", "Ilimitados"],
                ["🏠 Propiedades en inventario", "Hasta 30", "Hasta 150", "Ilimitadas"],
                ["📋 CRM Leads + Pipeline Kanban", "✔ Básico", "✔ Completo", "✔ Completo"],
                ["🤖 Módulo IA Documental (PDF→Ficha)", "✗", "✔ (50 análisis/mes)", "✔ Ilimitado"],
                ["📅 Channel Manager iCal", "✔ Básico", "✔ Completo", "✔ Completo"],
                ["📡 Feeds XML Idealista + Fotocasa", "✔", "✔", "✔"],
                ["🌍 Feed XML Kyero (Internacional)", "✗", "✔", "✔"],
                ["💎 Feed JSON JamesEdition (Ultra-lujo)", "✗", "✗", "✔"],
                ["💬 WhatsApp Meta API", "✗", "✔ 500 msg/mes", "✔ Ilimitado"],
                ["👤 Portal del Propietario", "✗", "✔ Neural Brand", "✔ Marca Blanca"],
                ["🔒 Cifrado AES-256 + Audit Log", "✔", "✔", "✔"],
                ["👥 RBAC 5 roles de acceso", "✔", "✔", "✔"],
                ["🗂️ Google Drive + Sheets Sync", "Básico", "✔ Completo", "✔ Completo"],
                ["🤖 Escuadrón Agentes IA (5 bots)", "✗", "AI Inbound solo", "✔ Los 5 agentes"],
                ["🎨 Marca Blanca completa", "✗", "✗", "✔"],
                ["📞 Soporte", "Email (48h)", "Chat + Email (24h)", "Prioritario SLA 4h"],
                ["🚀 Onboarding técnico", "Autodidacta", "Webinar", "Asistido incluido"],
                ["📦 Migración de datos", "✗", "Básica", "Asistida completa"],
              ].map(([feat, s, p, e]) => new TableRow({
                children: [feat, s, p, e].map((cell, i) => new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({
                      text: cell,
                      size: 19,
                      color: cell === "✔" || cell.startsWith("✔") ? C.green : cell === "✗" ? C.red : (i === 0 ? C.black : C.navy),
                      bold: i === 0,
                    })],
                    alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
                    spacing: { before: 40, after: 40 },
                  })],
                  shading: { type: ShadingType.SOLID, color: i === 2 ? "EAF4E8" : C.white },
                  borders: { top: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }, bottom: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" }, left: { style: BorderStyle.SINGLE, size: i === 2 ? 4 : 1, color: i === 2 ? C.green : "DDDDDD" }, right: { style: BorderStyle.SINGLE, size: 1, color: "DDDDDD" } },
                  margins: { left: cm(0.25), right: cm(0.25) },
                })),
              })),
            ],
          }),
          ...spacer(1),
          heading2("11.2 Proyección de MRR y Rentabilidad"),
          para("El modelo financiero de Neural CRM está diseñado con un umbral de rentabilidad conservador y un potencial de escalado significativo:"),
          twoColTable(
            [
              heading3("Escenario Base — 8 Clientes"),
              bullet("3 clientes STARTER: 3 × €99 = €297/mes"),
              bullet("4 clientes PRO: 4 × €249 = €996/mes"),
              bullet("1 cliente ELITE: 1 × €499 = €499/mes"),
              para("MRR Total: €1.792/mes", { bold: true, color: C.gold }),
              para("ARR Anual: ~€21.500", { bold: true, color: C.gold }),
              para("Umbral de rentabilidad estimado (cubriendo costes de infraestructura, APIs de OpenAI, Meta WhatsApp y soporte): ~€1.500–1.800/mes MRR.", { italic: true, color: C.gray }),
            ],
            [
              heading3("Escenario Objetivo — 30 Clientes"),
              bullet("8 clientes STARTER: 8 × €99 = €792/mes"),
              bullet("16 clientes PRO: 16 × €249 = €3.984/mes"),
              bullet("6 clientes ELITE: 6 × €499 = €2.994/mes"),
              para("MRR Total: €7.770/mes", { bold: true, color: C.gold }),
              para("ARR Anual: ~€93.200", { bold: true, color: C.gold }),
              para("A 30 clientes, el margen bruto estimado (tras descontar costes de APIs de IA y cloud) es del 65–70%, generando ~€5.000–5.500/mes de beneficio operativo.", { italic: true, color: C.gray }),
            ]
          ),
          ...spacer(1),
          heading2("11.3 Gestión de Costes de IA y APIs Externas"),
          para("Un aspecto crítico del modelo de negocio de Neural CRM es la gestión de los costes variables de las APIs externas que potencian sus funcionalidades de IA y comunicación. Estos costes deben estar cuidadosamente controlados para proteger los márgenes del SaaS."),
          heading3("Costes de OpenAI — GPT-4o Vision"),
          para("Cada análisis de un dossier PDF mediante GPT-4o Vision tiene un coste aproximado de €0.15–0.45 dependiendo del número de páginas y la complejidad del documento (número de imágenes, extensión del texto). Para gestionar este coste, Neural CRM implementa los siguientes controles:"),
          bullet("Plan PRO: Límite de 50 análisis IA por mes incluidos en la suscripción. Los análisis adicionales se facturan a €0.90/análisis (margen del 100–500% sobre el coste de OpenAI)."),
          bullet("Plan ELITE: Análisis ilimitados incluidos. El coste se gestiona internamente mediante cuotas de uso y monitorización de consumo."),
          bullet("Optimización técnica: Las imágenes se envían como URLs CDN en lugar de Base64, reduciendo el consumo de tokens y el tiempo de respuesta."),
          heading3("Costes de Meta WhatsApp Business API"),
          para("La API de WhatsApp Business de Meta tiene un modelo de precios por conversación: las conversaciones iniciadas por usuarios son gratuitas hasta cierto volumen; las conversaciones iniciadas por la empresa tienen un coste de €0.047–0.070 por conversación (en Europa) dependiendo del tipo de plantilla."),
          para("Neural CRM ofrece dos modelos de integración:"),
          bullet("Modelo BYOK (Bring Your Own Key): El cliente utiliza su propia cuenta de Meta Business y gestiona directamente su relación con Meta. Neural CRM solo proporciona la integración técnica. Este modelo es el recomendado para el plan ELITE con usuarios de alto volumen."),
          bullet("Modelo de paquete prepagado: Neural CRM gestiona la cuenta de Meta y ofrece paquetes de mensajes (500 msg/mes incluidos en el plan PRO; mensajes adicionales a €0.12/conversación con margen para la plataforma)."),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 12 — ROADMAP
// ═══════════════════════════════════════════════════════════════
          sectionTitle("12", "ROADMAP DE DESARROLLO"),
          heading2("Hitos Completados"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              ...[
                { fecha: "Mayo 2026", hito: "Fase 1 — Fundación Multi-Tenant y Autenticación", desc: "Definición del modelo relacional Prisma con aislamiento por agenciaId en todas las entidades. Implementación del sistema de autenticación dual: Google OAuth 2.0 para acceso corporativo SSO y Dev Login bypass para agilizar el desarrollo." },
                { fecha: "Mayo 2026", hito: "Fase 2 — Módulo Inmobiliario Híbrido", desc: "Implementación de los tres modelos de negocio (AlquilerVacacional, AlquilerLargaDuracion, Venta) como sub-modelos nativos de la entidad Propiedad, con todos sus campos específicos y relaciones." },
                { fecha: "Junio 2026", hito: "Fase 3 — Pipeline IA Documental y Corrección CORS", desc: "Implementación completa del pipeline PDF → XObjects → Supabase CDN → GPT-4o Vision → JSON. Corrección del problema de CORS con Google Drive mediante mecanismo de fallback local con sincronización en background." },
                { fecha: "Junio 2026", hito: "Fase 4 — Feeds de Sindicación XML para Portales", desc: "Generación dinámica de feeds XML para Idealista, Fotocasa y Kyero, y feed JSON para JamesEdition. Mapeo automático de atributos detectados por IA a los campos requeridos por cada portal." },
                { fecha: "Junio 2026", hito: "Fase 5 — Estabilización del Sistema de Autenticación", desc: "Corrección del problema crítico de bucles de redirección infinita en el flujo de login. Las configuraciones de marca blanca (color, logo) ahora se cargan sin requerir JWT, permitiendo renderizar la interfaz pública correctamente." },
              ].map(({ fecha, hito, desc }) => new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: fecha, size: 18, color: C.gold, bold: true })], spacing: { before: 60, after: 60 } })],
                    shading: { type: ShadingType.SOLID, color: C.navy },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    margins: { left: cm(0.3), right: cm(0.3) },
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: C.gold }, bottom: { style: BorderStyle.SINGLE, size: 1, color: C.gold }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 4, color: C.gold } },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "✅ " + hito, bold: true, size: 20, color: C.green })], spacing: { before: 40, after: 20 } }),
                      new Paragraph({ children: [new TextRun({ text: desc, size: 18, color: C.black })], spacing: { before: 0, after: 60 } }),
                    ],
                    margins: { left: cm(0.3), right: cm(0.3) },
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: C.gold }, bottom: { style: BorderStyle.SINGLE, size: 1, color: C.gold }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              })),
            ],
          }),
          ...spacer(1),
          heading2("Fases Planificadas"),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              ...[
                { fecha: "Q3 2026", hito: "Fase 6 — Multilingüismo Nativo por IA", desc: "Configuración del pipeline de GPT-4o para generar descripciones de propiedades automáticamente en Español, Inglés, Alemán y Francés. Esencial para el mercado de Ibiza donde más del 80% de los clientes son internacionales." },
                { fecha: "Q3 2026", hito: "Fase 7 — Integración de Firma Electrónica", desc: "Integración con DocuSign o Signaturit para la firma de contratos de arras, mandatos de venta y contratos de alquiler directamente desde el CRM, sin exportar documentos a plataformas externas." },
                { fecha: "Q4 2026", hito: "Fase 8 — Channel Manager API Directa", desc: "Migración del sistema de sincronización iCal a integraciones API directas con Airbnb y Booking.com para sincronización de disponibilidad en tiempo real (< 30 segundos) en lugar del retardo de 30–60 min del protocolo iCal." },
                { fecha: "Q4 2026", hito: "Fase 9 — Tarifas Dinámicas Vacacionales", desc: "Módulo de revenue management para alquiler vacacional con ajuste automático de precios por temporada, ocupación histórica y precios de la competencia." },
                { fecha: "2027", hito: "Fase 10 — Expansión Geográfica", desc: "Adaptación y localización del producto para Mallorca, Costa del Sol, Canarias, Portugal (Algarve) y Sur de Francia. Integración con portales locales de cada mercado." },
                { fecha: "2027", hito: "Fase 11 — Red MLS para Agencias Colaboradoras", desc: "Módulo de colaboración entre agencias que permite compartir propiedades del inventario con otras agencias de la red para aumentar la probabilidad de venta, con distribución automática de comisiones." },
              ].map(({ fecha, hito, desc }) => new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: fecha, size: 18, color: C.white, bold: true })], spacing: { before: 60, after: 60 } })],
                    shading: { type: ShadingType.SOLID, color: C.med },
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    margins: { left: cm(0.3), right: cm(0.3) },
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: C.sky }, bottom: { style: BorderStyle.SINGLE, size: 1, color: C.sky }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.SINGLE, size: 4, color: C.sky } },
                  }),
                  new TableCell({
                    children: [
                      new Paragraph({ children: [new TextRun({ text: "⏳ " + hito, bold: true, size: 20, color: C.sky })], spacing: { before: 40, after: 20 } }),
                      new Paragraph({ children: [new TextRun({ text: desc, size: 18, color: C.black })], spacing: { before: 0, after: 60 } }),
                    ],
                    margins: { left: cm(0.3), right: cm(0.3) },
                    borders: { top: { style: BorderStyle.SINGLE, size: 1, color: C.sky }, bottom: { style: BorderStyle.SINGLE, size: 1, color: C.sky }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
                  }),
                ],
              })),
            ],
          }),
          pageBreak(),

// ═══════════════════════════════════════════════════════════════
// 13 — CONCLUSIÓN
// ═══════════════════════════════════════════════════════════════
          sectionTitle("13", "CONCLUSIÓN Y PRÓXIMOS PASOS"),
          para("Neural CRM no es un CRM más en un mercado saturado de CRMs. Es una respuesta directa, específica y técnicamente sofisticada a un problema concreto que afecta a cientos de agencias inmobiliarias boutique en los destinos turísticos de lujo de Europa: la imposibilidad de gestionar un inventario de propiedades de alta gama de forma eficiente, unificada e inteligente con las herramientas existentes en el mercado."),
          para("La combinación única de inventario híbrido nativo (que elimina la necesidad del doble software CRM+PMS), pipeline de Vision AI (que transforma 90 minutos de trabajo manual en 3 minutos automáticos), comunicación rastreable por WhatsApp API oficial, y un escuadrón de cinco agentes autónomos crea una propuesta de valor que ningún competidor actual puede replicar con su arquitectura existente."),
          para("El mercado objetivo —agencias boutique en Ibiza, Mallorca y Marbella— está demostrado que tiene presupuesto, tiene necesidad y está empezando a reconocer que la IA generativa no es una promesa futura sino una realidad presente que ya puede cambiar su operativa diaria. Neural CRM está posicionado para capturar este mercado en el momento exacto de su madurez tecnológica."),
          ...spacer(1),
          infoBox("🎯 Próximos Pasos Inmediatos:", "1. Validación con 3–5 agencias piloto en Ibiza para recoger feedback real de uso y refinar el producto. 2. Desarrollo del módulo de multilingüismo (ES/EN/DE/FR). 3. Integración de firma electrónica (Signaturit). 4. Estrategia de go-to-market: LinkedIn + asistencia a ferias sectoriales (API Spain, SIMA Madrid, Luxury Property Show). 5. Construcción del primer caso de éxito documentado con métricas de impacto.", C.navy),
          ...spacer(1),
          divider(),
          new Paragraph({
            children: [new TextRun({ text: "© 2026 Neural CRM · Todos los derechos reservados · Documento Confidencial", size: 18, color: C.gray, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Inteligencia Artificial para Inmobiliarias de Lujo · Ibiza · Mallorca · Marbella · Costa del Sol", size: 18, color: C.gold, bold: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = "./Neural_CRM_Proyecto_Profesional.docx";
  fs.writeFileSync(outputPath, buffer);
  console.log("✅ Documento Word generado correctamente en:", outputPath);
  console.log("📄 Tamaño:", (buffer.length / 1024).toFixed(0), "KB");
}

generate().catch(console.error);
