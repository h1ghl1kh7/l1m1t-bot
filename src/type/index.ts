export { ChannelOptions } from "./channel";
export { SlashCommand } from "./command";
export { CTF, Category, Challenge, Server, Stat } from "./database";

export const CategoryLabels = ["pwn", "rev", "web", "crypto", "misc", "web3"];

export const NotifyMessages = [
  "🏁 CTF has ended. Great job!",
  "⏰ 10 minutes remaining! Final sprint!",
  "⏳ 1 hour left in the CTF!",
  "🚀 CTF has started! Good luck!",
  "🕐 1 hour until CTF begins!",
];

export const NotifyTerms = [
  "end",
  "end10",
  "end60",
  "start",
  "start60",
  "start60+",
];
