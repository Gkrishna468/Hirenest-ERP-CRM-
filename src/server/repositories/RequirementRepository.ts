import { BaseRepository } from "./BaseRepository";
import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class RequirementRepository extends BaseRepository<any> {
  protected collectionName = "requirements";
  protected entityType = "requirement";




  


}

export const requirementRepository = new RequirementRepository();
