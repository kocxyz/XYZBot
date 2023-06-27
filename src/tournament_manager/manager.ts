import { SqlDatabase } from "brackets-prisma-db";
import { prisma } from "../database/client";
import { BracketsManager } from "brackets-manager";

const storage = new SqlDatabase(prisma);
const manager = new BracketsManager(storage);

export { manager }