import re

with open('src/pages/Vendors.tsx', 'r') as f:
    content = f.read()

# Add `file: File;` to the state type
content = content.replace("text?: string;", "text?: string;\n    file?: File;")

# Store the file when selected
content = content.replace(
'''      return {
        id: crypto.randomUUID(),
        name: f.name,''',
'''      return {
        id: crypto.randomUUID(),
        file: f,
        name: f.name,''')

# Rewrite the submit loop
old_run_parsing = '''    for (let i = 0; i < updated.length; i++) {
      updated[i] = { 
        ...updated[i], 
        status: 'parsing',
        stages: {
          upload: 'success',
          parse: 'pending',
          dupCheck: 'pending',
          identityRes: 'pending',
          firestore: 'pending'
        },
        resultMessage: 'Parsing...'
      };
      setBulkResumes([...updated]);
      
      try {
        const response = await apiFetch('/api/ai/parse-resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText: updated[i].text })
        });
        
        if (response.ok) {
          const parsed = await safeJson(response);
          updated[i] = {
            ...updated[i],
            status: 'done',
            stages: {
              upload: 'success',
              parse: 'success',
              dupCheck: 'pending',
              identityRes: 'pending',
              firestore: 'pending'
            },
            resultMessage: 'Parsed successfully',
            parsedData: {
              ...updated[i].parsedData,
              ...parsed,
              name: parsed.name && parsed.name !== 'Unknown Candidate' ? parsed.name : updated[i].parsedData.name
            }
          };
        } else {
          const errorText = await response.text().catch(() => 'AI Gateway unavailable');
          updated[i] = { 
            ...updated[i], 
            status: 'failed', 
            error: errorText,
            resultMessage: 'Parse Failed',
            stages: {
              ...updated[i].stages!,
              parse: 'error'
            }
          };
        }
      } catch (err: any) {
        updated[i] = { 
          ...updated[i], 
          status: 'failed', 
          error: err.message || 'Network error',
          resultMessage: 'Network Error',
          stages: {
            ...updated[i].stages!,
            parse: 'error'
          }
        };
      }
      setBulkResumes([...updated]);
      await new Promise(r => setTimeout(r, 450)); // pipeline step-by-step aesthetic visual pace
    }'''

new_run_parsing = '''    for (let i = 0; i < updated.length; i++) {
      updated[i] = { 
        ...updated[i], 
        status: 'parsing',
        stages: {
          upload: 'pending',
          parse: 'pending',
          dupCheck: 'pending',
          identityRes: 'pending',
          firestore: 'pending'
        },
        resultMessage: 'Uploading...'
      };
      setBulkResumes([...updated]);
      
      try {
        const formData = new FormData();
        if (updated[i].file) {
          formData.append('resume', updated[i].file as Blob);
        }
        formData.append('vendorId', selectedVendor.id);
        if (bulkUploadMode !== 'talent-pool' && bulkReqId) {
            formData.append('requirementId', bulkReqId);
            formData.append('isPool', 'false');
        } else {
            formData.append('isPool', 'true');
        }

        const token = localStorage.getItem('__hirenest_token');
        const reqHeaders: Record<string, string> = {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const response = await fetch('/api/candidates/ingest', {
          method: 'POST',
          headers: reqHeaders,
          body: formData
        });
        
        if (response.ok) {
          const parsed = await response.json();
          updated[i] = {
            ...updated[i],
            status: 'done',
            stages: {
              upload: 'success',
              parse: 'success',
              dupCheck: 'success',
              identityRes: 'success',
              firestore: 'success'
            },
            resultMessage: 'Ingested successfully',
            parsedData: {
              ...updated[i].parsedData,
              ...parsed
            }
          };
        } else {
          const errorData = await response.json().catch(() => ({ error: 'AI Gateway unavailable' }));
          
          let failMessage = 'Ingestion Failed';
          let dupCheckStatus: "success" | "error" | "pending" = "pending";
          let resultStatus: "failed" | "done" | "pending" | "parsing" = "failed";

          if (response.status === 409) {
             failMessage = 'Duplicate skipped';
             dupCheckStatus = 'error';
             resultStatus = 'failed';
          }
          
          updated[i] = { 
            ...updated[i], 
            status: resultStatus, 
            error: errorData.error || errorData.message || 'Unknown error',
            resultMessage: failMessage,
            stages: {
              ...updated[i].stages!,
              upload: 'success',
              parse: 'success',
              dupCheck: dupCheckStatus
            }
          };
        }
      } catch (err: any) {
        updated[i] = { 
          ...updated[i], 
          status: 'failed', 
          error: err.message || 'Network error',
          resultMessage: 'Network Error',
          stages: {
            ...updated[i].stages!,
            upload: 'error'
          }
        };
      }
      setBulkResumes([...updated]);
      await new Promise(r => setTimeout(r, 450)); // pipeline step-by-step aesthetic visual pace
    }
'''

content = content.replace(old_run_parsing, new_run_parsing)

# I should also bypass saveBulkCandidates since ingestion is already doing DB save!
# Wait, runParsing used to be just parsing. Identity resolution and save were separate.
# Now ingest does EVERYTHING.
# The UI has "Parse All", "Resolve Identities", "Sync to CRM".
# We should combine them into one button "Start Ingestion", or just auto-advance the UI.
# In `saveBulkCandidates`, it used to do the actual saving.

with open('src/pages/Vendors.tsx', 'w') as f:
    f.write(content)
