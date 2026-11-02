import { ApiError, getMe, getPost } from "./api";

export async function getOwnedPost(postId: number) {
  const user = await getMe();
  const post = await getPost(postId);

  if (post.author.id !== user.id) {
    throw new ApiError(403, "FORBIDDEN", "Você não tem permissão para este post.");
  }

  return post;
}
