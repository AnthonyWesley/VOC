import { Request, Response } from "express";
import { instagramService } from "../../../../infra/instagram/instagramContainer";

export class InstagramController {
  async listPublic(_request: Request, response: Response): Promise<Response> {
    const result = await instagramService.fetchRecentMedia();
    return response.status(200).json(result);
  }
}