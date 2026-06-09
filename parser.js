// =============================
// PARSER.JS
// Analyse et dispatche les commandes
// =============================

const Parser = (() => {

    // =============================
    // CONFIGURATION
    // =============================
    const MAX_ARGS = 10;
    const MAX_LENGTH = 200;

    // =============================
    // NETTOYAGE INPUT
    // =============================
    function sanitize(raw) {
        return raw
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .slice(0, MAX_LENGTH);
    }

    // =============================
    // PARSING PRINCIPAL
    // =============================
    function parse(raw) {
        if (!raw || raw.trim() === '') return null;

        const clean  = sanitize(raw);
        const parts  = clean.split(' ').slice(0, MAX_ARGS);
        const cmd    = parts[0];
        const args   = parts.slice(1);
        const flags  = args.filter(a => a.startsWith('-'));
        const params = args.filter(a => !a.startsWith('-'));

        return {
            raw    : raw.trim(),
            clean,
            cmd,
            args,
            flags,
            params,
        };
    }

    // =============================
    // DISPATCH
    // =============================
    function dispatch(raw) {
        const parsed = parse(raw);
        if (!parsed) return;

        // Historique
        History.push(parsed.raw);

        // Affichage commande
        Terminal.printCommand(parsed.raw);

        // Vérif si jeu en attente d'input spécial
        if (State.isWaiting()) {
            Story.handleInput(parsed);
            return;
        }

        // Routage commande
        const handler = Commands.get(parsed.cmd);

        if (handler) {
            handler(parsed);
        } else {
            Terminal.printLine(
                `Commande introuvable : "${parsed.cmd}". Tape "help" pour la liste.`,
                'error'
            );
        }
    }

    // =============================
    // UTILITAIRES
    // =============================

    // Vérifie qu'un flag est présent
    function hasFlag(parsed, flag) {
        return parsed.flags.includes(flag);
    }

    // Récupère un param par index
    function getParam(parsed, index) {
        return parsed.params[index] ?? null;
    }

    // Reconstruit la string après le cmd
    function getRawArgs(parsed) {
        return parsed.args.join(' ');
    }

    // Vérifie le nombre minimum d'args
    function requireArgs(parsed, min, usage) {
        if (parsed.args.length < min) {
            Terminal.printLine(
                `Usage : ${parsed.cmd} ${usage}`,
                'warning'
            );
            return false;
        }
        return true;
    }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        parse,
        dispatch,
        hasFlag,
        getParam,
        getRawArgs,
        requireArgs,
    };

})();

