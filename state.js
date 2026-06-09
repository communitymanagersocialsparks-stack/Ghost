// =============================
// STATE.JS
// Gestionnaire d'état global du jeu
// =============================

const State = (() => {

    // =============================
    // CONFIGURATION
    // =============================
    const CONFIG = {
        storageKey  : 'ghostshell_save',
        version     : '0.1.0',
        maxSaveSlots: 3,
    };

    // =============================
    // ETAT PAR DEFAUT
    // =============================
    const DEFAULT_STATE = {
        meta : {
            version   : CONFIG.version,
            createdAt : null,
            savedAt   : null,
            slot      : 0,
        },
        player : {
            name  : 'UNKNOWN',
            level : 1,
            xp    : 0,
            xpMax : 100,
        },
        location  : 'terminal_0',
        inventory : [],
        flags     : {},
        quests    : {
            active    : [],
            completed : [],
        },
        session : {
            isWaiting  : false,
            inputLocked: false,
            startedAt  : null,
        },
    };

    // =============================
    // ETAT COURANT
    // =============================
    let state = {};

    // =============================
    // DEEP CLONE
    // =============================
    function clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // =============================
    // INIT
    // =============================
    function init() {
        state = clone(DEFAULT_STATE);
        state.meta.createdAt  = Date.now();
        state.session.startedAt = Date.now();
        console.log('[State] Etat initialisé.');
    }

    // =============================
    // GETTER GENERIQUE
    // =============================
    function get(key) {
        if (key in state) return state[key];
        console.warn(`[State] Clé inconnue : "${key}"`);
        return null;
    }

    // =============================
    // SETTER GENERIQUE
    // =============================
    function set(key, value) {
        if (!(key in state)) {
            console.warn(`[State] Clé inconnue : "${key}"`);
            return;
        }
        state[key] = value;
    }

    // =============================
    // FLAGS
    // =============================
    function setFlag(flag, value = true) {
        state.flags[flag] = value;
    }

    function hasFlag(flag) {
        return !!state.flags[flag];
    }

    function removeFlag(flag) {
        delete state.flags[flag];
    }

    function getFlags() {
        return { ...state.flags };
    }

    // =============================
    // LOCATION
    // =============================
    function getLocation() {
        return state.location;
    }

    function setLocation(id) {
        state.location = id;
    }

    function getCurrentLocation() {
        if (typeof World !== 'undefined' && World.getLocation) {
            const id = World.getCurrentZoneId
                ? World.getCurrentZoneId()
                : state.location;
            return World.getLocation(id);
        }
        return null;
    }

    const ITEM_DATA = {
        badge_tmp         : { description : 'Badge temporaire NEXUS. Accès niveau 0.', tags : ['key'] },
        note_froissee     : { description : 'Note illisible, mentionne "GHOST".', tags : ['clue'] },
        broken_camera_note: { description : 'Mémo caméra : "07 avant minuit".', tags : ['clue'] },
        classeur_rouge    : { description : 'Classeur scellé. Code gravé : 4519.', tags : ['clue'] },
        dossier_ghost     : { description : 'Dossier classifié sur le projet GHOST.', tags : ['quest'] },
        cle_rouille       : { description : 'Clé rouillée. Ouvre la porte 07.', tags : ['key'] },
        terminal_core     : { description : 'Terminal CORE. Commande : connect core', tags : ['device'] },
        cable_sectionne   : { description : 'Câble réseau sectionné.', tags : ['junk'] },
        graffiti_mur      : { description : '"Ils nous regardent" — gravé au cutter.', tags : ['clue'] },
        lampe_cassee      : { description : 'Lampe hors service.', tags : ['junk'] },
        graffiti_sol      : { description : 'Flèche vers le nord.', tags : ['clue'] },
    };

    function getItemData(item) {
        return ITEM_DATA[item] ? { ...ITEM_DATA[item] } : null;
    }

    // =============================
    // INVENTAIRE
    // =============================
    function getInventory() {
        return [...state.inventory];
    }

    function addItem(item) {
        if (state.inventory.includes(item)) {
            Terminal.printLine(`Tu possèdes déjà : ${item}.`, 'warning');
            return false;
        }
        state.inventory.push(item);
        Terminal.printLine(`[ + ${item} ajouté à l'inventaire ]`, 'success');
        return true;
    }

    function removeItem(item) {
        const index = state.inventory.indexOf(item);
        if (index === -1) {
            Terminal.printLine(`Objet introuvable : ${item}.`, 'error');
            return false;
        }
        state.inventory.splice(index, 1);
        Terminal.printLine(`[ - ${item} retiré de l'inventaire ]`, 'warning');
        return true;
    }

    function hasItem(item) {
        return state.inventory.includes(item);
    }

    // =============================
    // JOUEUR
    // =============================
    function getPlayer() {
        return { ...state.player };
    }

    function setPlayerName(name) {
        state.player.name = name;
    }

    function addXP(amount) {
        state.player.xp += amount;
        Terminal.printLine(`[ + ${amount} XP ]`, 'success');

        while (state.player.xp >= state.player.xpMax) {
            levelUp();
        }
    }

    function levelUp() {
        state.player.xp    -= state.player.xpMax;
        state.player.level += 1;
        state.player.xpMax  = Math.floor(state.player.xpMax * 1.5);

        Terminal.printLine('', '');
        Terminal.printLine('╔══════════════════════════╗', 'success');
        Terminal.printLine('║      NIVEAU SUPÉRIEUR    ║', 'success');
        Terminal.printLine(`║      Niveau ${String(state.player.level).padEnd(13)}║`, 'success');
        Terminal.printLine('╚══════════════════════════╝', 'success');
        Terminal.printLine('', '');

        setFlag(`level_${state.player.level}`);
    }

    // =============================
    // QUETES
    // =============================
    function startQuest(id) {
        if (state.quests.active.includes(id) ||
            state.quests.completed.includes(id)) return;

        state.quests.active.push(id);
        Terminal.printLine(`[ Quête démarrée : ${id} ]`, 'title');
    }

    function completeQuest(id) {
        const index = state.quests.active.indexOf(id);
        if (index === -1) return;

        state.quests.active.splice(index, 1);
        state.quests.completed.push(id);
    }

    function isQuestActive(id) {
        return state.quests.active.includes(id);
    }

    function isQuestDone(id) {
        return state.quests.completed.includes(id);
    }

    function getQuests() {
        return {
            active    : [...state.quests.active],
            completed : [...state.quests.completed],
        };
    }

    // =============================
    // SESSION
    // =============================
    function setWaiting(bool) {
        state.session.isWaiting  = bool;
        state.session.inputLocked = bool;
    }

    function isWaiting() {
        return state.session.isWaiting;
    }

    function isLocked() {
        return state.session.inputLocked;
    }

    // =============================
    // SAUVEGARDE
    // =============================
    function save(slot = 0) {
        if (slot < 0 || slot >= CONFIG.maxSaveSlots) {
            Terminal.printLine(`Slot invalide. Choisis entre 0 et ${CONFIG.maxSaveSlots - 1}.`, 'error');
            return;
        }

        state.meta.savedAt = Date.now();
        state.meta.slot    = slot;

        const key = `${CONFIG.storageKey}_${slot}`;

        try {
            localStorage.setItem(key, JSON.stringify(state));
            Terminal.printLine('', '');
            Terminal.printLine(`[ Sauvegarde — slot ${slot} ]`, 'success');
            Terminal.printLine(`  ${formatDate(state.meta.savedAt)}`, 'info');
            Terminal.printLine('', '');
        } catch (e) {
            Terminal.printLine('Erreur de sauvegarde.', 'error');
            console.error('[State] save() :', e);
        }
    }

    // =============================
    // CHARGEMENT
    // =============================
    function load(slot = 0) {
        const key = `${CONFIG.storageKey}_${slot}`;

        try {
            const raw = localStorage.getItem(key);
            if (!raw) {
                Terminal.printLine(`Aucune sauvegarde dans le slot ${slot}.`, 'warning');
                return false;
            }

            const saved = JSON.parse(raw);

            if (saved.meta.version !== CONFIG.version) {
                Terminal.printLine(
                    `Version incompatible : ${saved.meta.version} ≠ ${CONFIG.version}.`,
                    'error'
                );
                return false;
            }

            state = saved;
            state.session.isWaiting   = false;
            state.session.inputLocked = false;
            state.session.startedAt   = Date.now();

            Terminal.printLine('', '');
            Terminal.printLine(`[ Chargement — slot ${slot} ]`, 'success');
            Terminal.printLine(`  Sauvé le ${formatDate(state.meta.savedAt)}`, 'info');
            Terminal.printLine('', '');

            return true;

        } catch (e) {
            Terminal.printLine('Erreur de chargement.', 'error');
            console.error('[State] load() :', e);
            return false;
        }
    }

    // =============================
    // LISTE DES SAUVEGARDES
    // =============================
    function listSaves() {
        Terminal.printLine('', '');
        Terminal.printLine('── Sauvegardes ──', 'system');

        let found = false;

        for (let i = 0; i < CONFIG.maxSaveSlots; i++) {
            const key = `${CONFIG.storageKey}_${i}`;
            const raw = localStorage.getItem(key);

            if (raw) {
                try {
                    const s = JSON.parse(raw);
                    Terminal.printLine(
                        `  [${i}] ${s.player.name} — Niv.${s.player.level} — ${formatDate(s.meta.savedAt)}`,
                        'info'
                    );
                    found = true;
                } catch {
                    Terminal.printLine(`  [${i}] Données corrompues.`, 'error');
                }
            } else {
                Terminal.printLine(`  [${i}] Vide.`, 'warning');
            }
        }

        if (!found) {
            Terminal.printLine('  Aucune sauvegarde trouvée.', 'warning');
        }

        Terminal.printLine('', '');
    }

    // =============================
    // RESET
    // =============================
    function reset() {
        state = clone(DEFAULT_STATE);
        state.meta.createdAt    = Date.now();
        state.session.startedAt = Date.now();
        Terminal.printLine('[ État réinitialisé. ]', 'warning');
    }

    // =============================
    // UTILITAIRE DATE
    // =============================
    function formatDate(ts) {
        if (!ts) return 'inconnue';
        const d = new Date(ts);
        return d.toLocaleDateString('fr-FR') + ' ' +
               d.toLocaleTimeString('fr-FR');
    }

    // =============================
    // DEBUG
    // =============================
    function dump() {
        Terminal.printLine('', '');
        Terminal.printLine('── STATE DUMP ──', 'system');
        Terminal.printLine(JSON.stringify(state, null, 2), 'info');
        Terminal.printLine('', '');
    }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        init,
        get,
        set,

        // Flags
        setFlag,
        hasFlag,
        removeFlag,
        getFlags,

        // Location
        getLocation,
        setLocation,
        getCurrentLocation,

        // Inventaire
        getInventory,
        addItem,
        removeItem,
        hasItem,
        getItemData,

        // Joueur
        getPlayer,
        setPlayerName,
        addXP,

        // Quêtes
        startQuest,
        completeQuest,
        isQuestActive,
        isQuestDone,
        getQuests,

        // Session
        setWaiting,
        isWaiting,
        isLocked,

        // Persistence
        save,
        load,
        listSaves,
        reset,

        // Debug
        dump,
    };

})();

