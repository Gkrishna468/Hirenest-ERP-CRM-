import { BaseRepository } from "./BaseRepository";

export class DealRepository extends BaseRepository<any> {
  protected collectionName = "placements";
  protected entityType = "placement";
}

export const dealRepository = new DealRepository();
