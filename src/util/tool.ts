import {
  Guild,
  ChannelType,
  TextChannel,
  CategoryChannel,
  ThreadChannel,
  CommandInteraction,
} from "discord.js";

import { DatabaseManager } from "../db";

export async function getChannelByName(
  guild: Guild,
  categoryName: string,
  channelName: string,
): Promise<TextChannel | undefined> {
  try {
    const channels = await guild.channels.fetch();

    // find category
    const category = channels.find(
      (ch) =>
        ch?.type === ChannelType.GuildCategory && ch?.name === categoryName,
    );

    if (!category) {
      console.info(`[FAIL] Category "${categoryName}" not found`);
      return;
    }

    // find channel in category
    const channel = channels.find(
      (ch) =>
        ch?.type === ChannelType.GuildText &&
        ch?.name === channelName &&
        ch?.parentId === category.id,
    ) as TextChannel | undefined;

    if (!channel) {
      console.info(
        `[FAIL] ${channelName} channel not found in category "${categoryName}"`,
      );
      return undefined;
    }

    return channel;
  } catch (error) {
    console.error(`[ERROR] getting channel by name: ${error}`);
    throw error;
  }
}

export async function getCTFByName(
  guild: Guild,
  categoryName: string,
): Promise<CategoryChannel> {
  try {
    const channels = await guild.channels.fetch();

    // find category (CTF) with name
    const category = channels.find(
      (ch) =>
        ch?.type === ChannelType.GuildCategory && ch?.name === categoryName,
    );
    return category as CategoryChannel;
  } catch (error) {
    console.error(`[ERROR] getting category by name: ${error}`);
    throw error;
  }
}

export async function getCTFById(
  guild: Guild,
  channelId: string,
): Promise<CategoryChannel | undefined> {
  try {
    const channels = await guild.channels.fetch();

    // find category (CTF) with id
    const channel = channels.find(
      (ch) => ch?.type === ChannelType.GuildText && ch?.id === channelId,
    ) as TextChannel | undefined;

    if (channel) {
      return channel.parent as CategoryChannel;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error(`[ERROR] getting category by id: ${error}`);
    throw error;
  }
}

export async function getChannelById(
  guild: Guild,
  channelId: string,
): Promise<CategoryChannel | TextChannel | undefined> {
  try {
    const channels = await guild.channels.fetch();

    // find channel with id
    const channel = channels.find((ch) => ch?.id === channelId);

    if (channel) {
      return channel as CategoryChannel | TextChannel;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error(`[ERROR] getting channel by id: ${error}`);
    throw error;
  }
}

export async function getThreadById(
  guild: Guild,
  threadId: string,
): Promise<ThreadChannel | undefined> {
  try {
    const threads = await guild.channels
      .fetchActiveThreads()
      .then((threads) => {
        return threads.threads;
      });

    // find thread with id
    const thread = threads.find((th: ThreadChannel) => th?.id === threadId);
    if (thread) {
      return thread as ThreadChannel;
    } else {
      return undefined;
    }
  } catch (error) {
    console.error(`[ERROR] getting channel by id: ${error}`);
    throw error;
  }
}

export async function sendMessage(
  interation: CommandInteraction,
  content: string,
) {
  try {
    // send message snippet
    await interation.followUp({
      ephemeral: true,
      content: content,
    });
  } catch (error) {
    console.error(`[ERROR] sending message: ${error}`);
    throw error;
  }
}

export async function checkServerExists(guild: Guild): Promise<boolean> {
  // check server exists in db and create if not 
  const dbManager = DatabaseManager.getInstance();
  const result = dbManager.getServerById(guild.id);
  if (result) {
    return true;
  }
  await guild.fetch();
  if (guild?.id && guild?.name) {
    dbManager.createServer(guild.id, guild.name);
    return true;
  } else {
    return false;
  }
}
