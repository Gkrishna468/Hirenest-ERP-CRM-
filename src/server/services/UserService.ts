import { userRepository } from "../repositories/UserRepository";
import { DomainEventPublisher } from "../events/DomainEventPublisher";

export class UserService {
  async getById(id: string) {
    console.log(`[UserService] Fetching user by id: ${id}`);
    const user = await userRepository.findById(id);
    if (!user) {
      console.log(`[UserService] User ${id} not found in repository`);
    } else {
      console.log(`[UserService] User ${id} found:`, { email: user.email, role: user.role });
    }
    return user;
  }
  
  async getByEmail(email: string) {
    return await userRepository.findByEmail(email);
  }

  async list() {
    return await userRepository.findAll();
  }

  async create(data: any, performedBy: string = 'System') {
    let authUid = data.id;

    if (data.temporaryPassword) {
      try {
        const { getAdminAuthClient } = require("../utils/firebaseAdmin");
        const adminAuth = getAdminAuthClient();
        console.log(`[UserService] Creating Firebase Auth user for ${data.email}`);
        const userRecord = await adminAuth.createUser({
          email: data.email,
          password: data.temporaryPassword,
          displayName: data.name,
        });
        authUid = userRecord.uid;
        data.id = authUid; // Use the Firebase Auth UID as the Firestore document ID
      } catch (error: any) {
        console.error(`[UserService] Error creating Firebase Auth user:`, error);
        if (error.code === 'auth/email-already-exists') {
          console.log(`[UserService] Firebase Auth user already exists, using email lookup`);
          const { getAdminAuthClient } = require("../utils/firebaseAdmin");
          const adminAuth = getAdminAuthClient();
          const userRecord = await adminAuth.getUserByEmail(data.email);
          authUid = userRecord.uid;
          data.id = authUid;
          if (data.temporaryPassword) {
            await adminAuth.updateUser(authUid, { password: data.temporaryPassword });
          }
        } else {
          throw error;
        }
      }
    }

    const user = await userRepository.create(data, performedBy);
    
    // Publish USER_CREATED
    await DomainEventPublisher.publishDomainEvent({
      type: "USER_CREATED",
      aggregateType: "User",
      aggregateId: user.id || data.id,
      organizationId: user.organizationId || data.organizationId || "default",
      actorId: performedBy,
      actorRole: "Admin",
      sourceApp: "CRM",
      sourceWorkspace: "Admin",
      payload: user
    });

    // If invited, publish USER_INVITED
    if (user.status === "invited" || data.status === "invited") {
      await DomainEventPublisher.publishDomainEvent({
        type: "USER_INVITED",
        aggregateType: "User",
        aggregateId: user.id || data.id,
        organizationId: user.organizationId || data.organizationId || "default",
        actorId: performedBy,
        actorRole: "Admin",
        sourceApp: "CRM",
        sourceWorkspace: "Admin",
        payload: user
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
}

export const userService = new UserService();

