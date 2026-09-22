// @ts-check
import { module } from "@prisma/composer";
import nestHackathonService from "./service.mjs";

export default module("al-kahf-org", ({ provision }) => {
  provision(nestHackathonService, { id: "nesthackathon" });
});
