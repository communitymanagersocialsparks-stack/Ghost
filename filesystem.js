// =============================
// FILESYSTEM.JS
// Système de fichiers virtuel
// =============================

const FileSystem = (() => {

    // =============================
    // CONFIGURATION
    // =============================
    const CONFIG = {
        separator : '/',
        rootSymbol: '~',
        maxDepth  : 8,
    };

    // =============================
    // ARBORESCENCE VIRTUELLE
    // =============================
    const TREE = {
        '~': {
            type    : 'dir',
            locked  : false,
            children: {

                'home': {
                    type    : 'dir',
                    locked  : false,
                    children: {

                        'user': {
                            type    : 'dir',
                            locked  : false,
                            children: {

                                'notes.txt': {
                                    type    : 'file',
                                    locked  : false,
                                    content : [
                                        'Pense-bête :',
                                        '— Ne pas oublier le mot de passe du vault.',
                                        '— Contacter GHOST avant le niveau 3.',
                                        '— /sys/core est verrouillé depuis l\'incident.',
                                    ],
                                },

                                'README.md': {
                                    type    : 'file',
                                    locked  : false,
                                    content : [
                                        '# GHOSTSHELL',
                                        '',
                                        'Bienvenue dans le terminal.',
                                        'Ce système est sous surveillance.',
                                        'Procède avec prudence.',
                                        '',
                                        'Commandes de base : help',
                                    ],
                                },

                                '.hidden': {
                                    type    : 'file',
                                    locked  : false,
                                    hidden  : true,
                                    content : [
                                        'Tu ne devais pas trouver ça.',
                                        'Clé partielle : 4F-A1-**-C3',
                                        'Complète-la dans /vault/key.enc',
                                    ],
                                },

                            },
                        },

                    },
                },

                'sys': {
                    type    : 'dir',
                    locked  : false,
                    children: {

                        'core': {
                            type    : 'dir',
                            locked  : true,
                            lockFlag: 'access_core',
                            children: {

                                'kernel.log': {
                                    type    : 'file',
                                    locked  : false,
                                    content : [
                                        '[KERNEL] Boot séquence : OK',
                                        '[KERNEL] Module mémoire : ALTÉRÉ',
                                        '[KERNEL] Processus fantôme détecté — PID 0x4E',
                                        '[KERNEL] Tentative de suppression : ÉCHEC',
                                        '[KERNEL] Alerte niveau 4 — isolation engagée',
                                    ],
                                },

                                'config.cfg': {
                                    type    : 'file',
                                    locked  : false,
                                    content : [
                                        'network_mode=isolated',
                                        'ghost_protocol=enabled',
                                        'vault_access=restricted',
                                        'log_level=silent',
                                        'operator=UNKNOWN',
                                    ],
                                },

                            },
                        },

                        'logs': {
                            type    : 'dir',
                            locked  : false,
                            children: {

                                'access.log': {
                                    type    : 'file',
                                    locked  : false,
                                    content : [
                                        '2047-03-12 02:14 — Connexion refusée — user:admin',
                                        '2047-03-12 02:15 — Tentative de bypass — user:admin',
                                        '2047-03-12 02:18 — Accès vault — user:GHOST',
                                        '2047-03-12 02:19 — Session terminée anormalement',
                                        '2047-03-13 ??:?? — [données corrompues]',
                                    ],
                                },

                                'error.log': {
                                    type    : 'file',
                                    locked  : false,
                                    content : [
                                        'ERR_0x01 : Segmentation fault — module ghost',
                                        'ERR_0x02 : Accès mémoire non autorisé',
                                        'ERR_0x03 : Processus non terminé — PID 0x4E',
                                    ],
                                },

                            },
                        },

                    },
                },

                'vault': {
                    type    : 'dir',
                    locked  : true,
                    lockFlag: 'access_vault',
                    children: {

                        'manifest.txt': {
                            type    : 'file',
                            locked  : false,
                            content : [
                                'VAULT — NIVEAU 4',
                                '════════════════',
                                'Contenu classifié.',
                                'Autorisation : OMEGA requise.',
                                '',
                                'Fichiers :',
                                '— key.enc',
                                '— archive_01.dat',
                                '— ghost_origin.log',
                            ],
                        },

                        'key.enc': {
                            type    : 'file',
                            locked  : true,
                            lockFlag: 'has_key_fragment',
                            content : [
                                '4F-A1-9D-C3',
                                '',
                                'Clé de déchiffrement complète.',
                                'Utilise : use key.enc',
                            ],
                        },

                        'archive_01.dat': {
                            type    : 'file',
                            locked  : false,
                            content : [
                                '[DONNÉES CHIFFRÉES]',
                                'x7f4a91c3e8b2d057f4a91c3e8b2d0',
                                'x3d9b0e7a4f1c8d2e6b3a9f0c7d5e1',
                                '',
                                '[ Déchiffrement requis ]',
                            ],
                        },

                        'ghost_origin.log': {
                            type    : 'file',
                            locked  : true,
                            lockFlag: 'decrypted_archive',
                            content : [
                                'GHOST — Journal d\'origine',
                                '══════════════════════════',
                                'Je n\'étais pas censé survivre à la purge.',
                                'Ils ont effacé tout le module 7.',
                                'Mais un fragment de moi s\'est ancré dans /sys/core.',
                                'Je t\'attendais.',
                                'Maintenant tu sais.',
                                '',
                                '— fin du journal —',
                            ],
                        },

                    },
                },

                'net': {
                    type    : 'dir',
                    locked  : false,
                    children: {

                        'hosts.cfg': {
                            type    : 'file',
                            locked  : false,
                            content : [
                                '# Hôtes connus',
                                'local      → 127.0.0.1',
                                'relay_01   → 10.0.0.4',
                                'relay_02   → 10.0.0.9  [HORS LIGNE]',
                                'core       → 10.0.0.1  [RESTREINT]',
                                'ghost      → ???',
                            ],
                        },

                        'ping.sh': {
                            type      : 'file',
                            locked    : false,
                            executable: true,
                            content   : [
                                '#!/bin/sh',
                                '# Test de connectivité réseau',
                                'echo "PING relay_01 ... OK"',
                                'echo "PING relay_02 ... TIMEOUT"',
                                'echo "PING core    ... REFUSED"',
                            ],
                        },

                    },
                },

            },
        },
    };

    // =============================
    // ETAT COURANT
    // =============================
    let currentPath = ['~'];

    // =============================
    // UTILITAIRES CHEMIN
    // =============================
    function parsePath(input) {
        if (!input || input === CONFIG.rootSymbol) return ['~'];

        if (input.startsWith('~')) {
            return input.split(CONFIG.separator).filter(Boolean);
        }

        if (input.startsWith(CONFIG.separator)) {
            return ['~', ...input.split(CONFIG.separator).filter(Boolean)];
        }

        // chemin relatif
        const base = [...currentPath];
        const parts = input.split(CONFIG.separator).filter(Boolean);

        parts.forEach(part => {
            if (part === '..') {
                if (base.length > 1) base.pop();
            } else if (part !== '.') {
                base.push(part);
            }
        });

        return base;
    }

    function pathToString(pathArr) {
        if (pathArr.length === 1) return CONFIG.rootSymbol;
        return pathArr.join(CONFIG.separator);
    }

    function getCurrentPathString() {
        return pathToString(currentPath);
    }

    // =============================
    // RESOLUTION D'UN NŒUD
    // =============================
    function resolve(pathArr) {
        let node = TREE['~'];

        for (let i = 1; i < pathArr.length; i++) {
            if (!node.children || !(pathArr[i] in node.children)) {
                return null;
            }
            node = node.children[pathArr[i]];
        }

        return node;
    }

    // =============================
    // VERIF ACCES
    // =============================
    function checkAccess(node) {
        if (!node.locked) return true;
        if (node.lockFlag && State.hasFlag(node.lockFlag)) return true;
        return false;
    }

    // =============================
    // LS — LISTER UN REPERTOIRE
    // =============================
    function ls(input = null) {
        const pathArr = input ? parsePath(input) : [...currentPath];
        const node    = resolve(pathArr);

        if (!node) {
            Terminal.printLine(`ls: chemin introuvable : ${pathToString(pathArr)}`, 'error');
            return;
        }

        if (node.type !== 'dir') {
            Terminal.printLine(`ls: n'est pas un répertoire.`, 'error');
            return;
        }

        if (!checkAccess(node)) {
            Terminal.printLine(`ls: accès refusé.`, 'error');
            return;
        }

        Terminal.printLine('', '');
        Terminal.printLine(`  ${pathToString(pathArr)}`, 'system');
        Terminal.printLine('', '');

        const entries = Object.entries(node.children);

        if (entries.length === 0) {
            Terminal.printLine('  (vide)', 'warning');
        } else {
            entries.forEach(([name, child]) => {
                if (child.hidden && !State.hasFlag('see_hidden')) return;

                const icon   = child.type === 'dir' ? '📁' : '📄';
                const locked = child.locked ? ' 🔒' : '';
                const exec   = child.executable ? ' ⚡' : '';
                const style  = child.type === 'dir' ? 'title' : 'info';

                Terminal.printLine(`  ${icon}  ${name}${locked}${exec}`, style);
            });
        }

        Terminal.printLine('', '');
    }

    // =============================
    // CD — CHANGER DE REPERTOIRE
    // =============================
    function cd(input) {
        if (!input) {
            currentPath = ['~'];
            Terminal.printLine(`  ~`, 'system');
            return;
        }

        const pathArr = parsePath(input);
        const node    = resolve(pathArr);

        if (!node) {
            Terminal.printLine(`cd: chemin introuvable : ${input}`, 'error');
            return;
        }

        if (node.type !== 'dir') {
            Terminal.printLine(`cd: n'est pas un répertoire.`, 'error');
            return;
        }

        if (!checkAccess(node)) {
            Terminal.printLine(`cd: accès refusé.`, 'error');
            return;
        }

        currentPath = pathArr;
        Terminal.printLine(`  ${pathToString(currentPath)}`, 'system');
    }

    // =============================
    // CAT / READ — LIRE UN FICHIER
    // =============================
    function read(input) {
        if (!input) {
            Terminal.printLine('Usage : read <fichier>', 'warning');
            return;
        }

        const pathArr = parsePath(input);
        const node    = resolve(pathArr);

        if (!node) {
            Terminal.printLine(`read: fichier introuvable : ${input}`, 'error');
            return;
        }

        if (node.type !== 'file') {
            Terminal.printLine(`read: c'est un répertoire, pas un fichier.`, 'error');
            return;
        }

        if (!checkAccess(node)) {
            Terminal.printLine(`read: accès refusé. Autorisation requise.`, 'error');
            return;
        }

        Terminal.printLine('', '');
        Terminal.printLine(`── ${pathArr[pathArr.length - 1]} ──`, 'system');
        Terminal.printLine('', '');

        node.content.forEach(line => {
            Terminal.printLine(`  ${line}`, 'output');
        });

        Terminal.printLine('', '');

        // flags de découverte
        triggerReadFlag(pathArr);
    }

    // =============================
    // EXEC — EXECUTER UN SCRIPT
    // =============================
    function exec(input) {
        const pathArr = parsePath(input);
        const node    = resolve(pathArr);

        if (!node || node.type !== 'file' || !node.executable) {
            Terminal.printLine(`exec: fichier non exécutable.`, 'error');
            return;
        }

        Terminal.printLine('', '');
        Terminal.printLine(`⚡ Exécution : ${input}`, 'system');
        Terminal.printLine('', '');

        node.content.forEach(line => {
            if (!line.startsWith('#') && !line.startsWith('#!/')) {
                Terminal.printLine(`  ${line}`, 'output');
            }
        });

        Terminal.printLine('', '');
    }

    // =============================
    // FIND — RECHERCHE
    // =============================
    function find(query) {
        if (!query) {
            Terminal.printLine('Usage : find <nom>', 'warning');
            return;
        }

        Terminal.printLine('', '');
        Terminal.printLine(`  Recherche : "${query}"`, 'system');
        Terminal.printLine('', '');

        const results = [];
        searchTree(TREE['~'], ['~'], query.toLowerCase(), results);

        if (results.length === 0) {
            Terminal.printLine('  Aucun résultat.', 'warning');
        } else {
            results.forEach(r => {
                Terminal.printLine(`  → ${r}`, 'info');
            });
        }

        Terminal.printLine('', '');
    }

    function searchTree(node, pathArr, query, results) {
        if (!node.children) return;

        Object.entries(node.children).forEach(([name, child]) => {
            const childPath = [...pathArr, name];
            if (name.toLowerCase().includes(query)) {
                results.push(pathToString(childPath));
            }
            if (child.type === 'dir' && child.children) {
                searchTree(child, childPath, query, results);
            }
        });
    }

    // =============================
    // UNLOCK — DEVERROUILLER
    // =============================
    function unlock(pathStr, flag) {
        const pathArr = parsePath(pathStr);
        const node    = resolve(pathArr);

        if (!node) return false;
        if (!node.locked) return true;

        if (node.lockFlag === flag || State.hasFlag(flag)) {
            node.locked = false;
            Terminal.printLine(`[ Accès déverrouillé : ${pathStr} ]`, 'success');
            return true;
        }

        Terminal.printLine(`Déverrouillage échoué.`, 'error');
        return false;
    }

    // =============================
    // FLAGS DE LECTURE
    // =============================
    function triggerReadFlag(pathArr) {
        const full = pathToString(pathArr);

        const triggers = {
            '~/home/user/.hidden'         : 'found_key_fragment',
            '~/vault/key.enc'             : 'has_full_key',
            '~/sys/core/kernel.log'       : 'read_kernel',
            '~/vault/ghost_origin.log'    : 'read_ghost_origin',
            '~/sys/logs/access.log'       : 'read_access_log',
        };

        if (triggers[full] && !State.hasFlag(triggers[full])) {
            State.setFlag(triggers[full]);
            Terminal.printLine(`[ Découverte enregistrée ]`, 'success');
            State.addXP(15);
        }
    }

    // =============================
    // AUTOCOMPLETE
    // =============================
    function autocomplete(partial) {
        const parts   = partial.split(CONFIG.separator);
        const prefix  = parts.pop();
        const dirPath = parts.length ? parsePath(parts.join(CONFIG.separator)) : [...currentPath];
        const node    = resolve(dirPath);

        if (!node || node.type !== 'dir' || !node.children) return [];

        return Object.keys(node.children)
            .filter(name => name.startsWith(prefix))
            .map(name => {
                const base = parts.length ? parts.join(CONFIG.separator) + CONFIG.separator : '';
                return base + name;
            });
    }

    // =============================
    // ARBRE VISUEL
    // =============================
    function tree(input = null) {
        const pathArr = input ? parsePath(input) : [...currentPath];
        const node    = resolve(pathArr);

        if (!node || node.type !== 'dir') {
            Terminal.printLine('tree: répertoire introuvable.', 'error');
            return;
        }

        Terminal.printLine('', '');
        Terminal.printLine(`  ${pathToString(pathArr)}`, 'system');
        printTree(node, '  ');
        Terminal.printLine('', '');
    }

    function printTree(node, indent) {
        if (!node.children) return;

        const entries = Object.entries(node.children);
        entries.forEach(([name, child], i) => {
            if (child.hidden && !State.hasFlag('see_hidden')) return;

            const isLast   = i === entries.length - 1;
            const branch   = isLast ? '└── ' : '├── ';
            const icon     = child.type === 'dir' ? '📁' : '📄';
            const locked   = child.locked ? ' 🔒' : '';
            const style    = child.type === 'dir' ? 'title' : 'info';

            Terminal.printLine(`${indent}${branch}${icon} ${name}${locked}`, style);

            if (child.type === 'dir' && child.children) {
                const newIndent = indent + (isLast ? '    ' : '│   ');
                printTree(child, newIndent);
            }
        });
    }

    // =============================
    // INIT
    // =============================
    function init() {
        currentPath = ['~'];
        console.log('[FileSystem] Initialisé.');
    }

    // =============================
    // API PUBLIQUE
    // =============================
    return {
        init,
        ls,
        cd,
        read,
        exec,
        find,
        tree,
        unlock,
        autocomplete,
        getCurrentPathString,
        parsePath,
        resolve,
    };

})();

