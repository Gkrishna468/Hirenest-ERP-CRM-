import re

with open('src/types/index.ts', 'r') as f:
    content = f.read()

base_entity = """
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

"""

content = content.replace("export type Role = ", base_entity + "export type Role = ")

entities = ["Company", "User", "Client", "Vendor", "Job", "Candidate", "Deal", "Submission", "Organization"]

for e in entities:
    # replace `export interface X {` with `export interface X extends BaseEntity {`
    content = re.sub(rf"export interface {e}\s*{{", f"export interface {e} extends BaseEntity {{", content)

# remove fields from these interfaces that are now in BaseEntity
lines = content.split('\n')
out_lines = []
in_entity = False
current_entity = ""

fields_to_remove = ["id:", "createdAt:", "updatedAt:", "organizationId:"]
fields_to_remove_optional = ["organizationId?:", "createdBy?:", "updatedBy?:", "lastActivityAt?:", "deleted?:"]

for line in lines:
    stripped = line.strip()
    
    match = re.match(r"export interface (\w+) extends BaseEntity", line)
    if match:
        in_entity = True
        current_entity = match.group(1)
        out_lines.append(line)
        continue
        
    if in_entity and stripped == "}":
        in_entity = False
        out_lines.append(line)
        continue
        
    if in_entity:
        skip = False
        for f in fields_to_remove:
            if stripped.startswith(f):
                skip = True
        for f in fields_to_remove_optional:
            if stripped.startswith(f):
                skip = True
        
        # We also have status, but let's keep status if it's narrowed (e.g., status: 'active' | 'inactive')
        # If it's just `status?: string;`, we can skip it.
        if stripped == "status?: string;":
            skip = True
            
        if skip:
            continue
            
    out_lines.append(line)

with open('src/types/index.ts', 'w') as f:
    f.write('\n'.join(out_lines))

