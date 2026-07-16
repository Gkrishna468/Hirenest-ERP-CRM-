import re

with open('src/pages/Vendors.tsx', 'r') as f:
    content = f.read()

old_save = '''    for (let i = 0; i < updated.length; i++) {
        const cand = updated[i];
        if (cand.status === 'failed') {
          if (updated[i].stages) {
            updated[i].stages.firestore = 'skipped';
          }
          continue;
        }

        if (bulkCheckIdentity && cand.parsedData?.hasConflict) {
          skippedCount++;
          if (updated[i].stages) {
            updated[i].stages.firestore = 'skipped';
          }
          updated[i].resultMessage = 'Duplicate skipped';
          setBulkResumes([...updated]);
          continue;
        }

        // Set state to syncing for this candidate
        if (updated[i].stages) {
          updated[i].stages.firestore = 'pending';
        }
        updated[i].resultMessage = 'Syncing...';
        setBulkResumes([...updated]);

        const identityString = `${cand.parsedData?.email}-${cand.parsedData?.phone}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        const payload = bulkUploadMode === 'talent-pool'
          ? {
              candidateHash: identityString,
              vendorId: selectedVendor.id,
              candidateName: cand.parsedData?.name,
              identityData: {
                email: cand.parsedData?.email,
                phone: cand.parsedData?.phone,
                linkedin: '',
                resume_url: '',
                current_title: cand.parsedData?.currentTitle || 'Software Engineer',
                skills: cand.parsedData?.skills || [],
                location: cand.parsedData?.location || 'Bengaluru',
                notice_period: cand.parsedData?.noticePeriod || 'Immediate',
                current_company: cand.parsedData?.currentCompany || 'Apex Tech Solutions',
              }
            }
          : {
              candidateHash: identityString,
              vendorId: selectedVendor.id,
              candidateName: cand.parsedData?.name,
              requirementId: bulkReqId,
              identityData: {
                email: cand.parsedData?.email,
                phone: cand.parsedData?.phone,
                linkedin: '',
                resume_url: '',
                current_title: cand.parsedData?.currentTitle || 'Software Engineer',
                skills: cand.parsedData?.skills || [],
                location: cand.parsedData?.location || 'Bengaluru',
                notice_period: cand.parsedData?.noticePeriod || 'Immediate',
                current_company: cand.parsedData?.currentCompany || 'Apex Tech Solutions',
              }
            };

        try {
          const response = await apiFetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          
          if (response.ok) {
            successCount++;
            if (updated[i].stages) {
              updated[i].stages.firestore = 'success';
            }
            updated[i].resultMessage = 'Synced';
          } else {
            let errorResult: any;
            try {
              errorResult = await safeJson(response);
            } catch (e) {
              errorResult = { error: await response.text().catch(() => 'Sync Failed') };
            }

            if (updated[i].stages) {
              updated[i].stages.firestore = 'failed';
            }
            
            if (response.status === 409) {
              updated[i].resultMessage = 'Ownership Conflict';
              if (updated[i].stages) updated[i].stages.dupCheck = 'duplicate';
              skippedCount++;
            } else {
              updated[i].resultMessage = errorResult.error || 'Sync Failed';
            }
          }
        } catch (err) {
          if (updated[i].stages) {
            updated[i].stages.firestore = 'failed';
          }
          updated[i].resultMessage = 'Network error';
        }
        setBulkResumes([...updated]);
        await new Promise(r => setTimeout(r, 150)); // aesthetic visual pace
      }'''

new_save = '''    for (let i = 0; i < updated.length; i++) {
        const cand = updated[i];
        if (cand.status === 'failed') {
          if (updated[i].resultMessage === 'Duplicate skipped') {
             skippedCount++;
          }
          continue;
        }

        if (cand.status === 'done') {
           successCount++;
        }
        
        await new Promise(r => setTimeout(r, 50)); // aesthetic visual pace
      }'''

content = content.replace(old_save, new_save)

with open('src/pages/Vendors.tsx', 'w') as f:
    f.write(content)
