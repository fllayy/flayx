module.exports = {
    // interactionCreate
    cmdUnknown:   (name) => `${name} is not a valid command`,
    cmdDevOnly:   (name) => `${name} is a developer only command`,
    cmdUserPerms: (perms) => `You do not have the required permissions. You need: ${perms}`,
    cmdBotPerms:  (perms) => `I do not have the required permissions. I need: ${perms}`,
    cmdGuildOnly: (name) => `${name} is a guild only command`,
    cmdInVoice:   `You must be in a voice channel to use this command.`,
    cmdSameVoice: `You must be in the same voice channel as me to use this command.`,
    cmdNoPlayer:  `No music is currently playing.`,
    cmdNoCurrent: `I am not playing anything right now.`,
    cmdError:     (err) => `An error has occurred while processing a slash command: ${err}`,

    // play
    playPlaylist:  (count, name) => `Added ${count} songs from **${name}** playlist.`,
    playTrack:     (title) => `**${title}** added to the queue.`,
    playNoResults: `No results found for your query.`,

    // skip
    skipDone:        `Skipped the current track.`,
    skipVotePassRef: `✅ Skip vote passed! Track skipped.`,
    skipVoteExpire:  (count, needed) => `❌ Skip vote expired — **${count}/${needed}** votes.`,
    skipVoteStart:   (count, needed) => `🗳️ **Skip** vote started!\n**${count}/${needed}** votes needed (60s).\n\nUse \`/skip\` or click the skip button to vote.`,
    skipSolo:        `✅ Track skipped.`,

    // stop
    stopDone:        `Disconnected from the voice channel.`,
    stopVotePassRef: `✅ Stop vote passed! Bot disconnected.`,
    stopVoteExpire:  (count, needed) => `❌ Stop vote expired — **${count}/${needed}** votes.`,
    stopVoteStart:   (count, needed) => `🗳️ **Stop** vote started!\n**${count}/${needed}** votes needed (60s).\n\nUse \`/stop\` or click the stop button to vote.`,
    stopSolo:        `✅ Bot disconnected.`,

    // vote (shared)
    voteOtherRunning:  (type) => `A **${type}** vote is already in progress.`,
    voteAlreadyVoted:  `You have already voted!`,
    voteAdded:         (count, needed) => `🗳️ Vote added! **${count}/${needed}** votes.`,
    voteAlreadyRunning:`A vote is already in progress.`,
    votePass:          `✅ Vote passed!`,

    // pause / resume
    adminDjRequired: `You must be an admin or have the DJ role to use this command.`,
    adminDjButton:   `You must be an admin or have the DJ role to use this button.`,
    pauseAlready:    `The player is already paused.`,
    pauseDone:       `Paused the current track.`,
    resumeAlready:   `The player is already playing.`,
    resumeDone:      `Resumed the current track.`,

    // queue
    queueNoPerms:      `You must be an admin or have the DJ role to modify the queue.`,
    queueCleared:      `🗑️ Queue cleared.`,
    queueInvalidIndex: (len) => `❌ Invalid index. The queue has **${len}** track(s). Use a number between 1 and ${len}.`,
    queueRemoved:      (title) => `🗑️ Removed **${title}** from the queue.`,
    queueEmpty:        `📭 The queue is empty.`,
    queueNavOnly:      `Only the person who ran this command can navigate the queue.`,
    queueTitle:        `🎵 Current Queue`,
    queueNowPlaying:   `▶ Now Playing`,
    queueUpNext:       `Up Next`,
    queueFooter:       (page, total, count) => `Page ${page}/${total} • ${count} track(s) in queue`,

    // autoplay
    autoplayState: (on) => `Autoplay is now **${on ? 'enabled' : 'disabled'}**.`,

    // loop
    loopDone:   (label) => `Loop mode: **${label}**`,
    loopLabels: { track: '🔂 Track', queue: '🔁 Queue', none: 'Disabled' },

    // shuffle
    shuffleEmpty: `📭 The queue is empty, nothing to shuffle.`,
    shuffleDone:  (count) => `🔀 Queue shuffled — **${count}** track(s).`,

    // player buttons
    btnNoPlayer:    `The player doesn't exist.`,
    btnNoVoice:     `You must be in a voice channel.`,
    btnVoteAction:  `✅ Action performed.`,
    btnVoteStart:   (type, count, needed) => `🗳️ **${type}** vote started!\n**${count}/${needed}** votes needed (60s).\n\nClick the button or use \`/${type}\` to vote.`,
    btnVoteUpdate:  (type, count, needed) => `🗳️ **${type}** vote in progress!\n**${count}/${needed}** votes needed (60s).\n\nClick the button or use \`/${type}\` to vote.`,
    btnVotePassRef: (type) => `✅ ${type} vote passed!`,
    btnVoteExpire:  (type, count, needed) => `❌ ${type} vote expired — **${count}/${needed}** votes.`,

    // Now Playing embed
    trackEmbedTitle:   `Music Controller | FLAYX`,
    trackNowPlaying:   (title, uri, author, requester) =>
        `**Now Playing:**\n[${title}](${uri}) by \`${author}\`\n\nRequested by ${requester}`,
    trackFooter:       (queue, duration, volume, autoplay, loop) =>
        `Queue Length: ${queue} | Duration: ${duration} | Volume: ${volume}% | Autoplay: ${autoplay}${loop}`,
    trackLive:         `🔴 LIVE`,
    trackAutoplayOn:   `enabled`,
    trackAutoplayOff:  `disabled`,
    trackLoopIcons:    { track: '🔂 Track', queue: '🔁 Queue' },
    trackRequesterAuto:`Autoplay`,
    trackFallback:     (title, author) => `Now playing: **${title}** by \`${author}\``,

    // queueEnd / trackEnd
    queueEndMsg:   `📭 Queue has ended.`,
    trackEndAlone: `📭 No one is left in the voice channel, leaving.`,

    // validation
    playQueryEmpty:         `Please provide a non-empty search query.`,
    settingsDjEveryoneRole: `You cannot set @everyone as the DJ role.`,
    settingsDjManagedRole:  `You cannot set a bot-managed role as the DJ role.`,
    settingsAnnounceNoPerms:`I don't have permission to send messages in that channel.`,

    // settings
    settingsNoPerms:      `You must be an administrator to change settings.`,
    settingsVolume:       (vol, applied) => `Volume set to **${vol}%**${applied ? ' (applied to current player)' : ''}`,
    settingsDj:           (id) => `DJ role set to <@&${id}>`,
    settingsLang:         (label) => `Language set to **${label}**`,
    settingsAnnounceSet:  (id) => `Announce channel set to <#${id}>. The bot will post the player there.`,
    settingsAnnounceClear:`Announce channel cleared. The bot will post in the \`/play\` command channel.`,
    settingsViewTitle:     (name) => `Settings — ${name}`,
    settingsViewNone:      `None`,
    settingsViewAuto:      `Auto (command channel)`,
    settingsLangFr:        `🇫🇷 Français`,
    settingsLangEn:        `🇬🇧 English`,
    settingsFieldVolume:   `Volume`,
    settingsFieldDj:       `DJ Role`,
    settingsFieldLang:     `Language`,
    settingsFieldAnnounce: `Announce Channel`,
    settingsFieldVoiceTime:`Voice Time`,

    // ping
    pingTitle: `🏓 Pong!`,
    pingWs:    `WebSocket`,
    pingApi:   `API Latency`,

    // help
    helpTitle:             `🎵 FLAYX — Help`,
    helpDescription:       `Here are all available commands. Use the menu below to explore by category.`,
    helpTotalFooter:       (n) => `${n} commands in total`,
    helpNavOnly:           `Only the person who ran this command can use this menu.`,
    helpBackBtn:           `← Back`,
    helpSelectPlaceholder: `Select a category…`,
    helpCategoryLabels:    { information: 'Information', music: 'Music', settings: 'Settings' },
    helpCategoryDesc:      (icon, label) => `${icon} ${label} commands`,
};
