module.exports = {
    // interactionCreate
    cmdUnknown:   (name) => `${name} n'est pas une commande valide`,
    cmdDevOnly:   (name) => `${name} est une commande réservée aux développeurs`,
    cmdUserPerms: (perms) => `Vous n'avez pas les permissions requises. Permissions nécessaires : ${perms}`,
    cmdBotPerms:  (perms) => `Je n'ai pas les permissions requises. Permissions nécessaires : ${perms}`,
    cmdGuildOnly: (name) => `${name} est uniquement disponible dans un serveur`,
    cmdInVoice:   `Vous devez être dans un salon vocal pour utiliser cette commande.`,
    cmdSameVoice: `Vous devez être dans le même salon vocal que moi pour utiliser cette commande.`,
    cmdNoPlayer:  `Aucune musique n'est en cours de lecture.`,
    cmdNoCurrent: `Je ne lis rien en ce moment.`,
    cmdError:     (err) => `Une erreur s'est produite lors du traitement de la commande : ${err}`,

    // play
    playPlaylist:  (count, name) => `${count} musiques ajoutées depuis la playlist **${name}**.`,
    playTrack:     (title) => `**${title}** ajouté à la queue.`,
    playNoResults: `Aucun résultat trouvé pour votre recherche.`,

    // skip
    skipDone:        `Piste actuelle skippée.`,
    skipVotePassRef: `✅ Vote de skip passé ! Piste skippée.`,
    skipVoteExpire:  (count, needed) => `❌ Vote de skip expiré — **${count}/${needed}** votes.`,
    skipVoteStart:   (count, needed) => `🗳️ Vote de **skip** lancé !\n**${count}/${needed}** votes nécessaires (60s).\n\nUtilise \`/skip\` ou clique sur le bouton skip du player pour voter.`,
    skipSolo:        `✅ Piste skippée.`,

    // stop
    stopDone:        `Déconnecté du salon vocal.`,
    stopVotePassRef: `✅ Vote de stop passé ! Bot déconnecté.`,
    stopVoteExpire:  (count, needed) => `❌ Vote de stop expiré — **${count}/${needed}** votes.`,
    stopVoteStart:   (count, needed) => `🗳️ Vote de **stop** lancé !\n**${count}/${needed}** votes nécessaires (60s).\n\nUtilise \`/stop\` ou clique sur le bouton stop du player pour voter.`,
    stopSolo:        `✅ Bot déconnecté.`,

    // vote (commun)
    voteOtherRunning:  (type) => `Un vote de **${type}** est déjà en cours.`,
    voteAlreadyVoted:  `Tu as déjà voté !`,
    voteAdded:         (count, needed) => `🗳️ Vote ajouté ! **${count}/${needed}** votes.`,
    voteAlreadyRunning:`Un vote est déjà en cours.`,
    votePass:          `✅ Vote passé !`,

    // pause / resume
    adminDjRequired: `Tu dois être admin ou avoir le rôle DJ pour utiliser cette commande.`,
    adminDjButton:   `Tu dois être admin ou avoir le rôle DJ pour utiliser ce bouton.`,
    pauseAlready:    `Le lecteur est déjà en pause.`,
    pauseDone:       `Lecture mise en pause.`,
    resumeAlready:   `Le lecteur est déjà en lecture.`,
    resumeDone:      `Lecture reprise.`,

    // queue
    queueNoPerms:      `Tu dois être admin ou avoir le rôle DJ pour modifier la queue.`,
    queueCleared:      `🗑️ Queue vidée.`,
    queueInvalidIndex: (len) => `❌ Index invalide. La queue contient **${len}** piste(s). Utilisez un nombre entre 1 et ${len}.`,
    queueRemoved:      (title) => `🗑️ **${title}** retiré de la queue.`,
    queueEmpty:        `📭 La queue est vide.`,
    queueNavOnly:      `Seul l'auteur de la commande peut naviguer dans la queue.`,
    queueTitle:        `🎵 File d'attente`,
    queueNowPlaying:   `▶ En lecture`,
    queueUpNext:       `Suivant`,
    queueFooter:       (page, total, count) => `Page ${page}/${total} • ${count} piste(s) en attente`,

    // autoplay
    autoplayState: (on) => `L'autoplay est maintenant **${on ? 'activé' : 'désactivé'}**.`,

    // loop
    loopDone:   (label) => `Mode de répétition : **${label}**`,
    loopLabels: { track: '🔂 Piste', queue: '🔁 Queue', none: 'Désactivé' },

    // shuffle
    shuffleEmpty: `📭 La queue est vide, rien à mélanger.`,
    shuffleDone:  (count) => `🔀 Queue mélangée — **${count}** piste(s).`,

    // boutons player
    btnNoPlayer:    `Le lecteur n'existe pas.`,
    btnNoVoice:     `Tu dois être dans un salon vocal.`,
    btnVoteAction:  `✅ Action effectuée.`,
    btnVoteStart:   (type, count, needed) => `🗳️ Vote de **${type}** lancé !\n**${count}/${needed}** votes nécessaires (60s).\n\nClique sur le bouton ou utilise \`/${type}\` pour voter.`,
    btnVoteUpdate:  (type, count, needed) => `🗳️ Vote de **${type}** en cours !\n**${count}/${needed}** votes nécessaires (60s).\n\nClique sur le bouton ou utilise \`/${type}\` pour voter.`,
    btnVotePassRef: (type) => `✅ Vote de ${type} passé !`,
    btnVoteExpire:  (type, count, needed) => `❌ Vote de ${type} expiré — **${count}/${needed}** votes.`,

    // embed Now Playing
    trackEmbedTitle:   `Music Controller | FLAYX`,
    trackNowPlaying:   (title, uri, author, requester) =>
        `**En lecture :**\n[${title}](${uri}) par \`${author}\`\n\nDemandé par ${requester}`,
    trackFooter:       (queue, duration, volume, autoplay, loop) =>
        `File : ${queue} | Durée : ${duration} | Volume : ${volume}% | Autoplay : ${autoplay}${loop}`,
    trackLive:         `🔴 EN DIRECT`,
    trackAutoplayOn:   `activé`,
    trackAutoplayOff:  `désactivé`,
    trackLoopIcons:    { track: '🔂 Piste', queue: '🔁 Queue' },
    trackRequesterAuto:`Autoplay`,
    trackFallback:     (title, author) => `En lecture : **${title}** par \`${author}\``,

    // queueEnd / trackEnd
    queueEndMsg:    `📭 La queue est terminée.`,
    trackEndAlone:  `📭 Plus personne dans le salon vocal, déconnexion.`,

    // validation
    playQueryEmpty:         `Veuillez fournir une recherche non vide.`,
    settingsDjEveryoneRole: `Vous ne pouvez pas définir @everyone comme rôle DJ.`,
    settingsDjManagedRole:  `Vous ne pouvez pas définir un rôle géré par un bot comme rôle DJ.`,
    settingsAnnounceNoPerms:`Je n'ai pas la permission d'envoyer des messages dans ce salon.`,

    // settings
    settingsNoPerms:      `Vous devez être administrateur pour modifier les paramètres.`,
    settingsVolume:       (vol, applied) => `Volume défini à **${vol}%**${applied ? ' (appliqué au lecteur actuel)' : ''}`,
    settingsDj:           (id) => `Rôle DJ défini sur <@&${id}>`,
    settingsLang:         (label) => `Langue définie sur **${label}**`,
    settingsAnnounceSet:  (id) => `Salon d'annonce défini sur <#${id}>. Le bot y postera le lecteur musical.`,
    settingsAnnounceClear:`Salon d'annonce désactivé. Le bot postera dans le salon de la commande \`/play\`.`,
    settingsViewTitle:     (name) => `Paramètres — ${name}`,
    settingsViewNone:      `Aucun`,
    settingsViewAuto:      `Auto (commande)`,
    settingsLangFr:        `🇫🇷 Français`,
    settingsLangEn:        `🇬🇧 English`,
    settingsFieldVolume:   `Volume`,
    settingsFieldDj:       `Rôle DJ`,
    settingsFieldLang:     `Langue`,
    settingsFieldAnnounce: `Salon annonce`,
    settingsFieldVoiceTime:`Temps en vocal`,

    // filters
    filterOn:     (name) => `🎛️ Filtre **${name}** activé.`,
    filterOff:    (name) => `🎛️ Filtre **${name}** désactivé.`,
    filterClear:  `🎛️ Tous les filtres ont été supprimés.`,
    filterLabels: {
        karaoke:    'Karaoke',
        nightcore:  'Nightcore',
        vaporwave:  'Vaporwave',
        '8d':       '8D Audio',
        bassboost:  'Bass Boost',
        slowmode:   'Slowmode',
        tremolo:    'Tremolo',
        vibrato:    'Vibrato',
        rotation:   'Rotation',
        distortion: 'Distortion',
        lowpass:    'Low Pass',
    },

    // track error
    trackErrorMsg: (title) => `❌ Impossible de jouer **${title}**, passage à la piste suivante.`,

    // ping
    pingTitle: `🏓 Pong !`,
    pingWs:    `WebSocket`,
    pingApi:   `Latence API`,

    // help
    helpTitle:             `🎵 FLAYX — Aide`,
    helpDescription:       `Voici toutes les commandes disponibles. Utilise le menu ci-dessous pour explorer par catégorie.`,
    helpTotalFooter:       (n) => `${n} commandes au total`,
    helpNavOnly:           `Seul la personne ayant utilisé cette commande peut utiliser ce menu.`,
    helpBackBtn:           `← Retour`,
    helpSelectPlaceholder: `Sélectionner une catégorie…`,
    helpCategoryLabels:    { information: 'Information', music: 'Musique', settings: 'Paramètres' },
    helpCategoryDesc:      (icon, label) => `${icon} ${label} — commandes`,
};
