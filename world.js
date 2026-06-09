// =============================
// WORLD.JS
// Carte du monde & navigation
// =============================

const World = (() => {

    // =============================
    // CONFIGURATION
    // =============================
    const CONFIG = {
        defaultZone : 'terminal_0',
        fadeDelay   : 400,
    };

    // =============================
    // DIRECTIONS
    // =============================
    const DIRECTIONS = {
        'north' : 'north', 'n' : 'north',
        'south' : 'south', 's' : 'south',
        'east'  : 'east',  'e' : 'east',
        'west'  : 'west',  'w' : 'west',
        'up'    : 'up',    'u' : 'up',
        'down'  : 'down',  'd' : 'down',
        'back'  : 'back',  'b' : 'back',
    };

    // =============================
    // ZONES
    // =============================
    const ZONES = {

        // ——————————————————————————
        // NIVEAU 0 — TERMINAL
        // ——————————————————————————
        'terminal_0': {
            id         : 'terminal_0',
            name       : 'Terminal d\'entrée',
            level      : 0,
            description: [
                'Un terminal vieillissant pulse dans l\'obscurité.',
                'L\'écran affiche une invite clignotante.',
                'Des câbles courent le long des murs humides.',
                'Quelqu\'un était là avant toi.',
            ],
            atmosphere : 'dark',
            exits      : {
                north : { to: 'corridor_0', locked: false },
                down  : { to: 'basement_0', locked: true, flag: 'access_basement', hint: 'La trappe est verrouillée. Il faut un code.' },
            },
            items      : ['badge_tmp', 'note_froissee'],
            npcs       : [],
            onEnter    : () => {
                if (!State.hasFlag('visited_terminal_0')) {
                    State.setFlag('visited_terminal_0');
                    Story.trigger('intro_terminal');
                }
            },
            onExit     : null,
        },

        // ——————————————————————————
        // NIVEAU 0 — COULOIR
        // ——————————————————————————
        'corridor_0': {
            id         : 'corridor_0',
            name       : 'Couloir B — Niveau 0',
            level      : 0,
            description: [
                'Un long couloir baigné de lumière fluorescente.',
                'Des portes numérotées se succèdent à perte de vue.',
                'Une caméra pivote lentement au plafond.',
                'La porte EST porte le numéro 07.',
            ],
            atmosphere : 'dim',
            exits      : {
                south : { to: 'terminal_0',  locked: false },
                east  : { to: 'room_07',     locked: true, flag: 'key_room_07', hint: 'La porte 07 est fermée à clé.' },
                west  : { to: 'server_room', locked: true, flag: 'access_server', hint: 'Accès restreint. Badge requis.' },
                north : { to: 'elevator_0',  locked: false },
            },
            items      : ['broken_camera_note'],
            npcs       : ['guard_static'],
            onEnter    : () => {
                if (State.hasFlag('alarm_triggered')) {
                    Terminal.printLine('⚠ Les lumières rouges clignotent. L\'alarme est active.', 'danger');
                }
            },
            onExit     : null,
        },

        // ——————————————————————————
        // NIVEAU 0 — SALLE 07
        // ——————————————————————————
        'room_07': {
            id         : 'room_07',
            name       : 'Salle 07 — Archives',
            level      : 0,
            description: [
                'Des étagères métalliques croulant sous les dossiers.',
                'Une odeur de papier moisi flotte dans l\'air.',
                'Un classeur rouge attire le regard.',
                'Le sol est recouvert de poussière — sauf un chemin piétiné.',
            ],
            atmosphere : 'dusty',
            exits      : {
                west : { to: 'corridor_0', locked: false },
            },
            items      : ['classeur_rouge', 'dossier_ghost', 'cle_rouille'],
            npcs       : [],
            onEnter    : () => {
                if (!State.hasFlag('visited_room_07')) {
                    State.setFlag('visited_room_07');
                    Story.trigger('discover_archives');
                }
            },
            onExit     : null,
        },

        // ——————————————————————————
        // NIVEAU 0 — SALLE SERVEUR
        // ——————————————————————————
        'server_room': {
            id         : 'server_room',
            name       : 'Salle Serveur — CORE',
            level      : 0,
            description: [
                'Des rangées de serveurs bourdonnent en cadence.',
                'Les voyants clignotent — vert, orange, rouge.',
                'Un terminal central attend une commande.',
                'La température est glaciale.',
            ],
            atmosphere : 'tense',
            exits      : {
                east : { to: 'corridor_0', locked: false },
                up   : { to: 'server_room_b2', locked: true, flag: 'access_b2', hint: 'L\'ascenseur de service est hors ligne.' },
            },
            items      : ['terminal_core', 'cable_sectionne'],
            npcs       : ['ghost_signal'],
            onEnter    : () => {
                if (!State.hasFlag('visited_server_room')) {
                    State.setFlag('visited_server_room');
                    Story.trigger('ghost_first_contact');
                }
            },
            onExit     : () => {
                State.setFlag('left_server_room');
            },
        },

        // ——————————————————————————
        // NIVEAU 0 — ASCENSEUR
        // ——————————————————————————
        'elevator_0': {
            id         : 'elevator_0',
            name       : 'Ascenseur — Niveau 0',
            level      : 0,
            description: [
                'Une cabine d\'ascenseur industrielle.',
                'Le panneau de contrôle est partiellement arraché.',
                'Les boutons disponibles : B2, 0, 3.',
                'B2 est barré d\'un autocollant rouge.',
            ],
            atmosphere : 'confined',
            exits      : {
                south : { to: 'corridor_0',    locked: false },
                up    : { to: 'floor_3',        locked: true, flag: 'access_floor3', hint: 'Le niveau 3 nécessite une autorisation.' },
                down  : { to: 'basement_0',     locked: true, flag: 'access_basement', hint: 'B2 est verrouillé.' },
            },
            items      : ['graffiti_mur'],
            npcs       : [],
            onEnter    : null,
            onExit     : null,
        },

        // ——————————————————————————
        // NIVEAU B2 — SOUS-SOL
        // ——————————————————————————
        'basement_0': {
            id         : 'basement_0',
            name       : 'Sous-sol B2 — Zone Restreinte',
            level      : -1,
            description: [
                'L\'obscurité est presque totale.',
                'Des tuyaux rouillés courent au plafond.',
                'Une lueur verte filtre sous une porte au nord.',
                'Tu entends quelque chose — ou quelqu\'un.',
            ],
            atmosphere : 'dark',
            exits      : {
                up    : { to: 'elevator_0', locked: false },
                north : { to: 'vault_room', locked: true, flag: 'access_vault', hint: 'La porte émet un bip. Code requis.' },
            },
            items      : ['lampe_cassee', 'graffiti_sol'],
            npcs       : ['shadow_entity'],
            onEnter    : () => {
                if (!State.hasFlag('visited_basement')) {
                    State.setFlag('visited_basement');
                    Story.trigger('basement_discovery');
                }
                Terminal.printLine('⚠ Visibilité réduite.', 'warning');
            },
            onExit     : null,
        },

        // ——————————————————————————
        // VAULT
        // ——————————————————————————
        'vault_room': {
            id         : 'vault_room',
            name       : 'Vault — Salle Zéro',
            level      : -1,
            description: [
                'Une pièce parfaitement cubique.',
                'Les murs sont couverts de code binaire gravé.',
                'Au centre : une console hexagonale pulsante.',
                'C\'est ici que tout a commencé.',
            ],
            atmosphere  : 'eerie',
            exits       : {
                south : { to: 'basement_0', locked: false },
            },
            items       : ['console_centrale', 'fragment_memoire'],
            npcs        : ['ghost_core'],
            onEnter     : () => {
                State.setFlag('reached_vault');
                Story.trigger('vault_revelation');
            },
            onExit      : null,
        },

        // ——————————————————————————
        // NIVEAU 3
        // ——————————————————————————
        'floor_3': {
            id         : 'floor_3',
            name       : 'Niveau 3 — Quartiers',
            level      : 3,
            description: [
                'Des espaces de vie abandonnés.',
                'Des tasses de café encore posées sur les bureaux.',
                'Les écrans affichent toujours leurs derniers rapports.',
                'Quelque chose a poussé tout le monde à partir vite.',
            ],
            atmosphere : 'abandoned',
            exits      : {
                down  : { to: 'elevator_0', locked: false },
                north : { to: 'server_room_b2', locked: true, flag: 'access_b2_floor3', hint: 'Passerelle technique verrouillée.' },
            },
            items      : ['rapport_incident', 'photo_equipe', 'badge_level3'],
            npcs       : [],
            onEnter    : () => {
                if (!State.hasFlag('visited_floor3')) {
                    State.setFlag('visited_floor3');
                    Story.trigger('floor3_discovery');
                }
            },
            onExit     : null,
        },

        // ——————————————————————————
        // SALLE SERVEUR B2
        // ——————————————————————————
        'server_room_b2': {
            id         : 'server_room_b2',
            name       : 'Salle Serveur B2 — GHOST CORE',
            level      : -1,
            description: [
                'La pièce vibre d\'une énergie électrique.',
                'Un unique serveur noir occupe tout le centre.',
                'Des câbles de données s\'enfoncent dans le sol.',
                'L\'écran principal affiche : GHOST v0.1 — ONLINE',
            ],
            atmosphere : 'climax',
            exits      : {
                south : { to: 'floor_3',   locked: false },
                down  : { to: 'vault_room', locked: false },
            },
            items      : ['ghost_core_terminal'],
            npcs       : ['ghost_final'],
            onEnter    : () => {
                State.setFlag('reached_ghost_core');
                Story.trigger('final_confrontation');
            },
            onExit     : null,
        },

    };

    // =============================
    // ETAT INTERNE
    // =============================
    let currentZoneId = CONFIG.defaultZone;
    let previousZoneId = null;

    // =============================
    // HELPERS
    // =============================
    function getZone(id) {
        return ZONES[id] || null;
    }

    function resolveDirection(input) {
        return DIRECTIONS[input.toLowerCase()] || null;
    }

    // Vue normalisée pour commands.js / State
    function getLocation(id) {
        const zoneId = id || currentZoneId;
        const zone   = getZone(zoneId);
        if (!zone) return null;

        const exits = [];
        Object.entries(zone.exits || {}).forEach(([, data]) => {
            const open = !data.locked || State.hasFlag(data.flag);
            if (open && data.to && !exits.includes(data.to)) {
                exits.push(data.to);
            }
        });

        const desc = Array.isArray(zone.description)
            ? zone.description.join('\n')
            : (zone.description || '');

        return {
            id          : zone.id,
            name        : zone.name,
            description : desc,
            items       : zone.items,
            npcs        : zone.npcs,
            exits,
            files       : zone.files || {},
        };
    }

    function setZone(zoneId) {
        const zone = getZone(zoneId);
        if (!zone) return false;
        currentZoneId  = zoneId;
        previousZoneId = null;
        State.setLocation(zoneId);
        return true;
    }

    function goToZone(zoneId) {
        const current = getZone(currentZoneId);
        const canGo   = current && Object.values(current.exits || {}).some(
            e => e.to === zoneId && (!e.locked || State.hasFlag(e.flag))
        );

        if (!canGo && zoneId !== currentZoneId) {
            Terminal.printLine(`Destination "${zoneId}" inaccessible.`, 'error');
            return false;
        }

        return _travelTo(zoneId);
    }

    // =============================
    // LOOK — Décrire la zone
    // =============================
    function look() {
        const zone = getZone(currentZoneId);
        if (!zone) return;

        Terminal.printLine('');
        Terminal.printLine(`[ ${zone.name.toUpperCase()} ]`, 'title');
        Terminal.printLine('══════════════════════════════', 'separator');

        zone.description.forEach(line => {
            Terminal.printLine(line, 'story');
        });

        Terminal.printLine('');
        _printExits(zone);
        _printItems(zone);
        _printNpcs(zone);
        Terminal.printLine('');
    }

    function _printExits(zone) {
        const exits = Object.entries(zone.exits);
        if (!exits.length) {
            Terminal.printLine('Sorties  : aucune.', 'muted');
            return;
        }

        const parts = exits.map(([dir, data]) => {
            const locked = data.locked ? ' 🔒' : '';
            return `${dir} (${ZONES[data.to]?.name || data.to})${locked}`;
        });

        Terminal.printLine(`Sorties  : ${parts.join(' | ')}`, 'info');
    }

    function _printItems(zone) {
        if (!zone.items.length) {
            Terminal.printLine('Objets   : —', 'muted');
            return;
        }
        Terminal.printLine(`Objets   : ${zone.items.join(', ')}`, 'info');
    }

    function _printNpcs(zone) {
        if (!zone.npcs.length) {
            Terminal.printLine('Présents : —', 'muted');
            return;
        }
        Terminal.printLine(`Présents : ${zone.npcs.join(', ')}`, 'warning');
    }

    // =============================
    // MOVE — Se déplacer
    // =============================
    function move(input) {
        const direction = resolveDirection(input);

        if (!direction) {
            Terminal.printLine(`Direction inconnue : "${input}".`, 'error');
            return false;
        }

        if (direction === 'back') {
            return _goBack();
        }

        const zone = getZone(currentZoneId);
        const exit = zone.exits[direction];

        if (!exit) {
            Terminal.printLine('Rien dans cette direction.', 'muted');
            return false;
        }

        if (exit.locked) {
            if (!State.hasFlag(exit.flag)) {
                Terminal.printLine(exit.hint || 'Accès refusé.', 'error');
                return false;
            }
        }

        return _travelTo(exit.to);
    }

    function _goBack() {
        if (!previousZoneId) {
            Terminal.printLine('Pas de chemin retour disponible.', 'muted');
            return false;
        }
        return _travelTo(previousZoneId);
    }

    function _travelTo(zoneId) {
        const target = getZone(zoneId);
        if (!target) {
            Terminal.printLine('Zone introuvable.', 'error');
            return false;
        }

        const current = getZone(currentZoneId);
        if (current?.onExit) current.onExit();

        previousZoneId = currentZoneId;
        currentZoneId  = zoneId;

        State.setLocation(zoneId);

        Terminal.printLine('');
        Terminal.printLine(`> Déplacement vers ${target.name}...`, 'muted');
        Terminal.printLine('');

        if (target.onEnter) target.onEnter();

        look();
        return true;
    }

    // =============================
    // SCAN — Inspecter la zone
    // =============================
    function scan() {
        const zone = getZone(currentZoneId);
        Terminal.printLine('');
        Terminal.printLine('[ SCAN ]', 'title');
        Terminal.printLine(`Zone     : ${zone.name}`, 'info');
        Terminal.printLine(`ID       : ${zone.id}`, 'muted');
        Terminal.printLine(`Niveau   : ${zone.level}`, 'muted');
        Terminal.printLine(`Ambiance : ${zone.atmosphere}`, 'muted');
        _printItems(zone);
        _printNpcs(zone);
        _printExits(zone);
        Terminal.printLine('');
    }

    // =============================
    // UNLOCK — Déverrouiller une sortie
    // =============================
    function unlock(direction) {
        const dir  = resolveDirection(direction);
        const zone = getZone(currentZoneId);
        const exit = zone?.exits[dir];

        if (!exit) {
            Terminal.printLine('Aucune sortie dans cette direction.', 'error');
            return;
        }

        if (!exit.locked) {
            Terminal.printLine('Cette sortie est déjà déverrouillée.', 'muted');
            return;
        }

        if (State.hasFlag(exit.flag)) {
            exit.locked = false;
            Terminal.printLine(`✓ Sortie ${dir} déverrouillée.`, 'success');
        } else {
            Terminal.printLine(exit.hint || 'Impossible de déverrouiller.', 'error');
        }
    }

    // =============================
    // INIT
    // =============================
    function init() {
        currentZoneId  = CONFIG.defaultZone;
        previousZoneId = null;
        State.setLocation(currentZoneId);

        const zone = getZone(currentZoneId);
        if (zone?.onEnter) zone.onEnter();

        console.log('[World] Initialisé →', currentZoneId);
    }

    // =============================
    // GETTERS
    // =============================
    function getCurrentZone()   { return getZone(currentZoneId); }
    function getCurrentZoneId() { return currentZoneId; }
    function getAllZones()       { return ZONES; }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        init,
        look,
        move,
        scan,
        unlock,
        getLocation,
        setZone,
        goToZone,
        resolveDirection,
        getCurrentZone,
        getCurrentZoneId,
        getAllZones,
        getZone,
    };

})();

