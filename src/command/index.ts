// import {echo} from "./echo";
import { registerCTF, deleteCTF, listCTF } from "./ctf";
import { checkHealth } from "./healthcheck";
import {
  registerChallenge,
  checkSolved,
  listChallenges,
  delChallenge,
} from "./challenge";

const availableCommands = [
  registerCTF,
  deleteCTF,
  checkHealth,
  registerChallenge,
  checkSolved,
  listCTF,
  listChallenges,
  delChallenge,
];

export default availableCommands;
