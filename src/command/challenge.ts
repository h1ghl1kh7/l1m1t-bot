import {
  ApplicationCommandOptionType,
  Guild,
  EmbedBuilder,
  Client,
  CommandInteraction,
} from "discord.js";
import { SlashCommand, CategoryLabels, Challenge } from "../type";
import { DatabaseManager } from "../db";
import {
  getChannelById,
  getChannelByName,
  getCTFById,
  createThread,
  deleteThread,
  getThreadById,
  sendMessage,
  checkServerExists,
} from "../util";

export const registerChallenge: SlashCommand = {
  name: "addchal",
  description: "add challenge",
  options: [
    {
      required: true,
      name: "category",
      description: "challenge category",
      type: ApplicationCommandOptionType.String,
    },
    {
      required: true,
      name: "name",
      description: "challenge name",
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
    const categoryName = interaction.options.get("category")?.value;
    const challengeName = interaction.options.get("name")?.value;

    if (!CategoryLabels.includes(categoryName as string)) {
      await sendMessage(
        interaction,
        "Invalid category. Please use one of the following: pwn, rev, web, crypto, misc, web3.",
      );
      return;
    }

    // check in channel
    if (!getChannelById(guild, interaction.channelId)) {
      await sendMessage(interaction, "no Channel found.");
      return;
    }

    // check in ctf
    const ctfChannel = await getCTFById(guild, interaction.channelId);
    if (!ctfChannel) {
      await sendMessage(interaction, "no CTF found.");
      return;
    }

    // check category exists
    const categoryChannel = await getChannelByName(
      guild,
      ctfChannel.name as string,
      categoryName as string,
    );
    if (!categoryChannel) {
      await sendMessage(interaction, "no Category found.");
      return;
    }

    try {
      // create challenge thread
      const challengeChannel = await createThread(
        categoryChannel,
        `${challengeName}`,
      );
      const dbManager = DatabaseManager.getInstance();
      dbManager.createChallenge(
        guild.id,
        challengeChannel.id,
        challengeName as string,
        ctfChannel.id,
        categoryChannel.id,
      );

      await sendMessage(
        interaction,
        `✅ **${categoryName} - ${challengeName}** registered.`,
      );
    } catch (error) {
      console.error("[ERROR] creating CTF category and channels:", error);
      await sendMessage(
        interaction,
        "There was an error creating the CTF category and channels. Please try again.",
      );
    }
  },
};

export const checkSolved: SlashCommand = {
  name: "solved",
  description: "mark challenge solved",
  options: [
    {
      required: true,
      name: "flag",
      description: "flag",
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
    const flag = interaction.options.get("flag")?.value;
    if (!flag) {
      await sendMessage(interaction, "Invalid flag. Please provide a flag.");
      return;
    }

    // check in thread
    const challengeChannel = await getThreadById(guild, interaction.channelId);
    if (!challengeChannel) {
      await sendMessage(
        interaction,
        "Please run this command in a challenge thread.",
      );
      return;
    }

    // check challenge is not solved
    if (challengeChannel.name.startsWith("✓-")) {
      await sendMessage(
        interaction,
        "This challenge is already marked as solved.",
      );
      return;
    }

    try {
      // mark solved
      const dbManager = DatabaseManager.getInstance();
      dbManager.markChallengeSolved(
        guild.id,
        challengeChannel.id,
        flag as string,
      );

      // rename thread
      await challengeChannel.setName(`✓-${challengeChannel.name}`);
      await sendMessage(
        interaction,
        "Marked the challenge as solved, good job!",
      );
    } catch (error) {
      console.error("[ERROR] marking the challenge as solved:", error);
      await sendMessage(
        interaction,
        "There was an error marking the challenge as solved. Please try again.",
      );
    }
  },
};

export const listChallenges: SlashCommand = {
  name: "chals",
  description: "list all challenges",
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

    // check in channel
    const categoryChannel = await getChannelById(guild, interaction.channelId);
    if (!categoryChannel) {
      await sendMessage(interaction, "no Channel found.");
      return;
    }

    // check in ctf
    const ctfChannel = await getCTFById(guild, interaction.channelId);
    if (!ctfChannel) {
      await sendMessage(interaction, "no CTF found.");
      return;
    }

    try {
      const dbManager = DatabaseManager.getInstance();

      const createChallengeEmbed = (title: string, challenges: Challenge[]) => {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(title)
          .setDescription(`Showing Challenges (${challenges.length})`);

        challenges.forEach((challenge) => {
          const categoryDb = dbManager.getCategoryById(
            challenge.serverId,
            challenge.categoryId,
          );
          embed.addFields({
            name: `${categoryDb.name} - ${challenge.name}`,
            value: `${challenge.solved === 1 ? "✅ Solved" : "❌ Unsolved"}${challenge.flag ? `\n**${challenge.flag}**` : ""}`,
            inline: true,
          });
        });

        return embed;
      };

      const createChallengeEmbedCategory = (
        title: string,
        challenges: any[],
      ) => {
        const embed = new EmbedBuilder()
          .setColor("#0099ff")
          .setTitle(title)
          .setDescription(`Showing Challenges (${challenges.length})`);

        challenges.forEach((challenge) => {
          embed.addFields({
            name: challenge.name,
            value: `${challenge.solved === 1 ? "✅ Solved" : "❌ Unsolved"}${challenge.flag ? `\n**${challenge.flag}**` : ""}`,
            inline: true,
          });
        });

        return embed;
      };

      // send list of challenges
      if (CategoryLabels.includes(categoryChannel.name as string)) {
        const categoryChallenges = dbManager.getCategoryChallenges(
          guild.id,
          ctfChannel.id,
          categoryChannel.id,
        );
        const embed = createChallengeEmbedCategory(
          `Challenge List - ${categoryChannel.name}`,
          categoryChallenges,
        );

        await interaction.followUp({ embeds: [embed] });
      } else {
        const ctfChallenges = dbManager.getCTFChallenges(
          guild.id,
          ctfChannel.id,
        );
        const embed = createChallengeEmbed("CHallenge List", ctfChallenges);

        await interaction.followUp({ embeds: [embed] });
      }
    } catch (error) {
      console.error("[ERROR] marking the challenge as solved:", error);
      await sendMessage(
        interaction,
        "There was an error marking the challenge as solved. Please try again.",
      );
    }
  },
};

export const delChallenge: SlashCommand = {
  name: "delchal",
  description: "delete challenge",
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

    // check in thread
    const challengeChannel = await getThreadById(guild, interaction.channelId);
    if (!challengeChannel) {
      await sendMessage(
        interaction,
        "Please run this command in a challenge thread.",
      );
      return;
    }

    try {
      const dbManager = DatabaseManager.getInstance();
      dbManager.deleteChallenge(guild.id, challengeChannel.id);
      deleteThread(challengeChannel);
    } catch (error) {
      console.error("[ERROR] marking the challenge as solved:", error);
      await sendMessage(
        interaction,
        "There was an error marking the challenge as solved. Please try again.",
      );
    }
  },
};
