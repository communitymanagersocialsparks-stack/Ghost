// =============================
// MAIN.JS
// Point d'entrée principal
// =============================

const Game = (() => {

    // =============================
    // CONFIGURATION
    // =============================
    const CONFIG = {
        name       : 'GHOSTSHELL',
        version    : '0.1.0',
        bootDelay  : 80,
        modules    : ['State', 'FileSystem', 'World', 'Story', 'Parser', 'Terminal'],
    };

    // =============================
    // ETAT GLOBAL
    // =============================
    let initialized = false;
    let running     = false;

    // =============================
    // BOOT SEQUENCE
    // =============================
    const BOOT_LINES = [
        '█▀▀ █░█ █▀█ █▀ ▀█▀ █▀ █░█ █▀▀ █░░ █░░',
        '█▄█ █▀█ █▄█ ▄█ ░█░ ▄█ █▀█ ██▄ █▄▄ █▄▄',
        '',
        `v${CONFIG.version} — SYSTEM BOOT`,
        '─────────────────────────────────────',
        '[OK] Chargement noyau...',
        '[OK] Initialisation mémoire...',
        '[OK] Montage filesystem...',
        '[OK] Chargement carte monde...',
        '[OK] Injection narrative...',
        '[OK] Parser en ligne...',
        '─────────────────────────────────────',
        'CONNEXION ÉTABLIE.',
        '',
        'Tape  help  pour afficher les commandes.',
        '',
    ];

    async function _bootSequence() {
        Terminal.clear();

        for (const line of BOOT_LINES) {
            await _delay(CONFIG.bootDelay);
            Terminal.printLine(line, _getBootStyle(line));
        }
    }

    function _getBootStyle(line) {
        if (line.startsWith('[OK]'))     return 'success';
        if (line.startsWith('[ERR]'))    return 'error';
        if (line.startsWith('[WARN]'))   return 'warning';
        if (line.startsWith('v'))        return 'muted';
        if (line.startsWith('█'))        return 'title';
        if (line === 'CONNEXION ÉTABLIE.') return 'highlight';
        return 'default';
    }

    // =============================
    // INIT MODULES
    // =============================
    function _initModules() {
        const results = [];

        CONFIG.modules.forEach(name => {
            try {
                const mod = _getModule(name);
                if (mod && typeof mod.init === 'function') {
                    mod.init();
                    results.push({ name, ok: true });
                } else {
                    results.push({ name, ok: false, reason: 'init() manquant' });
                }
            } catch (e) {
                results.push({ name, ok: false, reason: e.message });
            }
        });

        results.forEach(r => {
            if (!r.ok) {
                console.warn(`[Game] Module ${r.name} — ERREUR : ${r.reason}`);
            } else {
                console.log(`[Game] Module ${r.name} — OK`);
            }
        });

        return results.every(r => r.ok);
    }

    function _getModule(name) {
        const map = {
            'State'     : typeof State      !== 'undefined' ? State      : null,
            'FileSystem': typeof FileSystem !== 'undefined' ? FileSystem : null,
            'World'     : typeof World      !== 'undefined' ? World      : null,
            'Story'     : typeof Story      !== 'undefined' ? Story      : null,
            'Parser'    : typeof Parser     !== 'undefined' ? Parser     : null,
            'Terminal'  : typeof Terminal   !== 'undefined' ? Terminal   : null,
        };
        return map[name] || null;
    }

    // =============================
    // INIT COMMANDES
    // =============================
    function _initCommands() {
        if (typeof Commands === 'undefined') {
            console.warn('[Game] Commands non trouvé.');
            return;
        }
        Commands.init();
        console.log('[Game] Commands — OK');
    }

    // =============================
    // BOUCLE PRINCIPALE
    // =============================
    function _startLoop() {
        running = true;

        Terminal.onInput((rawInput) => {
            if (!running) return;

            const input = rawInput.trim();
            if (!input) return;

            _handleInput(input);
        });
    }

    function _handleInput(input) {
        // Commandes système prioritaires
        if (_handleSystemCommand(input)) return;

        // Déléguer au parser
        Parser.parse(input);
    }

    // =============================
    // COMMANDES SYSTEME
    // =============================
    const SYSTEM_COMMANDS = {

        'quit': () => {
            Terminal.printLine('');
            Terminal.printLine('Déconnexion en cours...', 'muted');
            Terminal.printLine('À bientôt.', 'muted');
            setTimeout(() => stop(), 800);
        },

        'exit': () => SYSTEM_COMMANDS['quit'](),

        'restart': () => {
            Terminal.printLine('Redémarrage...', 'muted');
            setTimeout(() => restart(), 800);
        },

        'clear': () => {
            Terminal.clear();
        },

        'credits': () => {
            _showCredits();
        },

        'version': () => {
            Terminal.printLine(`${CONFIG.name} v${CONFIG.version}`, 'info');
        },

    };

    function _handleSystemCommand(input) {
        const cmd = input.toLowerCase().split(' ')[0];
        if (SYSTEM_COMMANDS[cmd]) {
            SYSTEM_COMMANDS[cmd](input);
            return true;
        }
        return false;
    }

    // =============================
    // CREDITS
    // =============================
    function _showCredits() {
        Terminal.printLine('');
        Terminal.printLine('[ CREDITS ]', 'title');
        Terminal.printLine('──────────────────────', 'separator');
        Terminal.printLine(`Jeu      : ${CONFIG.name}`, 'info');
        Terminal.printLine(`Version  : ${CONFIG.version}`, 'info');
        Terminal.printLine('Moteur   : HTML5 / CSS / JS vanilla', 'info');
        Terminal.printLine('Auteur   : ???', 'muted');
        Terminal.printLine('');
        Terminal.printLine('"Il n\'y a pas de fantôme dans la machine.', 'story');
        Terminal.printLine(' La machine EST le fantôme."', 'story');
        Terminal.printLine('');
    }

    // =============================
    // SAVE / LOAD
    // =============================
    function save() {
        try {
            const data = State.serialize();
            localStorage.setItem(`${CONFIG.name}_save`, JSON.stringify(data));
            Terminal.printLine('✓ Partie sauvegardée.', 'success');
        } catch (e) {
            Terminal.printLine('✗ Erreur de sauvegarde.', 'error');
            console.error('[Game] Save error:', e);
        }
    }

    function load() {
        try {
            const raw = localStorage.getItem(`${CONFIG.name}_save`);
            if (!raw) {
                Terminal.printLine('Aucune sauvegarde trouvée.', 'muted');
                return false;
            }
            const data = JSON.parse(raw);
            State.deserialize(data);
            Terminal.printLine('✓ Partie chargée.', 'success');
            World.look();
            return true;
        } catch (e) {
            Terminal.printLine('✗ Erreur de chargement.', 'error');
            console.error('[Game] Load error:', e);
            return false;
        }
    }

    function deleteSave() {
        localStorage.removeItem(`${CONFIG.name}_save`);
        Terminal.printLine('Sauvegarde supprimée.', 'muted');
    }

    function hasSave() {
        return !!localStorage.getItem(`${CONFIG.name}_save`);
    }

    // =============================
    // AUTOSAVE
    // =============================
    function _initAutosave() {
        setInterval(() => {
            if (running && State.isDirty()) {
                save();
                State.markClean();
            }
        }, 30000);
    }

    // =============================
    // LIFECYCLE
    // =============================
    async function start() {
        if (initialized) {
            console.warn('[Game] Déjà initialisé.');
            return;
        }

        console.log(`[Game] Démarrage ${CONFIG.name} v${CONFIG.version}`);

        // 1 — Modules
        const modulesOk = _initModules();
        if (!modulesOk) {
            console.error('[Game] Échec init modules. Abandon.');
            return;
        }

        // 2 — Commandes
        _initCommands();

        // 3 — Boot screen
        await _bootSequence();

        // 4 — Save existante ?
        if (hasSave()) {
            Terminal.printLine('Sauvegarde détectée. Charger ? (load / new)', 'highlight');
            Terminal.onceInput((input) => {
                if (input.trim().toLowerCase() === 'load') {
                    load();
                } else {
                    _newGame();
                }
                _startLoop();
            });
        } else {
            _newGame();
            _startLoop();
        }

        // 5 — Autosave
        _initAutosave();

        initialized = true;
        running     = true;

        console.log('[Game] Prêt.');
    }

    function _newGame() {
        State.reset();
        FileSystem.init();
        World.init();
        Story.trigger('game_start');
    }

    function stop() {
        running = false;
        Terminal.printLine('');
        Terminal.printLine('██ SESSION TERMINÉE ██', 'title');
        Terminal.disable();
    }

    function restart() {
        initialized = false;
        running     = false;
        Terminal.enable();
        start();
    }

    function pause() {
        running = false;
        Terminal.printLine('[PAUSE]', 'muted');
    }

    function resume() {
        running = true;
        Terminal.printLine('[REPRISE]', 'muted');
    }

    // =============================
    // UTILITAIRES
    // =============================
    function _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function isRunning()     { return running; }
    function isInitialized() { return initialized; }
    function getConfig()     { return { ...CONFIG }; }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        start,
        stop,
        restart,
        pause,
        resume,
        save,
        load,
        deleteSave,
        hasSave,
        isRunning,
        isInitialized,
        getConfig,
    };

})();

// =============================
// LANCEMENT
// =============================
document.addEventListener('DOMContentLoaded', () => {
    Game.start();
});

