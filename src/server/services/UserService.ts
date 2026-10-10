import { userRepository } from "../repositories/UserRepository";
import { DomainEventPublisher } from "../events/DomainEventPublisher";

export class UserService {
  async getById(id: string, includeArchived: boolean = false) {
    console.log(`[UserService] Fetching user by id: ${id} (includeArchived: ${includeArchived})`);
    const user = await userRepository.findById(id, includeArchived);
    if (!user) {
      console.log(`[UserService] User ${id} not found in repository`);
    } else {
      console.log(`[UserService] User ${id} found:`, { email: user.email, role: user.role });
    }
    return user;
  }
  
  async getByEmail(email: string, includeArchived: boolean = false) {
    return await userRepository.findByEmail(email, includeArchived);
  }

  async list(includeArchived: boolean = false) {
    return await userRepository.findAll(includeArchived);
  }

  async create(data: any, performedBy: string = 'System') {
    let authUid = data.id;
    const cleanData = { ...data };

    if (cleanData.temporaryPassword) {
      const tempPass = cleanData.temporaryPassword;
      delete cleanData.temporaryPassword; // Remove sensitive field before Firestore persistence
      
      // Enforce temporary credential lifecycle tracking flags
      cleanData.mustChangePassword = true;
      cleanData.passwordResetRequired = true;

      try {
        const { getAdminAuthClient } = require("../utils/firebaseAdmin");
        const adminAuth = getAdminAuthClient();
        console.log(`[UserService] Creating Firebase Auth user for ${cleanData.email}`);
        const userRecord = await adminAuth.createUser({
          email: cleanData.email,
          password: tempPass,
          displayName: cleanData.name,
        });
        authUid = userRecord.uid;
        cleanData.id = authUid; // Use the Firebase Auth UID as the Firestore document ID
      } catch (error: any) {
        console.error(`[UserService] Error creating Firebase Auth user:`, error.message);
        if (error.code === 'auth/email-already-exists') {
          console.log(`[UserService] Firebase Auth user already exists, binding UID`);
          const { getAdminAuthClient } = require("../utils/firebaseAdmin");
          const adminAuth = getAdminAuthClient();
          const userRecord = await adminAuth.getUserByEmail(cleanData.email);
          authUid = userRecord.uid;
          cleanData.id = authUid;
          if (tempPass) {
            await adminAuth.updateUser(authUid, { password: tempPass });
          }
        } else {
          throw error;
        }
      }
    }

    const user = await userRepository.create(cleanData, performedBy);
    
    // Ensure temporaryPassword is clean in returned object and event payload
    delete user.temporaryPassword;

    // Publish USER_CREATED event (sanitized)
    await DomainEventPublisher.publishDomainEvent({
      type: "USER_CREATED",
      aggregateType: "User",
      aggregateId: user.id || cleanData.id,
      organizationId: user.organizationId || cleanData.organizationId || "default",
      actorId: performedBy,
      actorRole: "Admin",
      sourceApp: "CRM",
      sourceWorkspace: "Admin",
      payload: {
        id: user.id || cleanData.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        status: user.status || 'active',
        workspace: user.workspace
      }
    });

    // If invited, publish USER_INVITED
    if (user.status === "invited" || cleanData.status === "invited") {
      await DomainEventPublisher.publishDomainEvent({
        type: "USER_INVITED",
        aggregateType: "User",
        aggregateId: user.id || cleanData.id,
        organizationId: user.organizationId || cleanData.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: {
          id: user.id || cleanData.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          status: user.status
        }
      });
    }
    return user;
  }

  async update(id: string, updates: any, performedBy: string = 'System') {
    const existing = await userRepository.findById(id);
    await userRepository.update(id, updates, performedBy);
    const updated = await userRepository.findById(id);

    if (updated) {
      if (updates.status === "active" && (!existing || existing.status !== "active")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "USER_ACTIVATED",
          aggregateType: "User",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      } else if (updates.status === "disabled" && (!existing || existing.status !== "disabled")) {
        await DomainEventPublisher.publishDomainEvent({
          type: "USER_DISABLED",
          aggregateType: "User",
          aggregateId: id,
          organizationId: updated.organizationId || "default",
          actorId: performedBy,
          actorRole: "Admin",
          sourceApp: "CRM",
          sourceWorkspace: "Admin",
          payload: updated
        });
      }
    }
  }

  async delete(id: string, performedBy: string = 'System') {
    const user = await userRepository.findById(id);
    await userRepository.archive(id, performedBy);
    if (user) {
      await DomainEventPublisher.publishDomainEvent({
        type: "USER_DISABLED",
        aggregateType: "User",
        aggregateId: id,
        organizationId: user.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: { id, deleted: true }
      });
    }
  }

  async restore(id: string, performedBy: string = 'System') {
    const user = await userRepository.findById(id, true);
    if (user) {
      const { getAdminDb } = require("../utils/firebaseAdmin");
      await getAdminDb().collection("users").doc(id).update({
        deleted: false,
        status: "active",
        updatedAt: new Date().toISOString()
      });
      await DomainEventPublisher.publishDomainEvent({
        type: "USER_ACTIVATED",
        aggregateType: "User",
        aggregateId: id,
        organizationId: user.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: { id, deleted: false, status: "active" }
      });
    }
  }
}

export const userService = new UserService();

