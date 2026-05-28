# 🌐 GitHub API Reference

> All GitHub API endpoints used by GitHub City, with request details, response shapes, rate limits, and fallback behavior.

---

## Base URL

```
https://api.github.com
```

All requests are **unauthenticated** (no token required). The app works with GitHub's public API out of the box.

---

## Rate Limits

| Type | Limit |
|---|---|
| **Unauthenticated** | **60 requests / hour / IP** |
| Authenticated (with token) | 5,000 requests / hour |

### How GitHub City uses the limit

Searching one user with **N repos** makes approximately:

```
1 (user profile)
+ ceil(N / 100) (repo list pages)
+ N (participation stats, one per repo)
= ~N + 2 total requests
```

| Repos | Requests used |
|---|---|
| 10 | ~12 |
| 30 | ~32 |
| 42 | ~44 |
| 100 | ~102 |

⚠️ With 60 req/hour limit, you can search **1 user with ~58 repos** before hitting the limit. Searching multiple large users in quick succession will trigger 403 responses.

**Error response when rate-limited:**
```json
{
  "message": "API rate limit exceeded for x.x.x.x.",
  "documentation_url": "https://docs.github.com/rest/overview/rate-limiting"
}
```

The app shows: *"GitHub API rate limit reached. Please wait a minute and try again."*

---

## Endpoints

### 1. Get User Profile

```
GET /users/{username}
```

**Used in:** `fetchUserCity()`

**Response fields used:**

```js
{
  login:        string,   // GitHub username
  name:         string,   // Display name (fallback: login)
  avatar_url:   string,   // Profile picture URL
  bio:          string,   // Short bio
  followers:    number,
  following:    number,
  public_repos: number,   // Total public repo count (used for sidebar stat)
  location:     string,
  html_url:     string,   // https://github.com/{login}
}
```

---

### 2. List User Repositories (paginated)

```
GET /users/{username}/repos?sort=pushed&per_page=100&page={n}
```

**Used in:** `fetchAllRepos()` — called repeatedly until `response.length < 100`

**Query parameters:**

| Param | Value | Reason |
|---|---|---|
| `sort` | `pushed` | Most recently active repos first |
| `per_page` | `100` | GitHub API max per page |
| `page` | `1, 2, 3, ...` | Pagination |

**Note:** No `type=owner` filter — both own repos and forks are included so the user sees all repos in their city.

**Response fields used per repo:**

```js
{
  name:               string,   // repo slug, e.g. "linux"
  description:        string,   // short description
  stargazers_count:   number,   // ⭐ stars → drives building height
  forks_count:        number,   // 🍴 forks → drives building width
  language:           string,   // primary language → accent color
  size:               number,   // KB → secondary height factor
  pushed_at:          string,   // ISO date → used in fallback estimator
  html_url:           string,   // https://github.com/{owner}/{repo}
  fork:               boolean,  // true if this is a fork
}
```

**Pagination logic:**
```js
async function fetchAllRepos(username) {
  const allRepos = [];
  let page = 1;
  while (true) {
    const res = await axios.get(`/users/${username}/repos?sort=pushed&per_page=100&page=${page}`);
    allRepos.push(...res.data);
    if (res.data.length < 100) break;  // last page reached
    page++;
  }
  return allRepos;
}
```

---

### 3. Repository Participation Stats

```
GET /repos/{owner}/{repo}/stats/participation
```

**Used in:** `fetchParticipation()` — called once per repo, batched 10 at a time

**What it returns:**

```js
{
  all:   [52 numbers],   // total commits per week (all contributors), index 0 = oldest
  owner: [52 numbers],   // commits by repo owner only
}
```

The app uses the `all` array so window lighting reflects **all contributor activity**, not just the owner's.

**Async behavior (202 Accepted):**

GitHub computes participation stats lazily. If the stats aren't cached yet, the API returns `202 Accepted` with an empty body. The app handles this with automatic retries:

```js
async function fetchParticipation(owner, repo, retries = 2) {
  const res = await axios.get(`.../stats/participation`, { timeout: 6000 });
  if (res.status === 202 && retries > 0) {
    await sleep(1500);                          // wait 1.5 seconds
    return fetchParticipation(owner, repo, retries - 1);
  }
  return Array.isArray(res.data?.all) ? res.data.all : null;
}
```

Maximum retries: **2** (total wait time: up to 3 seconds per repo)

**Batching:**
```js
const BATCH = 10;  // 10 repos in parallel at a time
for (let i = 0; i < rawRepos.length; i += BATCH) {
  const batch = rawRepos.slice(i, i + BATCH);
  const results = await Promise.all(batch.map(r => fetchParticipation(username, r.name)));
  participations.push(...results);
}
```

---

## Fallback: Estimated Activity

When the participation API fails (network error, persistent 202, or rate limit), the app generates **estimated** activity data from the repo's metadata:

```js
function estimateActivity(repo) {
  const weeks = new Array(52).fill(0);
  const base = max(1, log2(repo.size + 2));            // bigger repo = more base activity
  const daysSincePush = (Date.now() - new Date(repo.pushed_at)) / 86400000;
  const recentActivity = max(0, 1 - daysSincePush / 180);  // fades over 6 months

  for (let w = 0; w < 52; w++) {
    const recency = w / 51;   // 0=oldest, 1=newest
    const rand = Math.random();
    weeks[w] = rand < (recency * recentActivity * 0.6) ? ceil(rand * base * 3) : 0;
  }
  return weeks;
}
```

**Effect:** Repos pushed recently will have activity near the top of the building (recent weeks); repos not touched in 6+ months will appear mostly dark.

---

## CityData Shape

The final data structure returned by `fetchUserCity()`:

```ts
interface CityData {
  user: {
    login:        string;
    name:         string;
    avatar_url:   string;
    bio:          string;
    followers:    number;
    following:    number;
    public_repos: number;
    location:     string;
    html_url:     string;
  };
  repos: Array<{
    name:          string;
    description:   string;
    stars:         number;
    forks:         number;
    language:      string | null;
    size:          number;          // KB
    weeklyCommits: number[];        // 52 elements, index 51 = most recent week
    totalCommits:  number;          // sum of weeklyCommits
    peakWeek:      number;          // max value in weeklyCommits (for color normalization)
    pushedAt:      string;          // ISO date string
    url:           string;          // GitHub repo URL
  }>;
}
```

Repos are **sorted by `stars` descending** before being returned, so the most prominent repos appear center-front in the city layout.

---

## Adding Authentication (Optional)

To increase the rate limit to 5,000 req/hour, add a GitHub personal access token:

1. Create a token at https://github.com/settings/tokens (no special scopes needed for public data)
2. Create a `.env` file:
   ```
   VITE_GITHUB_TOKEN=ghp_your_token_here
   ```
3. Update `github.js`:
   ```js
   const headers = import.meta.env.VITE_GITHUB_TOKEN
     ? { Authorization: `Bearer ${import.meta.env.VITE_GITHUB_TOKEN}` }
     : {};

   // Pass to every axios.get() call:
   axios.get(url, { headers, timeout: 6000 })
   ```

⚠️ **Never commit your token.** The `.env` file is already listed in `.gitignore`.
