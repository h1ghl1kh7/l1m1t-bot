import {
  ApplicationCommandOptionType,
  ChannelType,
  Guild,
  CategoryChannel,
  EmbedBuilder,
  Client,
  CommandInteraction,
} from "discord.js";
import { SlashCommand, CategoryLabels } from "../type";
import {
  createChannel,
  deleteChannels,
  getChannelByName,
  getChannelById,
  parseTime,
  formatDate,
  sendMessage,
  checkServerExists,
  registerNotify,
} from "../util";
import { DatabaseManager } from "../db";

export const registerCTF: SlashCommand = {
  name: "addctf",
  description: "register ctf",
  options: [
    {
      required: true,
      name: "name",
      description: "Name of the CTF",
      type: ApplicationCommandOptionType.String,
    },
    {
      required: true,
      name: "start",
      description: "Start date and time (Format: YY/MM/DD:HH e.g. 24/09/21:18)",
      type: ApplicationCommandOptionType.String,
    },
    {
      required: true,
      name: "end",
      description: "End date and time (Format: YY/MM/DD:HH e.g. 24/09/22:18)",
      type: ApplicationCommandOptionType.String,
    },
  ],
  execute: async (_: Client, interaction: CommandInteraction) => {
    // check server exists
    const guild = interaction.guild as Guild;
    if (!guild) {
      await sendMessage(
        interaction,
        "This command can only be used in a server.",
      );
      return;
    }
    if (!checkServerExists(guild)) {
      sendMessage(
        interaction,
        "Something went wrong.\nThis server is not registered.",
      );
      return;
    }

    // get args
    const name = interaction.options.get("name")?.value;
    const startValue = interaction.options.get("start")?.value as
      | string
      | undefined;
    const endValue = interaction.options.get("end")?.value as
      | string
      | undefined;
    if (!name || !startValue || !endValue) {
      await sendMessage(interaction, "all fields are required.");
      return;
    }

    // parse time
    const start: Date | undefined = parseTime(startValue);
    const end: Date | undefined = parseTime(endValue);
    if (!start || !end) {
      await sendMessage(interaction, "Invalid date format.");
      return;
    }
    if (start > end) {
      await sendMessage(interaction, "Start time must be before end time.");
      return;
    }
    const startString =
      start instanceof Date ? formatDate(start) : String(start);
    const endString = end instanceof Date ? formatDate(end) : String(end);

    // check ctf already exists
    const dbManager = DatabaseManager.getInstance();
    if (dbManager.getCTFByName(guild.id, name as string)) {
      await sendMessage(interaction, "CTF already exists.");
      return;
    }

    try {
      // create the ctfChannel
      const ctfChannel = (await createChannel(guild, {
        name: `${name}`,
        type: ChannelType.GuildCategory,
      })) as CategoryChannel;
      console.info(`[SUCCESS] ${name} CTF registered. ID: ${ctfChannel.id}`);

      // create categoryChannels within the ctf
      const channelNames = ["announcements", "general"];
      for (const channelName of channelNames) {
        const tmpCategoryChannel = await createChannel(guild, {
          name: channelName,
          type: ChannelType.GuildText,
          parent: ctfChannel,
        });
        if (
          channelName === "announcements" &&
          tmpCategoryChannel.type === ChannelType.GuildText
        ) {
          // send message to announcement channel
          await tmpCategoryChannel.send(
            "🏆 **CTF Registered Successfully!** 🏆",
          );
          // register CTF DB
          dbManager.createCTF(
            guild.id as string,
            tmpCategoryChannel.id as string,
            ctfChannel.id as string,
            name as string,
            start,
            end,
          );
          // register CTF notification
          registerNotify(
            guild,
            name as string,
            start.toISOString(),
            end.toISOString(),
          );
        }
      }
      for (const channelName of CategoryLabels) {
        const tmpCategoryChannel = await createChannel(guild, {
          name: channelName,
          type: ChannelType.GuildText,
          parent: ctfChannel,
        });

        dbManager.createCategory(
          guild.id,
          tmpCategoryChannel.id,
          channelName as string,
          ctfChannel.id,
        );
      }
      await createChannel(guild, {
        name: "voice",
        type: ChannelType.GuildVoice,
        parent: ctfChannel,
      });
      console.info("[SUCCESS] Categories registered.");

      // send announcement
      const content: string = `
📌 **CTF Name:** ${name}
🕐 **Start Time:** ${startString}
🏁 **End Time:** ${endString}

━━━━━━━━━ Commands ━━━━━━━━━
\`/addchal\` - Add a new challenge
\`/delchal\` - Delete a new challenge
\`/solved\` - Mark a challenge as solved
\`/chals\` - List all challenges

━━━━━━━━━ To-Do List ━━━━━━━━━
✅ Add account information here
   • Team ID: ??
   • Team Password: ??
   • Use One Account: True | False
✅ Review CTF rules and guidelines

🚀 Good luck and have fun! May your exploits be successful! 🚀
`.trim();
      const channel = await getChannelByName(guild, `${name}`, "announcements");
      if (channel) {
        await channel.send(content);
      }

      // send CTF registration info
      await interaction.followUp({
        ephemeral: true,
        embeds: [
          new EmbedBuilder()
            .setColor(0x00ff00) // 녹색
            .setTitle("🏆 CTF Registration Successful!")
            .setDescription(`**${name}** has been successfully registered.`)
            .addFields(
              { name: "📅 Event Name", value: String(name), inline: true },
              { name: "🕐 Start Time", value: startString, inline: true },
              { name: "🏁 End Time", value: endString, inline: true },
            )
            .setFooter({ text: "Good luck and have fun!" })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      console.error("[ERROR] creating CTF category and channels:", error);
      await sendMessage(
        interaction,
        "There was an error creating the CTF category and channels. Please try again.",
      );
    }
  },
};

export const deleteCTF: SlashCommand = {
  name: "delctf",
  description: "delete ctf",
  options: [
    {
      required: true,
      name: "name",
      description: "ctf name",
      type: ApplicationCommandOptionType.String,
    },
  ],
  execute: async (_: Client, interaction: CommandInteraction) => {
    // check server exists
    const guild = interaction.guild as Guild;
    if (!guild) {
      await sendMessage(
        interaction,
        "This command can only be used in a server.",
      );
      return;
    }
    if (!checkServerExists(guild)) {
      sendMessage(
        interaction,
        "Something went wrong.\nThis server is not registered.",
      );
      return;
    }

    // get arg
    const name = interaction.options.get("name")?.value;
    if (!guild) {
      await sendMessage(
        interaction,
        "This command can only be used in a server.",
      );
      return;
    }

    const dbManager = DatabaseManager.getInstance();

    // check ctf exists
    const ctf = dbManager.getCTFByName(guild.id, name as string);
    if (!ctf) {
      await sendMessage(interaction, "CTF not found.");
      return;
    }

    try {
      // delete Channels
      await deleteChannels(guild, `${name}`);

      dbManager.deleteCTF(guild.id, ctf.id);

      const content: string = `🗑️ CTF **${name}** has been successfully deleted.`;
      if (await getChannelById(guild, interaction.channelId)) {
        await sendMessage(interaction, content);
        return;
      } else {
        return;
      }
    } catch (error) {
      console.error("[ERROR] deleting CTF category and channels:", error);
      await sendMessage(
        interaction,
        "There was an error deleting the CTF category and channels. Please try again.",
      );
    }
  },
};

export const listCTF: SlashCommand = {
  name: "ctfs",
  description: "list ctf",
  execute: async (_: Client, interaction: CommandInteraction) => {
    // check server exists
    const guild = interaction.guild as Guild;
    if (!guild) {
      await sendMessage(
        interaction,
        "This command can only be used in a server.",
      );
      return;
    }
    if (!checkServerExists(guild)) {
      sendMessage(
        interaction,
        "Something went wrong.\nThis server is not registered.",
      );
      return;
    }

    // check ctfs exists
    const dbManager = DatabaseManager.getInstance();
    const ctfs = dbManager.getCTFs(guild.id);

    if (ctfs.length === 0) {
      sendMessage(interaction, "No CTFs found.");
      return;
    }

    try {
      // send list of ctfs
      const embed = new EmbedBuilder()
        .setColor("#0099ff")
        .setTitle("CTF List")
        .setDescription(`Showing CTFs (${ctfs.length})`);

      ctfs.forEach((ctf) => {
        const stats = dbManager.getCTFStats(guild.id, ctf.id.toString());
        embed.addFields({
          name: ctf.name,
          value: `Date: ${formatDate(new Date(ctf.start))} ~ ${formatDate(new Date(ctf.end))}\nChallenges: ${stats.total_challenges} | Solved: ${stats.solved_challenges}`,
        });
      });

      await interaction.followUp({
        embeds: [embed],
      });
    } catch (error) {
      console.error("[ERROR] listing CTF category and channels:", error);
      await sendMessage(
        interaction,
        "There was an error listing the CTF category and channels. Please try again.",
      );
    }
  },
};
