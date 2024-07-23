import { Client as Client, Interaction } from "discord.js";
import { initializeNotify } from "./util/notify";
import * as dotenv from "dotenv";
import commands from "./command";
dotenv.config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const client = new Client({
  intents: [],
});

const startBot = async () => {
  await client.login(BOT_TOKEN);
  console.info("[SUCCESS] login success!");

  client.on("ready", async () => {
    if (client.application) {
      await client.application.commands.set(commands);
      console.info("[SUCCESS] slash commands registered!");
      await initializeNotify(client);
    }
  });

  client.on("interactionCreate", async (interaction: Interaction) => {
    if (interaction.isCommand()) {
      const currentCommand = commands.find(
        ({ name }) => name === interaction.commandName,
      );

      if (currentCommand) {
        await interaction.deferReply();
        currentCommand.execute(client, interaction);
        console.info(
          `[SUCCESS] command ${currentCommand.name} handled correctly`,
        );
      }
    }
  });
};

startBot();
