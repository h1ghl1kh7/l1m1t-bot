import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import { Server, CTF, Category, Challenge, Stat } from "../type";

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database.Database;

  constructor() {
    const dbPath = path.join(__dirname, "./database.sqlite");
    const dbExists = fs.existsSync(dbPath);

    this.db = new Database(dbPath);

    if (!dbExists) {
      this.initializeTables(this.db);
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getDatabase(): Database.Database {
    return this.db;
  }

  private initializeTables(db: Database.Database): void {
    try {
      db.exec(`
      CREATE TABLE IF NOT EXISTS Server (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL
      )
    `);
      db.exec(`
      CREATE TABLE IF NOT EXISTS CTF (
        id TEXT PRIMARY KEY NOT NULL,
        announcementId TEXT NOT NULL,
        name TEXT NOT NULL,
        start TEXT NOT NULL,
        end TEXT NOT NULL,
        serverId TEXT NOT NULL,
        FOREIGN KEY (serverId) REFERENCES Server(id) ON DELETE CASCADE
      )
    `);
      db.exec(`
      CREATE TABLE IF NOT EXISTS Category (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        ctfId TEXT NOT NULL,
        serverId TEXT NOT NULL,
        FOREIGN KEY (ctfId) REFERENCES CTF(id) ON DELETE CASCADE,
        FOREIGN KEY (serverId) REFERENCES Server(id) ON DELETE CASCADE
      )
    `);
      db.exec(`
      CREATE TABLE IF NOT EXISTS Challenge (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        flag TEXT,
        categoryId TEXT NOT NULL,
        ctfId TEXT NOT NULL,
        serverId TEXT NOT NULL,
        solved INTEGER DEFAULT 0,
        FOREIGN KEY (categoryId) REFERENCES Category(id) ON DELETE CASCADE,
        FOREIGN KEY (ctfId) REFERENCES CTF(id) ON DELETE CASCADE,
        FOREIGN KEY (serverId) REFERENCES Server(id) ON DELETE CASCADE
      )
    `);
      db.exec(`
      CREATE INDEX IF NOT EXISTS idx_category_ctfId on Category(ctfId);
      CREATE INDEX IF NOT EXISTS idx_challenge_categoryId on Challenge(categoryId);
      CREATE INDEX IF NOT EXISTS idx_challenge_ctfId ON Challenge(ctfId);
      CREATE INDEX IF NOT EXISTS idx_ctf_serverId ON CTF(serverId);
      CREATE INDEX IF NOT EXISTS idx_category_serverId ON Category(serverId);
      CREATE INDEX IF NOT EXISTS idx_challenge_serverId ON Challenge(serverId);
    `);
    } catch (error) {
      console.error(`[ERROR] initializing tables: ${error}`);
    }
  }

  public createServer(id: string | number, name: string): number {
    const stmt = this.db.prepare("INSERT INTO Server (id, name) VALUES (?, ?)");
    const result = stmt.run(this.pI(id), name);
    return result.lastInsertRowid as number;
  }

  public getServerById(id: string | number): Server {
    const stmt = this.db.prepare("SELECT * FROM Server WHERE id = ?");
    return stmt.get(this.pI(id)) as Server;
  }

  public createCTF(
    serverId: string | number,
    announcementId: string | number,
    id: string | number,
    name: string,
    start: Date,
    end: Date,
  ): number {
    const stmt = this.db.prepare(
      "INSERT INTO CTF (serverId, announcementId, id, name, start, end) VALUES (?, ?, ?, ?, ?, ?)",
    );
    const result = stmt.run(
      this.pI(serverId),
      this.pI(announcementId),
      this.pI(id),
      name,
      start.toISOString(),
      end.toISOString(),
    );
    return result.lastInsertRowid as number;
  }

  public getCTFById(serverId: string | number, id: string | number): CTF {
    const stmt = this.db.prepare(
      "SELECT * FROM CTF WHERE serverId = ? AND id = ?",
    );
    return stmt.get(this.pI(serverId), this.pI(id)) as CTF;
  }

  public getCTFByName(serverId: string | number, name: string): CTF {
    const stmt = this.db.prepare(
      "SELECT * FROM CTF WHERE serverId = ? AND name = ?",
    );
    return stmt.get(this.pI(serverId), name) as CTF;
  }

  public getCTFs(serverId: string | number): CTF[] {
    const stmt = this.db.prepare("SELECT * FROM CTF WHERE serverId = ?");
    return stmt.all(this.pI(serverId)) as CTF[];
  }

  public updateCTF(
    serverId: string | number,
    id: string | number,
    name: string,
    start: Date,
    end: Date,
  ): void {
    const stmt = this.db.prepare(
      "UPDATE CTF SET name = ?, start = ?, end = ? WHERE serverId = ? AND id = ?",
    );
    stmt.run(
      name,
      start.toISOString(),
      end.toISOString(),
      this.pI(serverId),
      this.pI(id),
    );
  }

  public deleteCTF(serverId: string | number, id: string | number): void {
    const stmt = this.db.prepare(
      "DELETE FROM CTF WHERE serverId = ? AND id = ?",
    );
    stmt.run(this.pI(serverId), this.pI(id));
  }

  public createCategory(
    serverId: string | number,
    id: string | number,
    name: string,
    ctfId: string | number,
  ): number {
    const stmt = this.db.prepare(
      "INSERT INTO Category (serverId, id, name, ctfId) VALUES (?, ?, ?, ?)",
    );
    const result = stmt.run(
      this.pI(serverId),
      this.pI(id),
      name,
      this.pI(ctfId),
    );
    return result.lastInsertRowid as number;
  }

  public getCategoryById(
    serverId: string | number,
    id: string | number,
  ): Category {
    const stmt = this.db.prepare(
      "SELECT * FROM Category WHERE serverId = ? AND id = ?",
    );
    return stmt.get(this.pI(serverId), this.pI(id)) as Category;
  }

  public getCategoryByName(
    serverId: string | number,
    name: string,
    ctfId: string | number,
  ): Category {
    const stmt = this.db.prepare(
      "SELECT * FROM Category WHERE serverId = ? AND name = ? AND ctfId = ?",
    );
    return stmt.get(this.pI(serverId), name, this.pI(ctfId)) as Category;
  }

  public createChallenge(
    serverId: string | number,
    id: string | number,
    name: string,
    ctfId: string | number,
    categoryId: string | number,
  ): number {
    const stmt = this.db.prepare(
      "INSERT INTO Challenge (serverId, id, name, ctfId, categoryId) VALUES (?, ?, ?, ?, ?)",
    );
    const result = stmt.run(
      this.pI(serverId),
      this.pI(id),
      name,
      this.pI(ctfId),
      this.pI(categoryId),
    );
    return result.lastInsertRowid as number;
  }

  public getChallenge(
    serverId: string | number,
    id: string | number,
  ): Challenge {
    const stmt = this.db.prepare(
      "SELECT * FROM Challenge WHERE serverId = ? AND id = ?",
    );
    return stmt.get(this.pI(serverId), this.pI(id)) as Challenge;
  }

  public getCTFChallenges(
    serverId: string | number,
    ctfId: string | number,
  ): Challenge[] {
    const stmt = this.db.prepare(
      "SELECT * FROM Challenge WHERE serverId = ? AND ctfId = ?",
    );
    return stmt.all(this.pI(serverId), this.pI(ctfId)) as Challenge[];
  }

  public getCategoryChallenges(
    serverId: string | number,
    ctfId: string | number,
    categoryId: string | number,
  ): Challenge[] {
    const stmt = this.db.prepare(
      "SELECT * FROM Challenge WHERE serverId = ? AND ctfId = ? AND categoryId = ?",
    );
    return stmt.all(
      this.pI(serverId),
      this.pI(ctfId),
      this.pI(categoryId),
    ) as Challenge[];
  }

  public markChallengeSolved(
    serverId: string | number,
    id: string | number,
    flag: string,
  ): void {
    const stmt = this.db.prepare(
      "UPDATE Challenge SET solved = 1, flag = ? WHERE serverId = ? AND id = ?",
    );
    stmt.run(flag, this.pI(serverId), this.pI(id));
  }

  public deleteChallenge(serverId: string | number, id: string | number): void {
    const stmt = this.db.prepare(
      "DELETE FROM Challenge WHERE serverId = ? AND id = ?",
    );
    stmt.run(this.pI(serverId), this.pI(id));
  }

  public getCTFStats(serverId: string | number, ctfId: string | number): Stat {
    const stmt = this.db.prepare(`
  SELECT 
    c.name as ctf_name,
    COUNT(DISTINCT cat.id) as category_count,
    COUNT(p.id) as total_challenges,
    SUM(CASE WHEN p.solved = 1 THEN 1 ELSE 0 END) as solved_challenges
  FROM CTF c
  LEFT JOIN Category cat ON c.id = cat.ctfId AND c.serverId = cat.serverId
  LEFT JOIN Challenge p ON c.id = p.ctfId AND cat.id = p.categoryId AND c.serverId = p.serverId
  WHERE c.serverId = ? AND c.id = ?
  GROUP BY c.id
`);
    return stmt.get(this.pI(serverId), this.pI(ctfId)) as Stat;
  }

  private pI(id: string | number): string {
    if (typeof id === "number") {
      return id.toString();
    } else {
      return id;
    }
  }
}
