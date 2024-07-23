import { ChannelType, CategoryChannel } from "discord.js";

export type ChannelOptions = {
  name: string;
  type: ChannelType;
  parent?: CategoryChannel;
};
