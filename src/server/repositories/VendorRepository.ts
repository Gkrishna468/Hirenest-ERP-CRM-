import { BaseRepository } from "./BaseRepository";
import { Firestore, Transaction } from "firebase-admin/firestore";
import { getAdminDb } from "../utils/firebaseAdmin";

export class VendorRepository extends BaseRepository<any> {
  protected collectionName = "vendors";
  protected entityType = "vendor";




  


}

export const vendorRepository = new VendorRepository();
