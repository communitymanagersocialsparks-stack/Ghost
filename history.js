// =============================
// HISTORY.JS
// Historique des commandes
// =============================

const History = (() => {

    // =============================
    // CONFIGURATION
    // =============================
    const CONFIG = {
        maxSize    : 100,   // nb max de commandes stockées
        storageKey : 'ghost_history', // clé localStorage
    };

    // =============================
    // ETAT
    // =============================
    let history  = [];
    let cursor   = -1;
    let tempInput = ''; // sauvegarde l'input en cours

    // =============================
    // CHARGEMENT DEPUIS LOCALSTORAGE
    // =============================
    function load() {
        try {
            const saved = localStorage.getItem(CONFIG.storageKey);
            if (saved) {
                history = JSON.parse(saved);
                if (!Array.isArray(history)) history = [];
            }
        } catch (e) {
            console.warn('[History] Erreur de chargement :', e);
            history = [];
        }
        cursor = -1;
    }

    // =============================
    // SAUVEGARDE DANS LOCALSTORAGE
    // =============================
    function save() {
        try {
            localStorage.setItem(
                CONFIG.storageKey,
                JSON.stringify(history)
            );
        } catch (e) {
            console.warn('[History] Erreur de sauvegarde :', e);
        }
    }

    // =============================
    // AJOUTER UNE COMMANDE
    // =============================
    function push(cmd) {
        if (!cmd || cmd.trim() === '') return;

        // Pas de doublon consécutif
        if (history[0] === cmd) {
            cursor = -1;
            return;
        }

        // Ajout en tête
        history.unshift(cmd);

        // Limite de taille
        if (history.length > CONFIG.maxSize) {
            history = history.slice(0, CONFIG.maxSize);
        }

        cursor = -1;
        save();
    }

    // =============================
    // NAVIGATION HAUT (précédent)
    // =============================
    function prev(currentInput) {
        if (history.length === 0) return currentInput;

        // Sauvegarde l'input si on commence à naviguer
        if (cursor === -1) {
            tempInput = currentInput;
        }

        if (cursor < history.length - 1) {
            cursor++;
        }

        return history[cursor];
    }

    // =============================
    // NAVIGATION BAS (suivant)
    // =============================
    function next() {
        if (cursor <= 0) {
            cursor = -1;
            return tempInput;
        }

        cursor--;
        return history[cursor];
    }

    // =============================
    // RESET CURSEUR
    // =============================
    function resetCursor() {
        cursor    = -1;
        tempInput = '';
    }

    // =============================
    // VIDER L'HISTORIQUE
    // =============================
    function clear() {
        history = [];
        cursor  = -1;
        tempInput = '';

        try {
            localStorage.removeItem(CONFIG.storageKey);
        } catch (e) {
            console.warn('[History] Erreur clear :', e);
        }

        Terminal.printLine('Historique effacé.', 'system');
    }

    // =============================
    // AFFICHER L'HISTORIQUE
    // =============================
    function print() {
        if (history.length === 0) {
            Terminal.printLine('Aucune commande dans l\'historique.', 'warning');
            return;
        }

        Terminal.printLine('─── Historique des commandes ───', 'system');

        history
            .slice()
            .reverse()
            .forEach((cmd, i) => {
                const num = String(i + 1).padStart(3, ' ');
                Terminal.printLine(`  ${num}  ${cmd}`, 'info');
            });

        Terminal.printLine(`─── ${history.length} commande(s) ───`, 'system');
    }

    // =============================
    // RECHERCHE DANS L'HISTORIQUE
    // =============================
    function search(query) {
        if (!query) return [];
        return history.filter(cmd =>
            cmd.includes(query.toLowerCase())
        );
    }

    // =============================
    // GETTERS
    // =============================
    function getAll()    { return [...history]; }
    function getSize()   { return history.length; }
    function getCursor() { return cursor; }

    // =============================
    // INIT
    // =============================
    function init() {
        load();
        console.log(`[History] ${history.length} commande(s) chargée(s).`);
    }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        init,
        push,
        prev,
        next,
        clear,
        print,
        search,
        resetCursor,
        getAll,
        getSize,
        getCursor,
    };

})();

