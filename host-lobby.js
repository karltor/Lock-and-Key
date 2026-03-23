// host-lobby.js — Lobby UI logic extracted from host.html (SoC)
// Depends on window.db, window.roomId, window.players, window.numberOfTeams,
// window.roomData, window.hostPackage, window.getTeamName, window.getTeamColor,
// window.executeStartGame, window.executeEndGame

function esc(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

const modalOverlay = document.getElementById('customModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');
const modalInput = document.getElementById('modalInput');

function showCustomModal(options) {
    modalTitle.innerText = options.title;
    modalText.innerText = options.text;

    if (options.type === 'prompt') {
        modalInput.style.display = 'block';
        modalInput.value = options.defaultVal || '';
        setTimeout(() => modalInput.focus(), 100);
    } else {
        modalInput.style.display = 'none';
    }

    document.getElementById('modalCancelBtn').onclick = () => {
        modalOverlay.style.display = 'none';
        if (options.onCancel) options.onCancel();
    };
    document.getElementById('modalConfirmBtn').onclick = () => {
        modalOverlay.style.display = 'none';
        options.onConfirm(options.type === 'prompt' ? modalInput.value : null);
    };

    modalOverlay.style.display = 'flex';
}

function showToast(msg, type = "normal") {
    const toast = document.getElementById('toastMessage');
    toast.innerText = msg;
    toast.className = 'toast';
    if (type === 'error') toast.classList.add('error');
    if (type === 'success') toast.classList.add('success');
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function renderTeamsGrid() {
    const grid = document.getElementById('teamsGrid');
    grid.innerHTML = '';
    for (let i = 1; i <= window.numberOfTeams; i++) {
        grid.innerHTML += `
            <div class="team-box" ondragover="allowDrop(event)" ondrop="drop(event, ${i})" ondragenter="this.classList.add('drag-over')" ondragleave="this.classList.remove('drag-over')">
                <div class="team-header" style="background-color: ${window.getTeamColor(i)}">${window.getTeamName(i)}</div>
                <div class="team-players" id="team-${i}"></div>
            </div>`;
    }
}

function renderAllPlayers() {
    let maxTeam = 4;
    window.players.forEach(p => {
        if (p.team && p.team > maxTeam) {
            maxTeam = p.team;
        }
    });

    if (maxTeam > window.numberOfTeams) {
        window.numberOfTeams = maxTeam;
        renderTeamsGrid();
    }

    document.getElementById('unassignedList').innerHTML = '';
    for (let i = 1; i <= window.numberOfTeams; i++) {
        const t = document.getElementById(`team-${i}`);
        if (t) t.innerHTML = '';
    }

    window.players.forEach(p => {
        const chip = document.createElement('div');
        chip.className = 'player-chip';
        chip.draggable = true;
        chip.id = `player-${p.id}`;
        chip.ondragstart = (e) => e.dataTransfer.setData("playerId", p.id);
        chip.innerHTML = `
            <span>${esc(p.name)}</span>
            <div class="player-actions">
                <button class="action-btn" data-action="rename">✏️</button>
                <button class="action-btn" data-action="kick">❌</button>
            </div>`;
        chip.querySelector('[data-action="rename"]').addEventListener('click', () => renamePlayer(p.id, p.name));
        chip.querySelector('[data-action="kick"]').addEventListener('click', () => kickPlayer(p.id));

        if (p.team == null) {
            document.getElementById('unassignedList').appendChild(chip);
        } else {
            const teamContainer = document.getElementById(`team-${p.team}`);
            if (teamContainer) teamContainer.appendChild(chip);
        }
    });
}

function addEmptyTeam() { window.numberOfTeams++; renderTeamsGrid(); renderAllPlayers(); }
function allowDrop(ev) { ev.preventDefault(); }

async function drop(ev, teamId) {
    ev.preventDefault();
    document.querySelectorAll('.team-box').forEach(el => el.classList.remove('drag-over'));
    const pId = ev.dataTransfer.getData("playerId");
    const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    await updateDoc(doc(window.db, "rooms", window.roomId, "players", pId), { team: teamId });
}

function renamePlayer(id, oldName) {
    showCustomModal({
        title: 'Byt namn',
        text: 'Ange ett nytt namn för eleven:',
        type: 'prompt',
        defaultVal: oldName,
        onConfirm: async (newName) => {
            if (newName && newName.trim() !== oldName) {
                const { doc, updateDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
                await updateDoc(doc(window.db, "rooms", window.roomId, "players", id), { name: newName.trim() });
                showToast("Namnet ändrades", "success");
            }
        }
    });
}

function kickPlayer(id) {
    showCustomModal({
        title: 'Kicka elev',
        text: 'Är du säker på att du vill ta bort eleven?',
        type: 'confirm',
        onConfirm: async () => {
            const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
            await deleteDoc(doc(window.db, "rooms", window.roomId, "players", id));
            showToast("Eleven togs bort", "success");
        }
    });
}

function tryStartGame() {
    showCustomModal({
        title: 'Starta spelet?',
        text: 'Elever som inte är i ett lag kommer raderas. Är alla redo?',
        type: 'confirm',
        onConfirm: () => window.executeStartGame()
    });
}

function tryEndGame() {
    showCustomModal({
        title: 'Avsluta',
        text: 'Är du säker på att du vill avsluta spelet och visa podiet?',
        type: 'confirm',
        onConfirm: () => window.executeEndGame()
    });
}

async function randomizeTeams(teamSize) {
    if (window.players.length === 0) return showToast("Inga elever att slumpa!", "error");

    let shuffled = [...window.players];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const numTeams = Math.ceil(shuffled.length / teamSize);

    const { doc, writeBatch } = await import("https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js");
    const batch = writeBatch(window.db);

    shuffled.forEach((player, index) => {
        const teamNum = (index % numTeams) + 1;
        batch.update(doc(window.db, "rooms", window.roomId, "players", player.id), { team: teamNum });
    });

    await batch.commit();
    showToast("Lagen har slumpats jämnt!", "success");
}

function checkReadyToStart() {
    const startBtn = document.getElementById('startBtn');
    const unassignedCount = window.players.filter(p => p.team == null).length;
    if (window.players.length > 0 && unassignedCount === 0) {
        startBtn.disabled = false;
        startBtn.innerText = `▶️ Starta Spelet (${window.players.length} redo)`;
    } else {
        startBtn.disabled = true;
        startBtn.innerText = "▶️ Starta Spelet (Väntar på indelning)";
    }
}

function copyJoinLink() {
    navigator.clipboard.writeText(window.location.origin + window.location.pathname.replace('host.html', 'play.html') + `?room=${window.roomId}`).then(() => showToast("Länk kopierad!", "success"));
}

// Expose to global scope for inline handlers and module script
window.showToast = showToast;
window.showCustomModal = showCustomModal;
window.renderTeamsGrid = renderTeamsGrid;
window.renderAllPlayers = renderAllPlayers;
window.checkReadyToStart = checkReadyToStart;
window.renderLeaderboard = null; // Set by module script
window.addEmptyTeam = addEmptyTeam;
window.allowDrop = allowDrop;
window.drop = drop;
window.renamePlayer = renamePlayer;
window.kickPlayer = kickPlayer;
window.tryStartGame = tryStartGame;
window.tryEndGame = tryEndGame;
window.randomizeTeams = randomizeTeams;
window.checkReadyToStart = checkReadyToStart;
window.copyJoinLink = copyJoinLink;
