// In-memory vote store: guildId -> vote object
const votes = new Map();

const VOTE_TIMEOUT_MS = 60_000;

/**
 * Start a new vote for a guild.
 * @returns the vote object, or null if a vote is already running
 */
function startVote(guildId, { type, needed, onPass, onExpire }) {
    if (votes.has(guildId)) return null;

    const vote = {
        type,
        needed,
        voters: new Set(),
        messageRef: null,
        onPass,
        onExpire,
        timeout: null,
    };

    vote.timeout = setTimeout(async () => {
        votes.delete(guildId);
        await onExpire(vote);
    }, VOTE_TIMEOUT_MS);

    votes.set(guildId, vote);
    return vote;
}

/**
 * Add a user's vote.
 * @returns { passed: true } | { count, needed, alreadyVoted: true } | { count, needed } | null (no vote)
 */
function addVote(guildId, userId) {
    const vote = votes.get(guildId);
    if (!vote) return null;

    if (vote.voters.has(userId)) {
        return { count: vote.voters.size, needed: vote.needed, alreadyVoted: true };
    }

    vote.voters.add(userId);

    if (vote.voters.size >= vote.needed) {
        clearTimeout(vote.timeout);
        votes.delete(guildId);
        vote.onPass(vote);
        return { passed: true };
    }

    return { count: vote.voters.size, needed: vote.needed };
}

function getVote(guildId) {
    return votes.get(guildId) ?? null;
}

function clearVote(guildId) {
    const vote = votes.get(guildId);
    if (vote) {
        clearTimeout(vote.timeout);
        votes.delete(guildId);
    }
}

module.exports = { startVote, addVote, getVote, clearVote };
