const fs = require('fs');

let content = fs.readFileSync('src/types/index.ts', 'utf-8');

// Insert BaseEntity
const baseEntity = `
export interface BaseEntity {
  id: string;
  organizationId: string;
  createdAt: string;
  createdBy?: string;
  updatedAt: string;
  updatedBy?: string;
  sourceApp?: "CRM" | "OS" | "API" | "AI";
  sourceWorkspace?: "Admin" | "BDM" | "Recruiter" | "Vendor" | "Client" | "System";
  status?: string;
  version?: number;
  deleted?: boolean;
  lastActivityAt?: string;
}
`;

content = content.replace("export type Role = ", baseEntity + "\nexport type Role = ");

// Replace interfaces to extend BaseEntity
function extendBase(interfaceName) {
  const regex = new RegExp(`export interface ${interfaceName} \\{`, "g");
  content = content.replace(regex, `export interface ${interfaceName} extends BaseEntity {`);
}

extendBase("Company");
extendBase("User");
extendBase("Client");
extendBase("Vendor");
extendBase("Job");
extendBase("Candidate");
extendBase("Deal");
extendBase("Submission");
extendBase("Organization");

// Remove duplicate fields
const fieldsToRemove = [
  "id: string;",
  "createdAt: string;",
  "updatedAt: string;",
  "organizationId?: string;",
  "organizationId: string;",
  "status: 'active' | 'inactive';",
  "status: 'pending' | 'signed' | 'expired';",
  "status: 'open' | 'closed' | 'filled' | 'pending';",
  "status?: 'active' | 'inactive';",
  "status?: string;",
  "status: 'prospect' | 'sourcing' | 'submitted' | 'interview' | 'offered' | 'placed' | 'paid';",
  "status: 'submitted' | 'shortlisted' | 'interview' | 'offered' | 'hired' | 'rejected';",
];

fieldsToRemove.forEach(f => {
  content = content.split('\n').filter(line => !line.trim().startsWith(f) || line.includes("export")).join('\n');
});

// Since some enums for status were removed, let's put them back if needed, or we can just keep them generic strings as in BaseEntity. The user asked for `status?: string;` on BaseEntity, so the others can just use that. Wait, if we remove `status: 'active' | 'inactive';` then TypeScript will allow any string. That might be fine for this migration phase or we can keep the narrow types.
// It's better to keep the narrow types if they were there! Let's do this carefully with a manual overwrite.

