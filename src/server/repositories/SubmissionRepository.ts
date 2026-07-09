import { BaseRepository } from "./BaseRepository";
import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class SubmissionRepository extends BaseRepository<any> {
  protected collectionName = "submissions";
  protected entityType = "submission";




  


}

export const submissionRepository = new SubmissionRepository();
