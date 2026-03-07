import { getQueue, removeFromQueue, type QueuedMutation } from "./offlineQueue";

type MutationExecutor = (path: string, input: unknown) => Promise<unknown>;

export async function flushMutationQueue(
  executor: MutationExecutor
): Promise<{ flushed: number; failed: number }> {
  const queue = await getQueue();
  let flushed = 0;
  let failed = 0;

  for (const mutation of queue) {
    try {
      await executor(mutation.mutationPath, mutation.input);
      await removeFromQueue(mutation.id);
      flushed++;
    } catch {
      failed++;
      break; // Stop on first failure to preserve ordering
    }
  }

  return { flushed, failed };
}
