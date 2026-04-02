const fs = require('fs');
let schema = fs.readFileSync('prisma/schema.prisma', 'utf8');

// Cambiar provider
schema = schema.replace('provider = "postgresql"', 'provider = "sqlite"');
schema = schema.replace('url      = env("DATABASE_URL")', 'url      = "file:./dev.db"');

// Eliminar todos los bloques enum {...}
schema = schema.replace(/enum \w+ \{[\s\S]*?\}/g, '');

// Reemplazar tipos Enum por String
const enumNames = [
  'TipoPropiedad', 'TipoPiscina', 'EstadoPropiedad', 'EtapaPipeline',
  'EstadoHipotecario', 'Temporada', 'EstadoPagoRenta', 'TipoLead',
  'EstadoLead', 'OrigenLead', 'NivelInteres', 'AccionHistorial',
  'CalificacionVisita', 'FaseProceso', 'TipoDocumento', 'EstadoProcesamiento',
  'RolUsuario', 'CategoriaPropietario', 'Categoria', 'CategoriaPropiedad', 'TipoCliente'
];

enumNames.forEach(eName => {
  const regex = new RegExp(`(\\w+\\s+)${eName}(\\??)(?=\\s|$)`, 'g');
  schema = schema.replace(regex, `$1String$2`);
});

// JSON no está soportado nativamente en SQLite por Prisma, se cambia a String
schema = schema.replace(/(\w+\s+)Json(\??)/g, `$1String$2`);

// Los arrays (String[]) no están soportados en SQLite Prisma. Cambiarlos a String.
schema = schema.replace(/(\w+\s+)String\[\]/g, `$1String`);

// Arreglar @default(VALOR) -> @default("VALOR") para los enums convertidos a String
// Busca @default(A_Z_1_2) que no empiece/termine con comillas, false, true, autoincrement, now, uuid, etc.
schema = schema.replace(/@default\(([A-Z_]+)\)/g, (match, val) => {
  if (val === 'TRUE' || val === 'FALSE' || val === 'NOW') return match;
  return `@default("${val}")`;
});

fs.writeFileSync('prisma/schema.prisma', schema);
console.log('Schema convertido a SQLite con defaults corregidos');
