import { Manifest } from "../../types";

function normalizeUrl(url: string | undefined): string | undefined {
    if (!url || typeof url !== "string") {
        return undefined;
    }
    const trimmed = url.trim().replace(/\/+$/, "");
    return trimmed.length > 0 ? trimmed : undefined;
}

function parseGithubRepo(url: string | undefined): { owner: string, name: string } | null {
    if (!url) {
        return null;
    }
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?$/i);
    if (!match) {
        return null;
    }
    return { owner: match[1], name: match[2] };
}

/**
 * Resolves the external links (repo / website / support) for a plugin manifest.
 *
 * When the manifest `repo` points at a GitHub repository, `website` and `support`
 *   are auto-populated when not explicitly provided.
 */
export function resolvePluginManifestLinks<T extends Manifest>(manifest: T): T {
    if (!manifest) {
        return manifest;
    }

    const repo = normalizeUrl(manifest.repo);
    const isGithubRepo = parseGithubRepo(repo) != null;

    let website = normalizeUrl(manifest.website);
    if (!website && isGithubRepo) {
        website = repo;
    }

    let support = normalizeUrl(manifest.support);
    if (!support && isGithubRepo) {
        support = `${repo}/issues`;
    }

    // Avoid showing a website link that just duplicates the repo link
    if (website && repo && website.toLowerCase() === repo.toLowerCase()) {
        website = undefined;
    }

    return {
        ...manifest,
        repo: repo ?? undefined,
        website: website ?? undefined,
        support: support ?? undefined
    };
}
