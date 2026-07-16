import re

with open('src/pages/Vendors.tsx', 'r') as f:
    content = f.read()

# Replace the runAIParsing function body entirely until the end brace.
start_str = "  const runAIParsing = async () => {"
end_str = "  };\n\n  const runIdentityResolution"
start_idx = content.find(start_str)
end_idx = content.find(end_str)

if start_idx != -1 and end_idx != -1:
    new_func = '''  const runAIParsing = async () => {
    setBulkStartTime(Date.now());
    setBulkStep(3);
    const updated = [...bulkResumes];
    
    for (let i = 0; i < updated.length; i++) {
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
        resultMessage: 'Uploading & Processing...'
      };
      setBulkResumes([...updated]);
      
      try {
        const formData = new FormData();
        if (updated[i].file) {
          formData.append('resume', updated[i].file as Blob);
        }
        formData.append('vendorId', selectedVendor?.id || '');
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
          let dupCheckStatus: "success" | "error" | "pending" | "duplicate" = "pending";
          let resultStatus: "failed" | "done" | "pending" | "parsing" = "failed";

          if (response.status === 409) {
             failMessage = 'Duplicate skipped';
             dupCheckStatus = 'duplicate';
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
              dupCheck: dupCheckStatus as any
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
      await new Promise(r => setTimeout(r, 450));
    }'''
    content = content[:start_idx] + new_func + content[end_idx:]

with open('src/pages/Vendors.tsx', 'w') as f:
    f.write(content)
