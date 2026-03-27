import { LeaderboardEntry, getLeaderboard, saveLeaderboard } from '../utils/helpers';

export class ScoreSystem {
  /** Score = survivalMinutes * 100 + health * 10 + money */
  calculateScore(survivalSeconds: number, health: number, money: number): number {
    const minutes = survivalSeconds / 60;
    return Math.floor(minutes * 100 + health * 10 + money);
  }

  saveScore(nickname: string, score: number, profileLink?: string): LeaderboardEntry[] {
    const entries = getLeaderboard();
    entries.push({ nickname, score, date: new Date().toLocaleDateString(), profileLink });
    saveLeaderboard(entries);
    return this.getLeaderboard();
  }

  getLeaderboard(): LeaderboardEntry[] {
    return getLeaderboard().sort((a, b) => b.score - a.score).slice(0, 10);
  }

  getRank(score: number): number {
    const entries = this.getLeaderboard();
    const idx = entries.findIndex(e => score >= e.score);
    return idx === -1 ? entries.length + 1 : idx + 1;
  }
}
