import { IInstagramService } from "./IInstagramService";
import { NullInstagramService } from "./NullInstagramService";
import { InstagramMediaService } from "./InstagramMediaService";
import { InstagramMediaCache } from "./InstagramMediaCache";

let instagramService: IInstagramService = new NullInstagramService();

export function setInstagramService(service: IInstagramService) {
  instagramService = service;
}

export function createRealInstagramService(): IInstagramService {
  return new InstagramMediaCache(new InstagramMediaService());
}

export { instagramService };