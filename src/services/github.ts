import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

// Register for web browser redirect
WebBrowser.maybeCompleteAuthSession();

// GitHub OAuth configuration
// Note: Replace these with your actual GitHub OAuth App credentials
const GITHUB_CLIENT_ID = 'YOUR_GITHUB_CLIENT_ID';
const GITHUB_CLIENT_SECRET = 'YOUR_GITHUB_CLIENT_SECRET';

const discovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
  revocationEndpoint: `https://github.com/settings/connections/applications/${GITHUB_CLIENT_ID}`,
};

export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

export interface GitHubFile {
  sha: string;
  content: string;
  encoding: string;
}

// Create auth request hook
export function useGitHubAuthRequest() {
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'notrailnote',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID,
      scopes: ['repo', 'user:email'],
      redirectUri,
    },
    discovery
  );

  return { request, response, promptAsync, redirectUri };
}

// Exchange code for access token
export async function exchangeCodeForToken(code: string): Promise<string | null> {
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const data = await response.json();
    return data.access_token || null;
  } catch (error) {
    console.error('Failed to exchange code for token:', error);
    return null;
  }
}

// Get authenticated user
export async function getAuthenticatedUser(accessToken: string): Promise<GitHubUser | null> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to get user:', error);
    return null;
  }
}

// List user repositories
export async function listRepositories(accessToken: string): Promise<GitHubRepo[]> {
  try {
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Failed to list repos:', error);
    return [];
  }
}

// Get file content from repository
export async function getFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  branch?: string
): Promise<GitHubFile | null> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}${branch ? `?ref=${branch}` : ''}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Failed to get file:', error);
    return null;
  }
}

// Create or update file in repository
export async function createOrUpdateFile(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
  branch?: string
): Promise<{ sha: string; commit: { sha: string } } | null> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    const body: Record<string, string> = {
      message,
      content: btoa(unescape(encodeURIComponent(content))), // Base64 encode
    };

    if (sha) body.sha = sha;
    if (branch) body.branch = branch;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub API error:', error);
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Failed to create/update file:', error);
    return null;
  }
}

// Get commit history for a file
export async function getFileCommits(
  accessToken: string,
  owner: string,
  repo: string,
  path: string
): Promise<Array<{
  sha: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
}>> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/commits?path=${encodeURIComponent(path)}&per_page=50`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) return [];
    return response.json();
  } catch (error) {
    console.error('Failed to get commits:', error);
    return [];
  }
}

// Decode base64 content from GitHub
export function decodeContent(content: string): string {
  try {
    return decodeURIComponent(escape(atob(content.replace(/\n/g, ''))));
  } catch {
    return atob(content.replace(/\n/g, ''));
  }
}
