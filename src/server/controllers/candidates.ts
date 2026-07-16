import { candidateIngestionService } from "../services/CandidateIngestionService";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: { message: "Method not allowed" } });
  }

  const { action } = req.query;

  try {
    if (action === "submitVendorCandidate") {
      const { candidateHash, vendorId, candidateName, requirementId, identityData } = req.body;
      if (!vendorId || !candidateName) {
        return res.status(400).json({ success: false, error: { message: "Missing required fields" } });
      }
      const result = (await candidateIngestionService.submitCandidateToRequirement(vendorId, candidateName, requirementId, identityData, candidateHash)) as any;
      return res.status(result.status).json(result.data);
    } 
    
    if (action === "submitVendorCandidatePool") {
      const { vendorId, candidateName, identityData, resumeHash } = req.body;
      if (!vendorId || !candidateName) {
        return res.status(400).json({ success: false, error: { message: "Missing required fields" } });
      }
      const result = (await candidateIngestionService.submitToPool(vendorId, candidateName, identityData, resumeHash)) as any;
      return res.status(result.status).json(result.data);
    } 
    
    if (action === "reprocessAiQueue") {
      const result = await candidateIngestionService.reprocessAiQueue();
      return res.status(200).json(result);
    } 
    
    if (action === "triggerAiRotation") {
      const { vendorId } = req.body;
      if (!vendorId) {
        return res.status(400).json({ success: false, error: { message: "Missing vendorId" } });
      }
      const result = await candidateIngestionService.triggerAiRotation(vendorId);
      return res.status(200).json(result);
    } 
    
    if (action === "validateCandidates") {
      const { candidateIds, vendorId } = req.body;
      if (!Array.isArray(candidateIds) || !vendorId) {
        return res.status(400).json({ success: false, error: { message: "Missing candidateIds or vendorId" } });
      }
      const result = await candidateIngestionService.validateCandidates(candidateIds, vendorId);
      return res.status(200).json(result);
    }

    return res.status(400).json({ success: false, error: { message: "Invalid action" } });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ success: false, error: { message: e.message } });
  }
}
