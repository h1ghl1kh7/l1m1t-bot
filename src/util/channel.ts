import {
  Guild,
  ChannelType,
  TextChannel,
  VoiceChannel,
  CategoryChannel,
  GuildChannelCreateOptions,
} from "discord.js";
import { ChannelOptions } from "../type";

export async function createChannel(
  guild: Guild,
  options: ChannelOptions,
): Promise<TextChannel | VoiceChannel | CategoryChannel> {
  try {
    // create channel with options
    const channel = await guild.channels.create({
      name: options.name,
      type: options.type,
      parent: options.parent,
    } as GuildChannelCreateOptions);

    console.info(`[SUCCESS] > Channel ${channel.name} created successfully`);
    return channel;
  } catch (error) {
    console.error(`[ERROR] Error creating channel: ${error}`);
    throw error;
  }
}

export async function deleteChannels(
  guild: Guild,
  categoryName: string,
): Promise<void> {
  try {
    const channels = await guild.channels.fetch();

    // get category
    const category = channels.find(
      (ch: any) =>
        ch?.type === ChannelType.GuildCategory && ch?.name === categoryName,
    ) as CategoryChannel | undefined;

    if (!category) {
      console.info(`[FAIL] Category "${categoryName}" not found`);
      return;
    }

    console.info(
      `[SUCCESS] All channels in category "${categoryName}" have been deleted`,
    );

    // get channels under category
    const channelsToDelete = channels.filter(
      (ch: any) => ch?.parent?.id === category.id,
    );

    // delete channels
    for (const [, channel] of channelsToDelete) {
      if (channel) {
        await channel.delete();
      }
    }

    // delete category
    await category.delete();
    console.info(`[SUCCESS] Category "${categoryName}" has been deleted`);
  } catch (error) {
    console.error(`[ERROR] Error deleting channels: ${error}`);
    throw error;
  }
}
