import { TextChannel, ThreadChannel, ChannelType } from "discord.js";

export async function createThread(
  channel: TextChannel,
  threadName: string,
): Promise<ThreadChannel> {
  try {
    let thread: ThreadChannel;

    // create thread
    thread = await channel.threads.create({
      name: threadName,
      type: ChannelType.PublicThread,
    });

    console.info(`[SUCCESS] Thread created: ${thread.name}`);
    return thread;
  } catch (error) {
    console.error("[ERROR] creating thread:", error);
    throw error;
  }
}

export async function deleteThread(thread: ThreadChannel): Promise<void> {
  try {
    // delete thread
    await thread.delete();
    
    console.info(`[SUCCESS] Thread deleted: ${thread.name}`);
  } catch (error) {
    console.error("[ERROR] deleting thread:", error);
    throw error;
  }
}
