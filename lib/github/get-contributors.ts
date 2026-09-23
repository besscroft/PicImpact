export interface Contributor {
  avatar_url: string;
  login: string;
  contributions: number;
}

export async function fetchContributors(
  repoOwner: string,
  repoName: string,
): Promise<Contributor[] | null> {
  const headers = new Headers()
  if (process.env.GITHUB_TOKEN)
    headers.set('Authorization', `Bearer ${process.env.GITHUB_TOKEN}`)

  const response = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contributors?per_page=50`,
    {
      headers,
      next: { revalidate: 1000 * 1000 },
    },
  )

  if (!response.ok) {
    const isRateLimited =
      response.status === 429 ||
      response.headers.get('x-ratelimit-remaining') === '0' ||
      response.statusText.toLowerCase().includes('rate limit')

    if (isRateLimited) return null

    throw new Error(`Failed to fetch contributors: ${response.statusText}`)
  }

  const contributors = (await response.json()) as Contributor[]
  return contributors
    .filter((contributor) => !contributor.login.endsWith('[bot]'))
    .sort((a, b) => b.contributions - a.contributions)
}
