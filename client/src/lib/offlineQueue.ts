import { get, set, del } from "idb-keyval";

const QUEUE_KEY = "offline-mutation-queue";

export type QueuedMutation = {
  id: string;
  mutationPath: string;
  input: unknown;
  timestamp: number;
};

async function getQueue(): Promise<QueuedMutation[]> {
  return (await get<QueuedMutation[]>(QUEUE_KEY)) ?? [];
}

async function setQueue(queue: QueuedMutation[]): Promise<void> {
  await set(QUEUE_KEY, queue);
}

export async function queueMutation(
  mutationPath: string,
  input: unknown
): Promise<void> {
  const queue = await getQueue();
  queue.push({
    id: crypto.randomUUID(),
    mutationPath,
    input,
    timestamp: Date.now(),
  });
  await setQueue(queue);
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  await setQueue(queue.filter(m => m.id !== id));
}

export async function clearQueue(): Promise<void> {
  await del(QUEUE_KEY);
}

export async function getQueueLength(): Promise<number> {
  return (await getQueue()).length;
}

export { getQueue };
