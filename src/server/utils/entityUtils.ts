export function populateBaseFields(data: any, req: any) {
  const orgId = data.organizationId || req.headers['x-organization-id'] || (req.user ? req.user.organizationId : null);
  
  if (!orgId) {
    throw new Error("Validation Error: organizationId is required");
  }

  const userId = req.body.performedBy || req.headers['x-user-id'] || (req.user ? req.user.uid : null) || 'system';

  const now = new Date().toISOString();

  return {
    ...data,
    id: data.id || require("crypto").randomUUID(),
    organizationId: orgId,
    createdAt: data.createdAt || now,
    updatedAt: now,
    createdBy: data.createdBy || userId,
    updatedBy: userId,
    sourceApp: data.sourceApp || 'CRM',
    sourceWorkspace: data.sourceWorkspace || 'Admin',
    lastActivityAt: now,
  };
}

export function populateUpdateFields(data: any, req: any) {
  const userId = req.body.performedBy || req.headers['x-user-id'] || (req.user ? req.user.uid : null) || 'system';
  const now = new Date().toISOString();
  
  return {
    ...data,
    updatedAt: now,
    updatedBy: userId,
    lastActivityAt: now,
  };
}

export async function logEntityEvent(db: FirebaseFirestore.Firestore, eventType: string, entityType: string, entityId: string, req: any) {
  const userId = req.body.performedBy || req.headers['x-user-id'] || (req.user ? req.user.uid : null) || 'system';
  const event = {
    id: require("crypto").randomUUID(),
    type: eventType,
    entityType,
    entityId,
    performedBy: userId,
    timestamp: new Date().toISOString()
  };
  await db.collection("system_events").doc(event.id).set(event);
}
