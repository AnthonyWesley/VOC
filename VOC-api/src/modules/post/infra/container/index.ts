import { prisma } from "../../../../package/prisma";
import { PrismaUserRepository } from "../../../identity/domain/repositories/PrismaUserRepository";
import { PrismaPostRepository } from "../../domain/repositories/PrismaPostRepository";
import { CreatePostUseCase } from "../../usecases/CreatePostUseCase";
import { DeletePostUseCase } from "../../usecases/DeletePostUseCase";
import { GetPostUseCase } from "../../usecases/GetPostUseCase";
import { GetPublicPostUseCase } from "../../usecases/GetPublicPostUseCase";
import { ListPostsUseCase } from "../../usecases/ListPostsUseCase";
import { ListPublicPostsUseCase } from "../../usecases/ListPublicPostsUseCase";
import { PublishPostUseCase } from "../../usecases/PublishPostUseCase";
import { ArchivePostUseCase } from "../../usecases/ArchivePostUseCase";
import { UpdatePostUseCase } from "../../usecases/UpdatePostUseCase";
import { PostController } from "../controllers/PostController";

const postRepository = new PrismaPostRepository(prisma);
const userRepository = new PrismaUserRepository(prisma);

const create = new CreatePostUseCase(postRepository);
const update = new UpdatePostUseCase(postRepository, userRepository);
const remove = new DeletePostUseCase(postRepository, userRepository);
const publish = new PublishPostUseCase(postRepository, userRepository);
const archive = new ArchivePostUseCase(postRepository, userRepository);
const list = new ListPostsUseCase(postRepository, userRepository);
const get = new GetPostUseCase(postRepository, userRepository);
const getPublic = new GetPublicPostUseCase(postRepository);
const listPublic = new ListPublicPostsUseCase(postRepository);

export const postController = new PostController(
  create,
  update,
  remove,
  publish,
  archive,
  get,
  list,
  getPublic,
  listPublic,
);
