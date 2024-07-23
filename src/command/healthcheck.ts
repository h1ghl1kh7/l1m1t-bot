import { SlashCommand } from "../type";
import { EmbedBuilder } from "discord.js";
import { sendMessage } from "../util";
import * as os from "os";

export const checkHealth: SlashCommand = {
  name: "healthcheck",
  description: "Check the health status of the bot",
  execute: async (client, interaction) => {
    try {
      // compute uptime
      const uptime = process.uptime();
      const uptimeString = formatUptime(uptime);

      // memory usage
      const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const totalMemory = os.totalmem() / 1024 / 1024;

      // check ping
      const ping = client.ws.ping;

      // number of connected servers
      const connectedServers = client.guilds.cache.size;

      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle("Health Check Results")
        .addFields(
          { name: "Uptime", value: uptimeString, inline: true },
          { name: "Ping", value: `${ping}ms`, inline: true },
          {
            name: "Memory Usage",
            value: `${usedMemory.toFixed(2)}MB / ${totalMemory.toFixed(2)}MB`,
            inline: true,
          },
          {
            name: "Connected Servers",
            value: connectedServers.toString(),
            inline: true,
          },
        )
        .setFooter({
          text: `Bot Version: v1.0.0 | Last Updated: ${new Date().toUTCString()}`,
        });

      await interaction.followUp({
        content: "🟢 Bot is online and healthy!",
        embeds: [embed],
      });
    } catch (error) {
      console.error("[ERROR] performing health check:", error);
      await sendMessage(
        interaction,
        "There was an error performing the health check. Please try again.",
      );
    }
  },
};

function formatUptime(uptime: number): string {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor(uptime / 3600) % 24;
  const minutes = Math.floor(uptime / 60) % 60;
  return `${days}d ${hours}h ${minutes}m`;
}
