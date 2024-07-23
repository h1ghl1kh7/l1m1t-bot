export interface Server {
  id: string;
  name: string;
}
export interface CTF {
  id: string;
  announcementId: string;
  name: string;
  start: string;
  end: string;
  serverId: string;
}

export interface Category {
  id: string;
  name: string;
  ctfId: string;
  serverId: string;
}

export interface Challenge {
  id: string;
  name: string;
  flag: string;
  categoryId: string;
  ctfId: string;
  serverId: string;
  solved: number;
}

export interface Stat {
  ctf_name: string;
  category_count: number;
  total_challenges: number;
  solved_challenges: number;
}
