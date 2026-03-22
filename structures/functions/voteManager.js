// In-memory vote store: guildId -> vote object
const votes = new Map();

const VOTE_TIMEOUT_MS = 60_000;

/**
 * Start a new vote for a guild. Only one vote per guild can run at a time.
 * @param {string} guildId - Discord guild ID
 * @param {object} opts
 * @param {string} opts.type - Vote type (e.g. 'skip', 'stop')
 * @param {number} opts.needed - Number of votes required to pass
 * @param {function} opts.onPass - Called when the vote reaches the quorum
 * @param {function} opts.onExpire - Called when the vote times out (60s)
 * @returns {object|null} The vote object, or null if a vote is already running
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
        try {
            await onExpire(vote);
        } catch (err) {
            console.error('[voteManager] onExpire error:', err);
        } finally {
            vote.messageRef = null;
        }
    }, VOTE_TIMEOUT_MS);

    votes.set(guildId, vote);
    return vote;
}

/**
 * Add a user's vote to the active vote for a guild.
 * @param {string} guildId
 * @param {string} userId
 * @returns {{ passed: true }}                            if the vote reached quorum
 * @returns {{ count: number, needed: number, alreadyVoted: true }} if the user already voted
 * @returns {{ count: number, needed: number }}           if the vote is still ongoing
 * @returns {null}                                        if no vote is active
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

/**
 * Get the active vote for a guild, or null if none.
 * @param {string} guildId
 * @returns {object|null}
 */
function getVote(guildId) {
    return votes.get(guildId) ?? null;
}

/**
 * Cancel the active vote for a guild without triggering onExpire.
 * @param {string} guildId
 */
function clearVote(guildId) {
    const vote = votes.get(guildId);
    if (vote) {
        clearTimeout(vote.timeout);
        votes.delete(guildId);
    }
}

module.exports = { startVote, addVote, getVote, clearVote };
