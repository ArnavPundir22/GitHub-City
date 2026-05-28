import axios from 'axios';

const BASE = 'https://api.github.com';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Language accent colors (GitHub's official palette) ──────────────────────
export const LANGUAGE_COLORS = {
  JavaScript:  '#f1e05a',
  TypeScript:  '#3178c6',
  Python:      '#3572A5',
  Go:          '#00ADD8',
  Rust:        '#dea584',
  Java:        '#b07219',
  C:           '#555555',
  'C++':       '#f34b7d',
  'C#':        '#178600',
  Ruby:        '#701516',
  PHP:         '#4F5D95',
  Swift:       '#F05138',
  Kotlin:      '#A97BFF',
  HTML:        '#e34c26',
  CSS:         '#563d7c',
  Shell:       '#89e051',
  Dart:        '#00B4AB',
  Scala:       '#c22d40',
  Vue:         '#41b883',
  Svelte:      '#ff3e00',
  Default:     '#00eeff',
};

export function getLangColor(language) {
  return LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Default;
}

// ── Fetch 52-week participation data for a repo ──────────────────────────────
async function fetchParticipation(owner, repo, retries = 2) {
  try {
    const res = await axios.get(
      `${BASE}/repos/${owner}/${repo}/stats/participation`,
      { timeout: 6000 }
    );
    // 202 = GitHub is computing stats, retry after delay
    if (res.status === 202 && retries > 0) {
      await sleep(1500);
      return fetchParticipation(owner, repo, retries - 1);
    }
    return Array.isArray(res.data?.all) ? res.data.all : null;
  } catch {
    return null;
  }
}

// ── Fallback: estimate activity from repo metadata ───────────────────────────
function estimateActivity(repo) {
  const weeks = new Array(52).fill(0);
  const base = Math.max(1, Math.log2(repo.size + 2));
  const pushed = new Date(repo.pushed_at);
  const daysSincePush = (Date.now() - pushed) / (1000 * 60 * 60 * 24);
  const recentActivity = Math.max(0, 1 - daysSincePush / 180); // fades over 6 months

  for (let w = 0; w < 52; w++) {
    const recency = w / 51; // 0 = oldest, 1 = newest
    const rand = Math.random();
    weeks[w] = rand < (recency * recentActivity * 0.6)
      ? Math.ceil(rand * base * 3)
      : 0;
  }
  return weeks;
}

// ── Fetch ALL repos with pagination (GitHub max per_page = 100) ─────────────
async function fetchAllRepos(username) {
  const allRepos = [];
  let page = 1;
  while (true) {
    const res = await axios.get(
      `${BASE}/users/${username}/repos?sort=pushed&per_page=100&page=${page}`
    );
    allRepos.push(...res.data);
    // Stop when we get fewer than 100 — no more pages
    if (res.data.length < 100) break;
    page++;
  }
  return allRepos;
}

// ── Main export: fetch a user's full city data ───────────────────────────────
export async function fetchUserCity(username) {
  const [userRes, rawRepos] = await Promise.all([
    axios.get(`${BASE}/users/${username}`),
    fetchAllRepos(username),
  ]);

  const user = userRes.data;
  // Include all repos (own + forks) — user wants to see all 42

  // Fetch participation stats in parallel (with a concurrency cap of 10)
  const BATCH = 10;
  const participations = [];
  for (let i = 0; i < rawRepos.length; i += BATCH) {
    const batch = rawRepos.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((r) => fetchParticipation(username, r.name))
    );
    participations.push(...results);
  }

  const repos = rawRepos.map((repo, i) => {
    const weeklyCommits = participations[i] || estimateActivity(repo);
    const totalCommits = weeklyCommits.reduce((s, c) => s + c, 0);
    const peakWeek = Math.max(...weeklyCommits, 1);

    return {
      name:         repo.name,
      description:  repo.description || '',
      stars:        repo.stargazers_count,
      forks:        repo.forks_count,
      language:     repo.language,
      size:         repo.size,          // KB
      weeklyCommits,                    // 52-element array, index 51 = most recent
      totalCommits,
      peakWeek,
      pushedAt:     repo.pushed_at,
      url:          repo.html_url,
    };
  });

  // Sort: most starred first, so prominent repos are center-front
  repos.sort((a, b) => b.stars - a.stars);

  return {
    user: {
      login:        user.login,
      name:         user.name || user.login,
      avatar_url:   user.avatar_url,
      bio:          user.bio || '',
      followers:    user.followers,
      following:    user.following,
      public_repos: user.public_repos,
      location:     user.location || '',
      html_url:     user.html_url,
    },
    repos,
  };
}
