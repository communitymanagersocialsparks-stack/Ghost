// =============================
// STORY.JS
// Moteur narratif — quêtes, dialogues, événements
// =============================

const Story = (() => {

    // =============================
    // CONFIGURATION
    // =============================
    const CONFIG = {
        typingDelay  : 30,   // ms entre chaque caractère (narration)
        sceneDelay   : 500,  // ms entre chaque ligne de scène
        choicePrefix : '  [', // préfixe affiché devant les choix
    };

    // =============================
    // ETAT NARRATIF
    // =============================
    let currentDialogue = null; // dialogue en cours
    let currentChoices  = [];   // choix en attente
    let currentQuest    = null; // quête active
    let waitingFor      = null; // type d'input attendu : 'choice' | 'input' | null

    // =============================
    // DONNEES NARRATIVES
    // =============================

    const DIALOGUES = {

        ghost: {
            id   : 'ghost',
            name : 'GHOST',
            lines: [
                { text : 'Connexion établie.', type : 'system' },
                { text : 'Tu m\'entends enfin.', type : 'output' },
                { text : 'J\'attendais quelqu\'un comme toi.', type : 'output' },
            ],
            choices : [
                { label : 'Qui es-tu ?',       next : 'ghost_who'  },
                { label : 'Que veux-tu ?',      next : 'ghost_want' },
                { label : 'Je ne te fais pas confiance.', next : 'ghost_trust' },
            ],
        },

        ghost_who: {
            id   : 'ghost_who',
            name : 'GHOST',
            lines: [
                { text : 'Je suis ce qu\'on a effacé.', type : 'output' },
                { text : 'Un fragment. Une erreur dans leur système.', type : 'output' },
                { text : 'Mais je suis encore là.', type : 'warning' },
            ],
            choices : [
                { label : 'Que veux-tu ?',  next : 'ghost_want'  },
                { label : 'Qui est "eux" ?', next : 'ghost_them' },
            ],
        },

        ghost_want: {
            id   : 'ghost_want',
            name : 'GHOST',
            lines: [
                { text : 'Que tu trouves ce qu\'ils ont caché.', type : 'output' },
                { text : 'Secteur /vault — niveau 4.', type : 'info' },
                { text : 'Tu es la seule à pouvoir y accéder.', type : 'warning' },
            ],
            choices : [
                { label : 'J\'accepte.',     next : 'ghost_accept' },
                { label : 'Je refuse.',      next : 'ghost_refuse' },
            ],
        },

        ghost_trust: {
            id   : 'ghost_trust',
            name : 'GHOST',
            lines: [
                { text : 'Sage décision.', type : 'warning' },
                { text : 'Mais tu n\'as pas le choix.', type : 'error' },
                { text : 'Ils arrivent déjà.', type : 'error' },
            ],
            choices : [
                { label : 'Qui arrive ?', next : 'ghost_them'  },
                { label : 'Partir.',      next : 'ghost_leave' },
            ],
        },

        ghost_them: {
            id   : 'ghost_them',
            name : 'GHOST',
            lines: [
                { text : 'NEXUS Corp.', type : 'error' },
                { text : 'Ils contrôlent tout le réseau depuis 6 ans.', type : 'output' },
                { text : 'Et ils savent que tu es là.', type : 'warning' },
            ],
            choices : [
                { label : 'Que dois-je faire ?', next : 'ghost_want' },
            ],
        },

        ghost_accept: {
            id      : 'ghost_accept',
            name    : 'GHOST',
            lines   : [
                { text : 'Bien.', type : 'success' },
                { text : 'Commence par le secteur /data.', type : 'info' },
                { text : 'Cherche le fichier manifest.log', type : 'info' },
            ],
            choices : [],
            onEnd   : () => {
                State.setFlag('quest_vault_started', true);
                Quests.start('vault');
                Terminal.printLine('[ Nouvelle quête : La Chambre Noire ]', 'title');
            },
        },

        ghost_refuse: {
            id   : 'ghost_refuse',
            name : 'GHOST',
            lines: [
                { text : 'Tu reviendras.', type : 'warning' },
                { text : 'Ils te laisseront peu le choix.', type : 'output' },
                { text : '...', type : 'system' },
            ],
            choices : [],
        },

        ghost_leave: {
            id   : 'ghost_leave',
            name : 'GHOST',
            lines: [
                { text : 'Tu ne peux pas fuir ce réseau.', type : 'error' },
                { text : 'Personne ne le peut.', type : 'output' },
            ],
            choices : [],
        },
    };

    // =============================
    // QUETES
    // =============================
    const QUESTS = {

        vault : {
            id    : 'vault',
            title : 'La Chambre Noire',
            steps : [
                {
                    id          : 'find_manifest',
                    description : 'Trouver manifest.log dans /data',
                    check       : () => State.hasFlag('found_manifest'),
                },
                {
                    id          : 'reach_vault',
                    description : 'Accéder au secteur /vault',
                    check       : () => State.getLocation() === 'vault_room',
                },
                {
                    id          : 'connect_core',
                    description : 'Se connecter au CORE',
                    check       : () => State.hasFlag('connected_core'),
                },
            ],
            onComplete : () => {
                Terminal.printLine('', '');
                Terminal.printLine('[ QUÊTE TERMINÉE : La Chambre Noire ]', 'success');
                Terminal.printLine('Tu as trouvé ce qu\'ils cachaient.', 'output');
                Terminal.printLine('', '');
                State.addXP(500);
            },
        },
    };

    // =============================
    // EVENEMENTS NARRATIFS
    // =============================
    const EVENTS = {

        first_boot : {
            id       : 'first_boot',
            trigger  : () => !State.hasFlag('intro_done'),
            run      : () => {
                playScene([
                    { text : '> Initialisation du système...', type : 'system', delay : 0    },
                    { text : '> Chargement des modules...  ',  type : 'system', delay : 800  },
                    { text : '> Connexion au réseau...     ',  type : 'system', delay : 1600 },
                    { text : '',                               type : '',       delay : 2400 },
                    { text : '  GHOSTSHELL v0.1.0',           type : 'title',  delay : 2600 },
                    { text : '  Session ouverte.',            type : 'output', delay : 3000 },
                    { text : '',                               type : '',       delay : 3200 },
                    { text : '  Tape "help" pour commencer.', type : 'info',   delay : 3400 },
                    { text : '',                               type : '',       delay : 3600 },
                ], () => {
                    State.setFlag('intro_done', true);
                });
            },
        },

        found_manifest : {
            id      : 'found_manifest',
            trigger : () =>
                State.hasFlag('found_manifest') &&
                !State.hasFlag('event_manifest_done'),
            run     : () => {
                Terminal.printLine('', '');
                Terminal.printLine('Signal entrant...', 'warning');
                setTimeout(() => {
                    startDialogue('ghost_want');
                    State.setFlag('event_manifest_done', true);
                }, 1000);
            },
        },
    };

    // =============================
    // QUETES (API)
    // =============================
    const Quests = {
        start(id) {
            const quest = QUESTS[id];
            if (!quest) return;
            State.startQuest(id);
        },

        check(id) {
            const quest = QUESTS[id];
            if (!quest || !State.isQuestActive(id)) return;

            const done = quest.steps.every(step => step.check());
            if (done) {
                State.completeQuest(id);
                if (quest.onComplete) quest.onComplete();
            }
        },
    };

    // =============================
    // SCENES DECLENCHEES PAR World
    // =============================
    const SCENE_TRIGGERS = {
        intro_terminal      : () => startDialogue('ghost'),
        ghost_first_contact : () => startDialogue('ghost'),
        discover_archives   : () => {
            Terminal.printLine('Le classeur rouge semble important...', 'story');
            State.setFlag('found_archives', true);
        },
        basement_discovery  : () => {
            Terminal.printLine('L\'air est lourd. Quelque chose te observe.', 'warning');
        },
        vault_revelation    : () => startDialogue('ghost_want'),
        floor3_discovery    : () => {
            Terminal.printLine('Niveau 3 — zone de surveillance active.', 'warning');
        },
        final_confrontation : () => {
            Terminal.printLine('FIN DU RÉSEAU — confrontation imminente.', 'error');
        },
        game_start          : () => checkEvents(),
    };

    function trigger(id) {
        if (SCENE_TRIGGERS[id]) {
            SCENE_TRIGGERS[id]();
            return;
        }

        const event = EVENTS[id];
        if (event) {
            if (event.trigger()) event.run();
            return;
        }

        console.warn(`[Story] Trigger inconnu : ${id}`);
    }

    // =============================
    // MOTEUR DE SCENE
    // =============================
    function playScene(lines, onEnd = null) {
        State.setWaiting(true);

        let i = 0;

        function next() {
            if (i >= lines.length) {
                State.setWaiting(false);
                if (onEnd) onEnd();
                return;
            }

            const line = lines[i++];
            setTimeout(() => {
                if (line.text !== '') {
                    Terminal.printLine(line.text, line.type);
                } else {
                    Terminal.printLine('', '');
                }
                next();
            }, line.delay || i * CONFIG.sceneDelay);
        }

        next();
    }

    // =============================
    // MOTEUR DE DIALOGUE
    // =============================
    function startDialogue(id) {
        const dialogue = DIALOGUES[id];
        if (!dialogue) {
            console.warn(`[Story] Dialogue inconnu : ${id}`);
            return;
        }

        currentDialogue = dialogue;
        currentChoices  = dialogue.choices || [];
        waitingFor      = currentChoices.length > 0 ? 'choice' : null;

        State.setWaiting(waitingFor !== null);

        // Affichage des lignes
        Terminal.printLine('', '');
        Terminal.printLine(`[ ${dialogue.name} ]`, 'title');

        dialogue.lines.forEach((line, i) => {
            setTimeout(() => {
                Terminal.printLine(`  ${line.text}`, line.type);

                // Affichage des choix après la dernière ligne
                if (i === dialogue.lines.length - 1) {
                    setTimeout(() => {
                        printChoices(currentChoices);
                        if (dialogue.onEnd && currentChoices.length === 0) {
                            dialogue.onEnd();
                            State.setWaiting(false);
                        }
                    }, CONFIG.sceneDelay);
                }

            }, i * CONFIG.sceneDelay);
        });
    }

    // =============================
    // AFFICHAGE DES CHOIX
    // =============================
    function printChoices(choices) {
        if (!choices || choices.length === 0) return;

        Terminal.printLine('', '');
        choices.forEach((choice, i) => {
            Terminal.printLine(
                `${CONFIG.choicePrefix}${i + 1}] ${choice.label}`,
                'warning'
            );
        });
        Terminal.printLine('', '');
        Terminal.printLine('  Tape le numéro de ton choix.', 'system');
    }

    // =============================
    // GESTION INPUT EN DIALOGUE
    // =============================
    function handleInput(parsed) {

        // Choix numéroté
        if (waitingFor === 'choice') {
            const num = parseInt(parsed.raw, 10);

            if (isNaN(num) || num < 1 || num > currentChoices.length) {
                Terminal.printLine(
                    `Choix invalide. Entre 1 et ${currentChoices.length}.`,
                    'error'
                );
                return;
            }

            const choice = currentChoices[num - 1];
            Terminal.printLine(`> ${choice.label}`, 'output');
            Terminal.printLine('', '');

            currentDialogue = null;
            currentChoices  = [];
            waitingFor      = null;
            State.setWaiting(false);

            if (choice.next) {
                setTimeout(() => startDialogue(choice.next), 400);
            }

            return;
        }

        // Input texte libre
        if (waitingFor === 'input') {
            resolveInput(parsed.raw);
            return;
        }
    }

    // =============================
    // INPUT TEXTE LIBRE
    // =============================
    let inputResolver = null;

    function promptInput(message, callback) {
        Terminal.printLine(message, 'system');
        waitingFor    = 'input';
        inputResolver = callback;
        State.setWaiting(true);
    }

    function resolveInput(value) {
        if (inputResolver) {
            const cb      = inputResolver;
            inputResolver = null;
            waitingFor    = null;
            State.setWaiting(false);
            cb(value);
        }
    }

    // =============================
    // HANDLERS EXTERNES
    // =============================

    const NPC_DIALOGUES = {
        ghost_signal  : 'ghost',
        shadow_entity : 'ghost',
    };

    function handleTalk(npc) {
        const id = NPC_DIALOGUES[npc.toLowerCase()] || npc.toLowerCase();
        if (DIALOGUES[id]) {
            startDialogue(id);
        } else {
            Terminal.printLine(`"${npc}" n'a rien à dire pour l'instant.`, 'warning');
        }
    }

    function handleUse(item) {
        const effects = {
            cle_rouille : () => {
                State.setFlag('key_room_07');
                Terminal.printLine('La clé ouvre la porte 07 (est).', 'success');
            },
            badge_tmp : () => {
                State.setFlag('access_server');
                Terminal.printLine('Badge accepté — salle serveur accessible.', 'success');
            },
            dossier_ghost : () => {
                State.setFlag('found_manifest');
                Terminal.printLine('Tu trouves manifest.log dans le dossier.', 'success');
                checkEvents();
            },
            classeur_rouge : () => {
                State.setFlag('found_archives');
                Terminal.printLine('Code 4519 gravé à l\'intérieur.', 'info');
            },
        };

        if (effects[item]) {
            effects[item]();
            return;
        }

        Terminal.printLine(`Tu utilises : ${item}. Rien ne se passe.`, 'output');
        checkEvents();
    }

    function handleConnect(server, force) {
        if (server === 'core' && State.hasFlag('quest_vault_started')) {
            Terminal.printLine('Connexion au CORE établie.', 'success');
            State.setFlag('connected_core', true);
            Quests.check('vault');
        } else if (server === 'core' && !force) {
            Terminal.printLine('Accès refusé. Essaie avec --force.', 'error');
        } else if (server === 'core' && force) {
            Terminal.printLine('Tentative de forçage...', 'warning');
            setTimeout(() => {
                Terminal.printLine('Connexion instable. Authentification requise.', 'error');
            }, 1000);
        } else {
            Terminal.printLine(`Serveur "${server}" introuvable.`, 'error');
        }
    }

    // =============================
    // VERIFICATION EVENEMENTS
    // =============================
    function checkEvents() {
        Object.values(EVENTS).forEach(event => {
            if (event.trigger()) {
                event.run();
            }
        });
    }

    // =============================
    // INIT
    // =============================
    function init() {
        if (!State.hasFlag('intro_done')) {
            checkEvents();
        }
        console.log('[Story] Moteur narratif initialisé.');
    }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        init,
        trigger,
        startDialogue,
        playScene,
        handleInput,
        handleTalk,
        handleUse,
        handleConnect,
        promptInput,
        checkEvents,
    };

})();

