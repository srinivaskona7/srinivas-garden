/**
 * Terminal WebSocket Route
 * Provides a web-based PTY terminal for kubectl/helm commands
 * Falls back to child_process.spawn if node-pty fails (common on macOS with Node 23+)
 */

const path = require('path');
const { spawn } = require('child_process');

// Store active terminal sessions
const terminals = new Map();

// Try to load node-pty, fallback to simple spawn if not available
let pty = null;
let usePty = false;
try {
    pty = require('node-pty');
    // Test if PTY works by spawning a simple echo
    const testPty = pty.spawn('/bin/echo', ['test'], { cols: 80, rows: 24 });
    testPty.kill();
    usePty = true;
    console.log('🖥️  Using node-pty for terminal');
} catch (err) {
    console.log('🖥️  node-pty not available, using child_process fallback');
    usePty = false;
}

/**
 * Initialize WebSocket terminal handler
 * @param {WebSocket.Server} wss - WebSocket server instance
 */
function initTerminal(wss) {
    wss.on('connection', (ws, req) => {
        // Only allow /terminal path
        if (req.url !== '/terminal') {
            ws.close();
            return;
        }

        console.log('🖥️  Terminal WebSocket connected');

        // Determine shell - use zsh on macOS, bash on Linux/container
        const shell = process.platform === 'darwin' ? '/bin/zsh' : '/bin/sh';
        const kubeconfigPath = path.join(process.cwd(), 'kyma-cluster', 'kyma-admin.yaml');

        console.log(`🖥️  Using shell: ${shell}`);
        console.log(`🖥️  KUBECONFIG: ${kubeconfigPath}`);

        const env = {
            ...process.env,
            KUBECONFIG: kubeconfigPath,
            TERM: 'xterm-256color',
            PATH: `${process.env.PATH}:/usr/local/bin:/usr/bin:/bin`
        };

        // Send welcome message
        const welcomeMsg = `\r\n\x1b[1;32m╔════════════════════════════════════════════════════════════╗\x1b[0m\r\n` +
            `\x1b[1;32m║\x1b[0m  \x1b[1;36m🌿 Sri's Garden - Kyma Cluster Terminal\x1b[0m                   \x1b[1;32m║\x1b[0m\r\n` +
            `\x1b[1;32m╠════════════════════════════════════════════════════════════╣\x1b[0m\r\n` +
            `\x1b[1;32m║\x1b[0m  Commands: kubectl, helm, sh                               \x1b[1;32m║\x1b[0m\r\n` +
            `\x1b[1;32m╚════════════════════════════════════════════════════════════╝\x1b[0m\r\n\r\n`;
        ws.send(welcomeMsg);

        // Try PTY first, then fallback
        let terminalProcess;
        let terminalId;

        if (usePty) {
            try {
                terminalProcess = pty.spawn(shell, [], {
                    name: 'xterm-256color',
                    cols: 120,
                    rows: 30,
                    cwd: process.cwd(),
                    env
                });
                terminalId = terminalProcess.pid;
                console.log(`🖥️  PTY spawned with PID: ${terminalId}`);

                // PTY data handler
                terminalProcess.onData((data) => {
                    try {
                        if (ws.readyState === 1) ws.send(data);
                    } catch (err) {
                        console.error('Error sending to WebSocket:', err);
                    }
                });

                // PTY exit handler
                terminalProcess.onExit(({ exitCode }) => {
                    console.log(`🖥️  Terminal PID ${terminalId} exited with code: ${exitCode}`);
                    terminals.delete(terminalId);
                    if (ws.readyState === 1) {
                        ws.send(`\r\n\x1b[1;31m[Terminal session ended]\x1b[0m\r\n`);
                        ws.close();
                    }
                });

                // Input handler for PTY
                ws.on('message', (message) => {
                    const msg = message.toString();
                    if (msg.startsWith('resize:')) {
                        const [, cols, rows] = msg.split(':');
                        terminalProcess.resize(parseInt(cols), parseInt(rows));
                    } else {
                        terminalProcess.write(msg);
                    }
                });

            } catch (err) {
                console.error('🖥️  PTY spawn failed, falling back:', err.message);
                usePty = false;
            }
        }

        // Fallback: Use child_process.spawn for simple command execution
        if (!usePty) {
            terminalProcess = spawn(shell, ['-i'], {
                cwd: process.cwd(),
                env,
                stdio: ['pipe', 'pipe', 'pipe']
            });
            terminalId = terminalProcess.pid;
            console.log(`🖥️  Process spawned with PID: ${terminalId}`);

            // Stdout handler
            terminalProcess.stdout.on('data', (data) => {
                try {
                    if (ws.readyState === 1) ws.send(data.toString());
                } catch (err) {
                    console.error('Error sending stdout:', err);
                }
            });

            // Stderr handler
            terminalProcess.stderr.on('data', (data) => {
                try {
                    if (ws.readyState === 1) ws.send(`\x1b[31m${data.toString()}\x1b[0m`);
                } catch (err) {
                    console.error('Error sending stderr:', err);
                }
            });

            // Exit handler
            terminalProcess.on('exit', (code) => {
                console.log(`🖥️  Terminal PID ${terminalId} exited with code: ${code}`);
                terminals.delete(terminalId);
                if (ws.readyState === 1) {
                    ws.send(`\r\n\x1b[1;31m[Terminal session ended]\x1b[0m\r\n`);
                    ws.close();
                }
            });

            // Error handler
            terminalProcess.on('error', (err) => {
                console.error('🖥️  Process error:', err);
                if (ws.readyState === 1) {
                    ws.send(`\r\n\x1b[1;31mError: ${err.message}\x1b[0m\r\n`);
                }
            });

            // Input handler for spawn
            ws.on('message', (message) => {
                const msg = message.toString();
                if (msg.startsWith('resize:')) return; // Ignore resize for spawn
                try {
                    terminalProcess.stdin.write(msg);
                } catch (err) {
                    console.error('Error writing to stdin:', err);
                }
            });
        }

        // Store terminal session
        terminals.set(terminalId, { process: terminalProcess, ws });

        // Handle WebSocket close
        ws.on('close', () => {
            console.log(`🖥️  Terminal WebSocket disconnected (PID: ${terminalId})`);
            try {
                terminalProcess.kill();
            } catch (err) { }
            terminals.delete(terminalId);
        });

        // Handle WebSocket error
        ws.on('error', (err) => {
            console.error('Terminal WebSocket error:', err);
            try {
                terminalProcess.kill();
            } catch (e) { }
            terminals.delete(terminalId);
        });
    });
}

/**
 * Clean up all terminal sessions
 */
function cleanupTerminals() {
    terminals.forEach(({ process }) => {
        try {
            process.kill();
        } catch (err) { }
    });
    terminals.clear();
}

module.exports = { initTerminal, cleanupTerminals };
