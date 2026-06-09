// =============================
// COMMANDS.JS
// Registre et logique des commandes
// =============================

const Commands = (() => {

    // =============================
    // REGISTRE
    // =============================
    const registry = new Map();

    // =============================
    // ENREGISTREMENT
    // =============================
    function register(name, handler, meta = {}) {
        registry.set(name, {
            handler,
            description : meta.description || '',
            usage       : meta.usage       || name,
            category    : meta.category    || 'general',
            hidden      : meta.hidden      || false,
        });
    }

    // =============================
    // RECUPERATION
    // =============================
    function get(name) {
        const entry = registry.get(name);
        return entry ? entry.handler : null;
    }

    function list() {
        const names = [];
        registry.forEach((entry, name) => {
            if (!entry.hidden) names.push(name);
        });
        return names;
    }

    // =============================
    // INITIALISATION DES COMMANDES
    // =============================
    function init() {

        // ---------------------------
        // CATEGORIE : SYSTEME
        // ---------------------------

        register('help', (parsed) => {
            const category = Parser.getParam(parsed, 0);
            printHelp(category);
        }, {
            description : 'Affiche les commandes disponibles',
            usage       : 'help [categorie]',
            category    : 'system',
        });

        register('clear', () => {
            Terminal.clear();
        }, {
            description : 'Efface le terminal',
            usage       : 'clear',
            category    : 'system',
        });

        register('history', (parsed) => {
            const sub = Parser.getParam(parsed, 0);
            if (sub === 'clear') {
                History.clear();
            } else if (sub === 'search') {
                const query   = Parser.getParam(parsed, 1);
                const results = History.search(query);
                if (results.length === 0) {
                    Terminal.printLine('Aucun résultat.', 'warning');
                } else {
                    results.forEach(r => Terminal.printLine(`  → ${r}`, 'info'));
                }
            } else {
                History.print();
            }
        }, {
            description : 'Gère l\'historique des commandes',
            usage       : 'history [clear|search <query>]',
            category    : 'system',
        });

        register('echo', (parsed) => {
            const text = Parser.getRawArgs(parsed);
            Terminal.printLine(text || '', 'output');
        }, {
            description : 'Affiche un texte dans le terminal',
            usage       : 'echo <texte>',
            category    : 'system',
        });

        register('date', () => {
            const now = new Date();
            Terminal.printLine(
                `Date système : ${now.toLocaleString('fr-FR')}`,
                'info'
            );
        }, {
            description : 'Affiche la date et l\'heure système',
            usage       : 'date',
            category    : 'system',
        });

        register('whoami', () => {
            const player = State.get('player');
            Terminal.printLine(
                `Utilisateur : ${player.name} | Niveau : ${player.level} | XP : ${player.xp}`,
                'success'
            );
        }, {
            description : 'Affiche les infos du joueur',
            usage       : 'whoami',
            category    : 'system',
        });

        register('version', () => {
            Terminal.printLine('GhostShell v0.1.0 — moteur narratif terminal', 'system');
        }, {
            description : 'Affiche la version du jeu',
            usage       : 'version',
            category    : 'system',
            hidden      : true,
        });

        // ---------------------------
        // CATEGORIE : NAVIGATION
        // ---------------------------

        register('ls', (parsed) => {
            const verbose = Parser.hasFlag(parsed, '-l');
            const loc     = State.getCurrentLocation();
            if (!loc) return;
            printLocation(loc, verbose);
        }, {
            description : 'Liste les éléments de la zone actuelle',
            usage       : 'ls [-l]',
            category    : 'navigation',
        });

        register('cd', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<direction|zone>')) return;
            moveToLocation(Parser.getParam(parsed, 0));
        }, {
            description : 'Se déplace (n/s/e/w ou id de zone)',
            usage       : 'cd <direction|zone>',
            category    : 'navigation',
        });

        register('go', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<direction>')) return;
            World.move(Parser.getParam(parsed, 0));
        }, {
            description : 'Alias de déplacement directionnel',
            usage       : 'go <direction>',
            category    : 'navigation',
        });

        register('map', () => {
            const loc = State.getCurrentLocation();
            if (!loc) return;
            printMap(loc);
        }, {
            description : 'Affiche la carte des zones accessibles',
            usage       : 'map',
            category    : 'navigation',
        });

        register('look', () => {
            World.look();
        }, {
            description : 'Examine la zone actuelle en détail',
            usage       : 'look',
            category    : 'navigation',
        });

        // ---------------------------
        // CATEGORIE : INTERACTION
        // ---------------------------

        register('scan', (parsed) => {
            const target = Parser.getParam(parsed, 0);
            if (!target) {
                World.scan();
                return;
            }
            runScan(target);
        }, {
            description : 'Scanne un élément ou la zone',
            usage       : 'scan [cible]',
            category    : 'interaction',
        });

        register('read', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<fichier>')) return;
            const file = Parser.getParam(parsed, 0);
            readFile(file);
        }, {
            description : 'Lit un fichier ou document',
            usage       : 'read <fichier>',
            category    : 'interaction',
        });

        register('take', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<objet>')) return;
            const item = Parser.getParam(parsed, 0);
            takeItem(item);
        }, {
            description : 'Ramasse un objet',
            usage       : 'take <objet>',
            category    : 'interaction',
        });

        register('use', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<objet>')) return;
            const item = Parser.getParam(parsed, 0);
            useItem(item);
        }, {
            description : 'Utilise un objet de l\'inventaire',
            usage       : 'use <objet>',
            category    : 'interaction',
        });

        register('talk', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<personnage>')) return;
            const npc = Parser.getParam(parsed, 0);
            talkTo(npc);
        }, {
            description : 'Parle à un personnage',
            usage       : 'talk <personnage>',
            category    : 'interaction',
        });

        register('connect', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<serveur>')) return;
            const server = Parser.getParam(parsed, 0);
            const force  = Parser.hasFlag(parsed, '--force');
            connectTo(server, force);
        }, {
            description : 'Se connecte à un serveur',
            usage       : 'connect [--force] <serveur>',
            category    : 'interaction',
        });

        // ---------------------------
        // CATEGORIE : INVENTAIRE
        // ---------------------------

        register('inventory', () => {
            printInventory();
        }, {
            description : 'Affiche l\'inventaire',
            usage       : 'inventory',
            category    : 'inventory',
        });

        register('drop', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<objet>')) return;
            const item = Parser.getParam(parsed, 0);
            dropItem(item);
        }, {
            description : 'Pose un objet au sol',
            usage       : 'drop <objet>',
            category    : 'inventory',
        });

        register('inspect', (parsed) => {
            if (!Parser.requireArgs(parsed, 1, '<objet>')) return;
            const item = Parser.getParam(parsed, 0);
            inspectItem(item);
        }, {
            description : 'Inspecte un objet en détail',
            usage       : 'inspect <objet>',
            category    : 'inventory',
        });

        // ---------------------------
        // CATEGORIE : JEU
        // ---------------------------

        register('save', () => {
            State.save();
            Terminal.printLine('Partie sauvegardée.', 'success');
        }, {
            description : 'Sauvegarde la partie',
            usage       : 'save',
            category    : 'game',
        });

        register('load', () => {
            State.load();
        }, {
            description : 'Charge la dernière sauvegarde',
            usage       : 'load',
            category    : 'game',
        });

        register('status', () => {
            printStatus();
        }, {
            description : 'Affiche le statut complet du joueur',
            usage       : 'status',
            category    : 'game',
        });

        register('quit', () => {
            Terminal.printLine('Déconnexion...', 'warning');
            setTimeout(() => {
                Terminal.printLine('Session terminée. À bientôt.', 'system');
            }, 800);
        }, {
            description : 'Quitte la session',
            usage       : 'quit',
            category    : 'game',
        });

        console.log(`[Commands] ${registry.size} commande(s) enregistrée(s).`);
    }

    // =============================
    // HELPERS INTERNES
    // =============================

    // --- HELP ---
    function printHelp(category) {
        Terminal.printLine('', '');
        Terminal.printLine('╔══════════════════════════════╗', 'system');
        Terminal.printLine('║         AIDE GHOSTSHELL      ║', 'system');
        Terminal.printLine('╚══════════════════════════════╝', 'system');

        const categories = {
            system      : '⚙  Système',
            navigation  : '🗺  Navigation',
            interaction : '🔌  Interaction',
            inventory   : '🎒  Inventaire',
            game        : '💾  Jeu',
        };

        const filter = category
            ? [category]
            : Object.keys(categories);

        filter.forEach(cat => {
            if (!categories[cat]) return;

            Terminal.printLine('', '');
            Terminal.printLine(`  ${categories[cat]}`, 'title');
            Terminal.printLine('  ' + '─'.repeat(26), 'system');

            registry.forEach((entry, name) => {
                if (entry.category === cat && !entry.hidden) {
                    const pad = name.padEnd(12, ' ');
                    Terminal.printLine(
                        `  ${pad}  ${entry.description}`,
                        'info'
                    );
                }
            });
        });

        Terminal.printLine('', '');
        Terminal.printLine('  Tape "help <categorie>" pour filtrer.', 'system');
        Terminal.printLine('', '');
    }

    // --- LOCATION ---
    function printLocation(loc, verbose) {
        Terminal.printLine('', '');
        Terminal.printLine(`[ ${loc.name.toUpperCase()} ]`, 'title');

        if (loc.items && loc.items.length > 0) {
            Terminal.printLine('  Objets :', 'system');
            loc.items.forEach(item => {
                Terminal.printLine(`    → ${item}`, 'info');
            });
        }

        if (loc.npcs && loc.npcs.length > 0) {
            Terminal.printLine('  Personnages :', 'system');
            loc.npcs.forEach(npc => {
                Terminal.printLine(`    → ${npc}`, 'warning');
            });
        }

        if (loc.exits && loc.exits.length > 0) {
            Terminal.printLine('  Sorties :', 'system');
            loc.exits.forEach(exitId => {
                const z = World.getZone(exitId);
                Terminal.printLine(
                    `    → cd ${exitId}  (${z ? z.name : exitId})`,
                    'success'
                );
            });
        }

        if (verbose) {
            Terminal.printLine('  Description :', 'system');
            Terminal.printLine(`    ${loc.description}`, 'output');
        }

        Terminal.printLine('', '');
    }

    // --- MAP ---
    function printMap(loc) {
        const zone = World.getCurrentZone();
        Terminal.printLine('', '');
        Terminal.printLine('  Carte locale :', 'system');
        if (!zone || !zone.exits || !Object.keys(zone.exits).length) {
            Terminal.printLine('  Aucune sortie disponible.', 'warning');
        } else {
            Object.entries(zone.exits).forEach(([dir, data]) => {
                const locked = data.locked && !State.hasFlag(data.flag) ? ' 🔒' : '';
                const dest   = World.getZone(data.to);
                Terminal.printLine(
                    `    ${dir} → ${dest ? dest.name : data.to}${locked}`,
                    'info'
                );
            });
        }
        Terminal.printLine('', '');
    }

    // --- SCAN ---
    function runScan(target) {
        const loc = State.getCurrentLocation();
        if (!loc) {
            Terminal.printLine('Zone inconnue.', 'error');
            return;
        }
        Terminal.printLine('Scan en cours...', 'system');

        setTimeout(() => {
            if (!target) {
                Terminal.printLine(`Zone : ${loc.name}`, 'info');
                Terminal.printLine(`Objets détectés : ${(loc.items || []).length}`, 'info');
                Terminal.printLine(`Entités détectées : ${(loc.npcs || []).length}`, 'info');
            } else {
                const found =
                    (loc.items || []).includes(target) ||
                    (loc.npcs  || []).includes(target);

                if (found) {
                    Terminal.printLine(`Cible "${target}" détectée.`, 'success');
                } else {
                    Terminal.printLine(`Cible "${target}" introuvable.`, 'error');
                }
            }
        }, 600);
    }

    // --- READ ---
    function readFile(file) {
        const loc   = State.getCurrentLocation();
        const files = loc?.files || {};

        if (files[file]) {
            Terminal.printLine('', '');
            Terminal.printLine(`── ${file} ──`, 'system');
            Terminal.printLine(files[file], 'output');
            Terminal.printLine('', '');
            return;
        }

        const itemData = State.getItemData(file);
        if (itemData && (loc?.items || []).includes(file)) {
            Terminal.printLine('', '');
            Terminal.printLine(`── ${file} ──`, 'system');
            Terminal.printLine(itemData.description, 'output');
            Terminal.printLine('', '');
            return;
        }

        Terminal.printLine(`Fichier "${file}" introuvable ici.`, 'error');
    }

    // --- TAKE ---
    function takeItem(item) {
        const loc = State.getCurrentLocation();
        const idx = (loc.items || []).indexOf(item);

        if (idx === -1) {
            Terminal.printLine(`Objet "${item}" introuvable ici.`, 'error');
            return;
        }

        loc.items.splice(idx, 1);
        State.addItem(item);
    }

    // --- DROP ---
    function dropItem(item) {
        const removed = State.removeItem(item);
        if (!removed) {
            Terminal.printLine(`Objet "${item}" absent de l'inventaire.`, 'error');
            return;
        }

        const loc = State.getCurrentLocation();
        loc.items = loc.items || [];
        loc.items.push(item);
        Terminal.printLine(`"${item}" posé au sol.`, 'warning');
    }

    // --- USE ---
    function useItem(item) {
        if (!State.hasItem(item)) {
            Terminal.printLine(`Objet "${item}" absent de l'inventaire.`, 'error');
            return;
        }
        Story.handleUse(item);
    }

    // --- INSPECT ---
    function inspectItem(item) {
        const data = State.getItemData(item);
        if (!data) {
            Terminal.printLine(`"${item}" : aucune information disponible.`, 'warning');
            return;
        }

        Terminal.printLine('', '');
        Terminal.printLine(`── ${item} ──`, 'system');
        Terminal.printLine(data.description || 'Aucune description.', 'output');
        if (data.tags) {
            Terminal.printLine(`Tags : ${data.tags.join(', ')}`, 'info');
        }
        Terminal.printLine('', '');
    }

    // --- TALK ---
    function talkTo(npc) {
        const loc  = State.getCurrentLocation();
        const npcs = loc.npcs || [];

        if (!npcs.includes(npc)) {
            Terminal.printLine(`"${npc}" n'est pas ici.`, 'error');
            return;
        }

        Story.handleTalk(npc);
    }

    // --- CONNECT ---
    function connectTo(server, force) {
        Terminal.printLine(
            `Tentative de connexion à "${server}"${force ? ' (forcée)' : ''}...`,
            'system'
        );

        setTimeout(() => {
            Story.handleConnect(server, force);
        }, 800);
    }

    // --- MOVE ---
    function moveToLocation(dest) {
        if (World.resolveDirection(dest)) {
            World.move(dest);
            return;
        }

        if (World.getZone(dest)) {
            World.goToZone(dest);
            return;
        }

        Terminal.printLine(
            `Destination "${dest}" introuvable. Utilise une direction (n/s/e/w) ou un id de zone.`,
            'error'
        );
    }

    // --- INVENTORY ---
    function printInventory() {
        const items = State.getInventory();

        Terminal.printLine('', '');
        Terminal.printLine('── Inventaire ──', 'system');

        if (items.length === 0) {
            Terminal.printLine('  Vide.', 'warning');
        } else {
            items.forEach(item => {
                Terminal.printLine(`  → ${item}`, 'info');
            });
        }

        Terminal.printLine('', '');
    }

    // --- STATUS ---
    function printStatus() {
        const player = State.get('player');
        const loc    = State.getCurrentLocation();

        if (!loc) {
            Terminal.printLine('Statut indisponible.', 'error');
            return;
        }

        Terminal.printLine('', '');
        Terminal.printLine('╔══════════════════════════╗', 'system');
        Terminal.printLine('║         STATUT           ║', 'system');
        Terminal.printLine('╚══════════════════════════╝', 'system');
        Terminal.printLine(`  Nom      : ${player.name}`,  'info');
        Terminal.printLine(`  Niveau   : ${player.level}`, 'info');
        Terminal.printLine(`  XP       : ${player.xp}`,   'info');
        Terminal.printLine(`  Zone     : ${loc.name}`,    'info');
        Terminal.printLine(`  Objets   : ${State.getInventory().length}`, 'info');
        Terminal.printLine('', '');
    }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        init,
        get,
        list,
        register,
    };

})();

