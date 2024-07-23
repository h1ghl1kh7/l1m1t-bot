import { Client, Guild, TextChannel } from "discord.js";
import { formatDate, getChannelById } from "../util";
import { NotifyMessages, NotifyTerms } from "../type";
import schedule from "node-schedule";
import { DatabaseManager } from "../db";

function scheduleRegister(
  guild: Guild,
  ctfName: string,
  message: string,
  date: Date,
  term: string,
): void {
  schedule.scheduleJob(date, async () => {
    try {
      const serverId = guild.id;
      const dbManager = DatabaseManager.getInstance();

      // check ctf exists
      const ctfDb = dbManager.getCTFByName(serverId, ctfName);
      if (!ctfDb) {
        console.error("[ERROR] CTF not found.");
        return;
      }
      
      // check channel exists
      const channel = await getChannelById(guild, ctfDb.announcementId);
      if (channel && channel instanceof TextChannel) {
        console.info(`[INFO] : ${formatDate(date)} ${term} event fired.`);
        
        // send notification message
        await channel.send(message);
        return;
      } else {
        console.error("[ERROR] Channel not found.");
        return;
      }
    } catch (error) {
      console.error("[ERROR] scheduleRegister:", error);
    }
  });

  console.info(`[INFO] ${formatDate(date)} ${term} event registered.`);
}

export function registerNotify(
  guild: Guild,
  ctfName: string,
  startTime: string,
  endTime: string,
): void {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const currentDate = new Date();
  const endTenMinutesBefore = new Date(endDate.getTime() - 10 * 60000);
  const endOneHourBefore = new Date(endDate.getTime() - 60 * 60000);
  const startOneHourBefore = new Date(startDate.getTime() - 60 * 60000);
  const timeTable = [
    endDate,
    endTenMinutesBefore,
    endOneHourBefore,
    startOneHourBefore,
    startDate,
  ];
  var depth: number = 0;

  if (endDate < currentDate) {
    console.info("[INFO] CTF already ended.");
    depth = 0;
  } else if (endTenMinutesBefore < currentDate) {
    // End ~ End 10 minutes before -> The CTF is almost over.
    console.info("[INFO] CTF End ~ End 10 minutes before.");
    depth = 1;
  } else if (endOneHourBefore < currentDate) {
    // End 10 mitues before ~ End 1 hour before
    console.info("[INFO] CTF End 10 minutes before ~ End 1 hour before.");
    depth = 2;
  } else if (startDate < currentDate) {
    // Start ~ End 1 hour before
    console.info("[INFO] CTF Start ~ End 1 hour before.");
    depth = 3;
  } else if (startOneHourBefore < currentDate) {
    // Start 1 hour before ~ Start
    console.info("[INFO] CTF Start 1 hour before ~ Start.");
    depth = 4;
  } else {
    // Start 1 hour before
    console.info("[INFO] CTF ready (1+a hour left).");
    depth = 5;
  }

  for (let idx = 0; idx < depth; idx++) {
    scheduleRegister(
      guild,
      ctfName,
      NotifyMessages[idx],
      timeTable[idx],
      NotifyTerms[idx],
    );
  }
}

export async function initializeNotify(client: Client): Promise<void> {
  // register notifications saved in database
  const dbManager = DatabaseManager.getInstance();
  try {
    const guilds = await client.guilds.fetch();
    for (const [snowflake, oauth2Guild] of guilds) {
      console.info("[INFO] Guild ID:", snowflake);

      const guild = await oauth2Guild.fetch();
      console.info("[INFO] > Guild Name:", guild.name);

      const guildDb = dbManager.getServerById(guild.id);
      if (guildDb) {
        const ctfList = dbManager.getCTFs(guild.id);
        ctfList.forEach((ctf) => {
          registerNotify(guild, ctf.name, ctf.start, ctf.end);
        });
      }
    }
  } catch (error) {
    console.error("[ERROR] fetching guilds:", error);
  }
}
