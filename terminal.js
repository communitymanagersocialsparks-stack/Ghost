// TERMINAL.JS
// Moteur principal du terminal
// =============================

const Terminal = (() => {

    // =============================
    // ELEMENTS DU DOM
    // =============================
    const output        = document.getElementById('output');
    const input         = document.getElementById('command-input');
    const promptEl      = document.getElementById('prompt');
    const terminalBody  = document.getElementById('terminal-body');
    const terminalTitle = document.getElementById('terminal-title');
    const clockEl       = document.getElementById('clock');
    const pathEl        = document.getElementById('current-path');
    const levelEl       = document.getElementById('level-info');
    const hintEl        = document.getElementById('hint-bar');
    const bootScreen    = document.getElementById('boot-screen');
    const mainScreen    = document.getElementById('main-screen');

    // =============================
    // CONFIGURATION
    // =============================
    const CONFIG = {
        typingSpeed    : 18,
        bootDelay      : 200,
        maxOutputLines : 200,
    };

    // =============================
    // MESSAGES DE BOOT
    // =============================
    const BOOT_LINES = [
        '  ██████╗ ██╗  ██╗ ██████╗ ███████╗████████╗',
        '██╔════╝ ██║  ██║██╔═══██╗██╔════╝╚══██╔══╝',
        '██║  ███╗███████║██║   ██║███████╗   ██║   ',
        '██║   ██║██╔══██║██║   ██║╚════██║   ██║   ',
        '╚██████╔╝██║  ██║╚██████╔╝███████║   ██║   ',
        ' ╚═════╝ ╚═╝  ╚═╝ ╚═════╝ ╚══════╝   ╚═╝   ',
        '',
        '  OS VERSION  : 1.0.4',
        '  BUILD       : 2024-GHOST',
        '  KERNEL      : GhostKernel x64',
        '',
        '  [OK] Chargement du noyau............',
        '  [OK] Initialisation mémoire..........',
        '  [OK] Montage du système de fichiers..',
        '  [OK] Chargement des modules...........',
        '  [OK] Connexion au réseau..............',
        '  [!!] INTRUSION DÉTECTÉE...............',
        '  [!!] SYSTÈME COMPROMIS................',
        '  [OK] Isolation du terminal............',
        '',
        '  Bienvenue, Agent.',
        '  Ta mission commence maintenant.',
        '',
    ];

    // =============================
    // HORLOGE
    // =============================
    function startClock() {
        function updateClock() {
            const now = new Date();
            const h   = String(now.getHours()).padStart(2, '0');
            const m   = String(now.getMinutes()).padStart(2, '0');
            const s   = String(now.getSeconds()).padStart(2, '0');
            if (clockEl) clockEl.textContent = `${h}:${m}:${s}`;
        }
        updateClock();
        setInterval(updateClock, 1000);
    }

    // =============================
    // BOOT SEQUENCE
    // =============================
    function boot() {
        return new Promise((resolve) => {
            const bootText = document.getElementById('boot-text');
            let lineIndex  = 0;

            function printNextLine() {
                if (lineIndex >= BOOT_LINES.length) {
                    setTimeout(() => {
                        if (bootScreen) bootScreen.classList.add('hidden');
                        if (mainScreen) mainScreen.classList.remove('hidden');
                        resolve();
                    }, 600);
                    return;
                }
                const line = BOOT_LINES[lineIndex];
                if (bootText) bootText.textContent += line + '\n';
                lineIndex++;
                setTimeout(printNextLine, CONFIG.bootDelay);
            }

            printNextLine();
        });
    }

    // =============================
    // AFFICHER UNE LIGNE
    // =============================
    function printLine(text, type = 'output') {
        const el = document.createElement('div');
        el.classList.add('output-line');
        if (type) el.classList.add(type);
        el.textContent = text;
        output.appendChild(el);
        cleanOutput();
        scrollBottom();
    }

    // =============================
    // AFFICHER AVEC EFFET TYPING
    // =============================
    function printTyping(text, type = 'output', speed = CONFIG.typingSpeed) {
        return new Promise((resolve) => {
            const el = document.createElement('div');
            el.classList.add('output-line');
            if (type) el.classList.add(type);
            output.appendChild(el);
            scrollBottom();

            let i = 0;
            function typeChar() {
                if (i < text.length) {
                    el.textContent += text[i];
                    i++;
                    scrollBottom();
                    setTimeout(typeChar, speed);
                } else {
                    resolve();
                }
            }
            typeChar();
        });
    }

    // =============================
    // AFFICHER UN BLOC DE LIGNES
    // =============================
    function printBlock(lines = [], type = 'response', delay = 60) {
        return new Promise((resolve) => {
            let i = 0;
            function next() {
                if (i >= lines.length) { resolve(); return; }
                printLine(lines[i], type);
                i++;
                setTimeout(next, delay);
            }
            next();
        });
    }

    // =============================
    // AFFICHER LA COMMANDE JOUEUR
    // =============================
    function printCommand(cmd) {
        const el = document.createElement('div');
        el.classList.add('output-line', 'command');
        el.textContent = `${promptEl ? promptEl.textContent : 'root@ghost:~$'} ${cmd}`;
        output.appendChild(el);
        cleanOutput();
        scrollBottom();
    }

    // =============================
    // VIDER LE TERMINAL
    // =============================
    function clear() {
        output.innerHTML = '';
    }

    // =============================
    // SCROLL EN BAS
    // =============================
    function scrollBottom() {
        if (terminalBody) terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    // =============================
    // NETTOYAGE AUTO
    // =============================
    function cleanOutput() {
        const lines = output.querySelectorAll('.output-line');
        if (lines.length > CONFIG.maxOutputLines) {
            const toRemove = lines.length - CONFIG.maxOutputLines;
            for (let i = 0; i < toRemove; i++) {
                output.removeChild(lines[i]);
            }
        }
    }

    // =============================
    // METTRE A JOUR L'UI
    // =============================
    function updatePrompt(path) {
        const display = `root@ghost:${path}$`;
        if (promptEl)      promptEl.textContent     = display;
        if (terminalTitle) terminalTitle.textContent = `root@ghost:${path}`;
        if (pathEl)        pathEl.textContent        = `PATH: ${path}`;
    }

    function updateLevel(level) {
        if (levelEl) levelEl.textContent = `NIVEAU: ${level}`;
    }

    function updateHint(text) {
        if (hintEl) hintEl.textContent = text;
    }

    // =============================
    // AUTO COMPLETION
    // =============================
    function autoComplete() {
        const val = input.value.trim().toLowerCase();
        if (!val) return;
        const commands = Commands.list();
        const match    = commands.find(cmd => cmd.startsWith(val));
        if (match) input.value = match;
    }

    // =============================
    // GESTION INPUT
    // -- Seul endroit qui lit l'input
    // -- Parser.dispatch gère History + printCommand
    // -- Ici on ne fait PAS History.push ni printCommand
    // =============================
    function setupInput() {

        // Focus automatique au clic
        document.addEventListener('click', () => input.focus());

        input.addEventListener('keydown', (e) => {

            // ENTREE
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                input.value = '';
                if (cmd === '') return;

                // Si le jeu attend un input narratif
                // on passe directement à Story, pas de dispatch
                if (State.isWaiting()) {
                    printCommand(cmd);
                    Story.handleInput(Parser.parse(cmd));
                    return;
                }

                // Cas normal : Parser gère tout (History + printCommand + routing)
                Parser.dispatch(cmd);
                return;
            }

            // FLECHE HAUT
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = History.prev(input.value);
                if (prev !== undefined) input.value = prev;
                return;
            }

            // FLECHE BAS
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = History.next();
                input.value = next !== undefined ? next : '';
                return;
            }

            // TAB
            if (e.key === 'Tab') {
                e.preventDefault();
                autoComplete();
                return;
            }
        });
    }

    // =============================
    // INITIALISATION
    // =============================
    async function init() {
        startClock();
        await boot();
        setupInput();
        input.focus();

        // Init modules dans l'ordre
        State.init();
        History.init();
        FileSystem.init();
        State.setFlag('intro_done', true);
        World.init();
        Commands.init();
        Story.init();

        const player = State.get('player');
        const loc    = State.getCurrentLocation();
        if (player) updateLevel(player.level);
        if (loc) {
            updatePrompt(`~/${loc.id}`);
            updateHint('ASTUCE: look, cd north, help');
        }

        // Message de bienvenue
        printLine('', 'empty');
        await printTyping('Système initialisé. En attente de commandes...', 'system', 25);
        printLine('', 'empty');
        printLine('Tape "help" pour voir les commandes disponibles.', 'warning');
        printLine('', 'empty');
    }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        init,
        printLine,
        printTyping,
        printBlock,
        printCommand,
        clear,
        updatePrompt,
        updateLevel,
        updateHint,
        scrollBottom,
    };

})();

// =============================
// LANCEMENT
// =============================
document.addEventListener('DOMContentLoaded', () => {
    Terminal.init();
});
