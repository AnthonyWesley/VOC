import { prisma } from "../../../../package/prisma";
import { SiteContentController } from "../SiteContentController";
import { SiteContentRepository } from "../SiteContentRepository";

const repository = new SiteContentRepository(prisma);

export const siteContentController = new SiteContentController(repository);
