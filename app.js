/* ═══════════════════════════════════════════════════════════
   SMART ESCAPE — Interactive Evacuation Route Simulator
   Complete Application Logic
   ═══════════════════════════════════════════════════════════ */

// ═══════════ INTERNATIONALIZATION ═══════════
const i18n = {
    en: {
        appTitle: 'Smart Escape',
        buildingMap: 'Building Map',
        room: 'Room',
        junction: 'Junction',
        exit: 'Exit',
        blocked: 'Blocked',
        route: 'Route',
        loadData: 'Load Building Data',
        chooseFile: 'Choose JSON File',
        fileHint: 'Or the sample will auto-load',
        startLocation: 'Start Location',
        noneSelected: 'None selected',
        hazardControls: 'Hazard Simulation',
        roomsJunctions: 'Rooms & Junctions',
        exits: 'Exits',
        corridors: 'Corridors',
        resetAll: 'Reset All',
        selectStartPrompt: 'Click a room or junction on the map to select a starting point',
        noRoute: 'No route available',
        startBlocked: 'Starting location blocked',
        routeFound: 'Route found',
        pathLabel: 'Path',
        costLabel: 'Cost',
        exitLabel: 'Exit',
        block: 'Block',
        unblock: 'Unblock',
        close: 'Close',
        open: 'Open',
        loadPrompt: 'Load a building file to get started',
        invalidFile: 'Invalid file: ',
        fileLoaded: 'Building loaded successfully',
        footerText: 'AI DevFest 2026 Mock Test',
        noExitReachable: 'No open exit is reachable from this location',
        disconnected: 'This location is disconnected from all exits',
    },
    bn: {
        appTitle: 'স্মার্ট এস্কেপ',
        buildingMap: 'বিল্ডিং ম্যাপ',
        room: 'কক্ষ',
        junction: 'জংশন',
        exit: 'প্রস্থান',
        blocked: 'ব্লক',
        route: 'রুট',
        loadData: 'বিল্ডিং ডেটা লোড করুন',
        chooseFile: 'JSON ফাইল নির্বাচন করুন',
        fileHint: 'অথবা নমুনা স্বয়ংক্রিয়ভাবে লোড হবে',
        startLocation: 'শুরুর অবস্থান',
        noneSelected: 'নির্বাচিত নয়',
        hazardControls: 'বিপদ সিমুলেশন',
        roomsJunctions: 'কক্ষ ও জংশন',
        exits: 'প্রস্থান',
        corridors: 'করিডোর',
        resetAll: 'সব রিসেট করুন',
        selectStartPrompt: 'শুরুর স্থান নির্বাচন করতে ম্যাপে একটি কক্ষ বা জংশনে ক্লিক করুন',
        noRoute: 'কোনো রুট পাওয়া যায়নি',
        startBlocked: 'শুরুর অবস্থান ব্লক করা হয়েছে',
        routeFound: 'রুট পাওয়া গেছে',
        pathLabel: 'পথ',
        costLabel: 'খরচ',
        exitLabel: 'প্রস্থান',
        block: 'ব্লক',
        unblock: 'আনব্লক',
        close: 'বন্ধ',
        open: 'খোলা',
        loadPrompt: 'শুরু করতে একটি বিল্ডিং ফাইল লোড করুন',
        invalidFile: 'অবৈধ ফাইল: ',
        fileLoaded: 'বিল্ডিং সফলভাবে লোড হয়েছে',
        footerText: 'এআই ডেভফেস্ট ২০২৬ মক টেস্ট',
        noExitReachable: 'এই অবস্থান থেকে কোনো খোলা প্রস্থানে পৌঁছানো সম্ভব নয়',
        disconnected: 'এই অবস্থানটি সমস্ত প্রস্থান থেকে বিচ্ছিন্ন',
    }
};

let currentLang = 'en';

function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.en[key]) || key;
}

function updateAllTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });
    // Update app title
    document.getElementById('appTitle').textContent = t('appTitle');
    // Update start badge
    if (state.selectedStart) {
        const node = getNode(state.selectedStart);
        if (node) {
            document.getElementById('startBadge').textContent = `${node.label} (${node.id})`;
            document.getElementById('startBadge').classList.remove('empty');
        }
    } else {
        document.getElementById('startBadge').textContent = t('noneSelected');
        document.getElementById('startBadge').classList.add('empty');
    }
    // Update route display
    if (state.buildingData) {
        recalculateRoute();
    }
}

function switchLanguage() {
    currentLang = currentLang === 'en' ? 'bn' : 'en';
    document.getElementById('langLabel').textContent = currentLang === 'en' ? 'বাংলা' : 'English';
    document.documentElement.lang = currentLang === 'en' ? 'en' : 'bn';
    updateAllTranslations();
    // Re-generate toggle labels
    if (state.buildingData) {
        generateControls();
    }
}

// ═══════════ APPLICATION STATE ═══════════
const state = {
    buildingData: null,
    blockedNodes: new Set(),
    blockedEdges: new Set(),
    closedExits: new Set(),
    selectedStart: null,
    currentRoute: null,
    isInitialRender: true,
};

// ═══════════ HELPERS ═══════════
function getNode(id) {
    if (!state.buildingData) return null;
    return state.buildingData.nodes.find(n => n.id === id);
}

function getEdge(id) {
    if (!state.buildingData) return null;
    return state.buildingData.edges.find(e => e.id === id);
}

// ═══════════ JSON VALIDATION ═══════════
function validateBuilding(data) {
    const errors = [];

    if (!data || typeof data !== 'object') {
        return ['Input is not a valid JSON object'];
    }

    // Building name
    if (!data.building || typeof data.building !== 'string' || data.building.trim() === '') {
        errors.push('Missing or empty "building" name');
    }

    // Nodes
    if (!Array.isArray(data.nodes) || data.nodes.length < 2) {
        errors.push('Must have at least 2 nodes');
        return errors;
    }
    if (data.nodes.length > 60) {
        errors.push('Too many nodes (max 60)');
    }

    const nodeIds = new Set();
    const validTypes = new Set(['room', 'junction', 'exit']);
    let hasRoomOrJunction = false;
    let hasExit = false;

    for (const node of data.nodes) {
        if (!node.id || typeof node.id !== 'string') {
            errors.push('Node missing "id"');
            continue;
        }
        if (nodeIds.has(node.id)) {
            errors.push(`Duplicate node ID: ${node.id}`);
        }
        nodeIds.add(node.id);

        if (!node.label || typeof node.label !== 'string') {
            errors.push(`Node ${node.id}: missing "label"`);
        }
        if (!validTypes.has(node.type)) {
            errors.push(`Node ${node.id}: invalid type "${node.type}"`);
        }
        if (node.type === 'room' || node.type === 'junction') hasRoomOrJunction = true;
        if (node.type === 'exit') hasExit = true;

        if (typeof node.x !== 'number' || typeof node.y !== 'number') {
            errors.push(`Node ${node.id}: missing or invalid coordinates`);
        }
    }

    if (!hasRoomOrJunction) errors.push('Must have at least one room or junction');
    if (!hasExit) errors.push('Must have at least one exit');

    // Edges
    if (!Array.isArray(data.edges) || data.edges.length < 1) {
        errors.push('Must have at least 1 edge');
        return errors;
    }
    if (data.edges.length > 150) {
        errors.push('Too many edges (max 150)');
    }

    const edgeIds = new Set();
    const edgePairs = new Set();

    for (const edge of data.edges) {
        if (!edge.id || typeof edge.id !== 'string') {
            errors.push('Edge missing "id"');
            continue;
        }
        if (edgeIds.has(edge.id)) {
            errors.push(`Duplicate edge ID: ${edge.id}`);
        }
        edgeIds.add(edge.id);

        if (!nodeIds.has(edge.from)) {
            errors.push(`Edge ${edge.id}: "from" node "${edge.from}" does not exist`);
        }
        if (!nodeIds.has(edge.to)) {
            errors.push(`Edge ${edge.id}: "to" node "${edge.to}" does not exist`);
        }

        if (edge.from === edge.to) {
            errors.push(`Edge ${edge.id}: self-loop`);
        }

        const pairKey = [edge.from, edge.to].sort().join('|');
        if (edgePairs.has(pairKey)) {
            errors.push(`Edge ${edge.id}: duplicate node pair (${edge.from}, ${edge.to})`);
        }
        edgePairs.add(pairKey);

        if (!Number.isInteger(edge.cost) || edge.cost <= 0) {
            errors.push(`Edge ${edge.id}: cost must be a positive integer`);
        }
    }

    // Initial state
    if (!data.initial_state || typeof data.initial_state !== 'object') {
        errors.push('Missing "initial_state"');
    } else {
        if (!Array.isArray(data.initial_state.blocked_nodes)) {
            errors.push('initial_state.blocked_nodes must be an array');
        } else {
            for (const id of data.initial_state.blocked_nodes) {
                if (!nodeIds.has(id)) {
                    errors.push(`initial_state.blocked_nodes: "${id}" does not exist`);
                } else {
                    const node = data.nodes.find(n => n.id === id);
                    if (node && node.type === 'exit') {
                        errors.push(`initial_state.blocked_nodes: "${id}" is an exit (use closed_exits)`);
                    }
                }
            }
        }

        if (!Array.isArray(data.initial_state.blocked_edges)) {
            errors.push('initial_state.blocked_edges must be an array');
        } else {
            for (const id of data.initial_state.blocked_edges) {
                if (!edgeIds.has(id)) {
                    errors.push(`initial_state.blocked_edges: "${id}" does not exist`);
                }
            }
        }

        if (!Array.isArray(data.initial_state.closed_exits)) {
            errors.push('initial_state.closed_exits must be an array');
        } else {
            for (const id of data.initial_state.closed_exits) {
                if (!nodeIds.has(id)) {
                    errors.push(`initial_state.closed_exits: "${id}" does not exist`);
                } else {
                    const node = data.nodes.find(n => n.id === id);
                    if (node && node.type !== 'exit') {
                        errors.push(`initial_state.closed_exits: "${id}" is not an exit`);
                    }
                }
            }
        }
    }

    return errors;
}

// ═══════════ DIJKSTRA'S ALGORITHM ═══════════
function computeRoute(startId) {
    const data = state.buildingData;
    if (!data) return null;

    // Check if start is blocked
    if (state.blockedNodes.has(startId)) {
        return { status: 'startBlocked' };
    }

    // Build adjacency list excluding blocked elements
    const validNodes = new Set();
    for (const node of data.nodes) {
        if (state.blockedNodes.has(node.id)) continue;
        if (node.type === 'exit' && state.closedExits.has(node.id)) continue;
        validNodes.add(node.id);
    }

    if (!validNodes.has(startId)) {
        return { status: 'startBlocked' };
    }

    const adj = {};
    for (const id of validNodes) {
        adj[id] = [];
    }

    for (const edge of data.edges) {
        if (state.blockedEdges.has(edge.id)) continue;
        if (!validNodes.has(edge.from) || !validNodes.has(edge.to)) continue;
        adj[edge.from].push({ to: edge.to, cost: edge.cost, edgeId: edge.id });
        adj[edge.to].push({ to: edge.from, cost: edge.cost, edgeId: edge.id });
    }

    // Dijkstra's algorithm
    const dist = {};
    const visited = new Set();
    for (const id of validNodes) {
        dist[id] = Infinity;
    }
    dist[startId] = 0;

    while (true) {
        // Find unvisited node with minimum distance
        let u = null;
        let minDist = Infinity;
        for (const id of validNodes) {
            if (!visited.has(id) && dist[id] < minDist) {
                minDist = dist[id];
                u = id;
            }
        }
        if (u === null) break;
        visited.add(u);

        // Relax neighbors
        for (const { to: v, cost } of adj[u]) {
            if (visited.has(v)) continue;
            const newDist = dist[u] + cost;
            if (newDist < dist[v]) {
                dist[v] = newDist;
            }
        }
    }

    // Find best exit: minimum cost, then lexicographically smallest exit ID
    const openExits = data.nodes
        .filter(n => n.type === 'exit' && !state.closedExits.has(n.id) && validNodes.has(n.id) && dist[n.id] !== Infinity)
        .sort((a, b) => {
            if (dist[a.id] !== dist[b.id]) return dist[a.id] - dist[b.id];
            return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
        });

    if (openExits.length === 0) {
        return { status: 'noRoute' };
    }

    const targetExit = openExits[0].id;
    const totalCost = dist[targetExit];

    // Reconstruct lexicographically smallest path using forward greedy on shortest-path DAG
    // First, find all nodes on some shortest path from start to target (reverse BFS from target)
    const onShortestPath = new Set([targetExit]);
    const queue = [targetExit];
    while (queue.length > 0) {
        const v = queue.shift();
        if (!adj[v]) continue;
        for (const { to: u, cost } of adj[v]) {
            if (dist[u] + cost === dist[v] && !onShortestPath.has(u)) {
                onShortestPath.add(u);
                queue.push(u);
            }
        }
    }

    // Forward greedy: at each step, pick the lexicographically smallest neighbor on the DAG
    const path = [startId];
    const edgePath = [];
    let current = startId;

    while (current !== targetExit) {
        const candidates = adj[current]
            .filter(({ to, cost }) => dist[to] === dist[current] + cost && onShortestPath.has(to))
            .sort((a, b) => a.to < b.to ? -1 : (a.to > b.to ? 1 : 0));

        if (candidates.length === 0) {
            return { status: 'noRoute' };
        }

        const next = candidates[0];
        path.push(next.to);
        edgePath.push(next.edgeId);
        current = next.to;
    }

    return {
        status: 'found',
        path,
        edgePath,
        cost: totalCost,
        exit: targetExit,
    };
}

// ═══════════ SVG GRAPH RENDERING ═══════════
const SVG_NS = 'http://www.w3.org/2000/svg';

function clearSvgLayer(layerId) {
    const layer = document.getElementById(layerId);
    while (layer.firstChild) layer.removeChild(layer.firstChild);
}

function computeViewBox(nodes) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of nodes) {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y);
    }
    const padX = 80;
    const padY = 65;
    return `${minX - padX} ${minY - padY} ${maxX - minX + 2 * padX} ${maxY - minY + 2 * padY}`;
}

function renderGraph() {
    const data = state.buildingData;
    if (!data) return;

    const svg = document.getElementById('graphSvg');
    svg.setAttribute('viewBox', computeViewBox(data.nodes));

    clearSvgLayer('edgeLayer');
    clearSvgLayer('nodeLayer');

    const edgeLayer = document.getElementById('edgeLayer');
    const nodeLayer = document.getElementById('nodeLayer');

    // ─── Render edges ───
    for (let i = 0; i < data.edges.length; i++) {
        const edge = data.edges[i];
        const fromNode = getNode(edge.from);
        const toNode = getNode(edge.to);
        if (!fromNode || !toNode) continue;

        const g = document.createElementNS(SVG_NS, 'g');
        g.classList.add('edge-group');
        g.setAttribute('data-edge-id', edge.id);

        const isBlocked = state.blockedEdges.has(edge.id);
        const fromBlocked = state.blockedNodes.has(edge.from) || (fromNode.type === 'exit' && state.closedExits.has(edge.from));
        const toBlocked = state.blockedNodes.has(edge.to) || (toNode.type === 'exit' && state.closedExits.has(edge.to));
        const effectivelyBlocked = isBlocked || fromBlocked || toBlocked;

        if (effectivelyBlocked) g.classList.add('blocked');

        // Line
        const line = document.createElementNS(SVG_NS, 'line');
        line.setAttribute('x1', fromNode.x);
        line.setAttribute('y1', fromNode.y);
        line.setAttribute('x2', toNode.x);
        line.setAttribute('y2', toNode.y);
        line.classList.add('edge-line');
        if (effectivelyBlocked) line.classList.add('blocked');

        // Animate appearance only on initial load
        if (state.isInitialRender) {
            const length = Math.hypot(toNode.x - fromNode.x, toNode.y - fromNode.y);
            line.style.strokeDasharray = length;
            line.style.strokeDashoffset = length;
            line.style.animation = `edgeAppear 0.6s ease ${i * 0.05}s forwards`;
        }

        g.appendChild(line);

        // Cost label
        const mx = (fromNode.x + toNode.x) / 2;
        const my = (fromNode.y + toNode.y) / 2;

        // Calculate perpendicular offset so label doesn't overlap the line
        const dx = toNode.x - fromNode.x;
        const dy = toNode.y - fromNode.y;
        const len = Math.max(Math.hypot(dx, dy), 1);
        const offsetX = (-dy / len) * 10;
        const offsetY = (dx / len) * 10;

        const bg = document.createElementNS(SVG_NS, 'rect');
        bg.setAttribute('x', mx + offsetX - 10);
        bg.setAttribute('y', my + offsetY - 8);
        bg.setAttribute('width', 20);
        bg.setAttribute('height', 16);
        bg.classList.add('edge-cost-bg');
        g.appendChild(bg);

        const costText = document.createElementNS(SVG_NS, 'text');
        costText.setAttribute('x', mx + offsetX);
        costText.setAttribute('y', my + offsetY);
        costText.textContent = edge.cost;
        costText.classList.add('edge-cost');
        g.appendChild(costText);

        edgeLayer.appendChild(g);
    }

    // ─── Render nodes ───
    for (let i = 0; i < data.nodes.length; i++) {
        const node = data.nodes[i];
        const g = document.createElementNS(SVG_NS, 'g');
        g.classList.add('node-group');
        g.setAttribute('data-node-id', node.id);
        g.setAttribute('transform', `translate(${node.x}, ${node.y})`);
        if (state.isInitialRender) {
            g.style.animation = `nodeAppear 0.4s ease ${i * 0.06}s both`;
        }

        const isBlocked = state.blockedNodes.has(node.id);
        const isClosed = node.type === 'exit' && state.closedExits.has(node.id);
        const isSelected = state.selectedStart === node.id;

        if (isSelected) g.classList.add('selected');

        const radius = 18;

        // Determine filter
        let filterAttr = '';
        if (isBlocked || isClosed) {
            filterAttr = 'url(#glowRed)';
        } else if (node.type === 'room') {
            filterAttr = 'url(#glowCyan)';
        } else if (node.type === 'junction') {
            filterAttr = 'url(#glowAmber)';
        } else if (node.type === 'exit') {
            filterAttr = 'url(#glowGreen)';
        }

        // Main circle
        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', 0);
        circle.setAttribute('cy', 0);
        circle.setAttribute('r', radius);
        circle.classList.add('node-circle', node.type);
        if (isBlocked) circle.classList.add('blocked');
        if (isClosed) circle.classList.add('closed');
        if (filterAttr) circle.setAttribute('filter', filterAttr);
        g.appendChild(circle);

        // Exit icon (double border)
        if (node.type === 'exit' && !isClosed) {
            const outerRing = document.createElementNS(SVG_NS, 'circle');
            outerRing.setAttribute('cx', 0);
            outerRing.setAttribute('cy', 0);
            outerRing.setAttribute('r', radius + 4);
            outerRing.setAttribute('fill', 'none');
            outerRing.setAttribute('stroke', 'var(--accent-green)');
            outerRing.setAttribute('stroke-width', '1.5');
            outerRing.setAttribute('stroke-dasharray', '4,3');
            outerRing.setAttribute('opacity', '0.5');
            g.appendChild(outerRing);
        }

        // Selected start pulse ring
        if (isSelected && !isBlocked) {
            const pulse = document.createElementNS(SVG_NS, 'circle');
            pulse.setAttribute('cx', 0);
            pulse.setAttribute('cy', 0);
            pulse.setAttribute('r', radius + 4);
            pulse.classList.add('start-pulse', node.type);
            g.appendChild(pulse);
        }

        // Blocked cross
        if (isBlocked || isClosed) {
            const size = 8;
            const cross1 = document.createElementNS(SVG_NS, 'line');
            cross1.setAttribute('x1', -size);
            cross1.setAttribute('y1', -size);
            cross1.setAttribute('x2', size);
            cross1.setAttribute('y2', size);
            cross1.classList.add('blocked-cross');
            g.appendChild(cross1);

            const cross2 = document.createElementNS(SVG_NS, 'line');
            cross2.setAttribute('x1', size);
            cross2.setAttribute('y1', -size);
            cross2.setAttribute('x2', -size);
            cross2.setAttribute('y2', size);
            cross2.classList.add('blocked-cross');
            g.appendChild(cross2);
        }

        // Label
        const label = document.createElementNS(SVG_NS, 'text');
        label.setAttribute('x', 0);
        label.setAttribute('y', -radius - 10);
        label.textContent = node.label;
        label.classList.add('node-label');
        if (isBlocked || isClosed) label.classList.add('blocked');
        g.appendChild(label);

        // ID label below
        const idLabel = document.createElementNS(SVG_NS, 'text');
        idLabel.setAttribute('x', 0);
        idLabel.setAttribute('y', 4);
        idLabel.textContent = node.id;
        idLabel.classList.add('node-id-label');
        g.appendChild(idLabel);

        // Click handler — only rooms/junctions that are not blocked
        if (node.type !== 'exit') {
            if (!isBlocked) {
                g.addEventListener('click', () => selectStart(node.id));
                g.style.cursor = 'pointer';
            } else {
                g.style.cursor = 'not-allowed';
            }
        }

        nodeLayer.appendChild(g);
    }

    // Hide empty state
    document.getElementById('emptyState').classList.add('hidden');
}

function renderRoute() {
    clearSvgLayer('routeLayer');

    const route = state.currentRoute;
    if (!route || route.status !== 'found') return;

    const routeLayer = document.getElementById('routeLayer');
    const data = state.buildingData;

    // Build polyline points from path
    const points = route.path.map(id => {
        const node = getNode(id);
        return node ? `${node.x},${node.y}` : null;
    }).filter(Boolean);

    if (points.length < 2) return;

    const pointsStr = points.join(' ');

    // Route glow background
    const bgPolyline = document.createElementNS(SVG_NS, 'polyline');
    bgPolyline.setAttribute('points', pointsStr);
    bgPolyline.classList.add('route-segment');
    routeLayer.appendChild(bgPolyline);

    // Route flow animation overlay
    const flowPolyline = document.createElementNS(SVG_NS, 'polyline');
    flowPolyline.setAttribute('points', pointsStr);
    flowPolyline.classList.add('route-flow');
    routeLayer.appendChild(flowPolyline);

    // Highlight route nodes
    for (let i = 0; i < route.path.length; i++) {
        const node = getNode(route.path[i]);
        if (!node) continue;

        const circle = document.createElementNS(SVG_NS, 'circle');
        circle.setAttribute('cx', node.x);
        circle.setAttribute('cy', node.y);
        circle.setAttribute('r', 18);
        circle.classList.add('route-node-highlight');
        circle.style.animationDelay = `${i * 0.1}s`;
        routeLayer.appendChild(circle);
    }
}

// ═══════════ ROUTE INFO DISPLAY ═══════════
function updateRouteDisplay() {
    const statusIcon = document.getElementById('statusIcon');
    const statusText = document.getElementById('statusText');
    const routeDetails = document.getElementById('routeDetails');
    const routePath = document.getElementById('routePath');
    const routeCost = document.getElementById('routeCost');

    statusText.classList.remove('success', 'error', 'warning');

    if (!state.selectedStart) {
        statusIcon.textContent = '📍';
        statusText.textContent = t('selectStartPrompt');
        statusText.classList.remove('success', 'error', 'warning');
        routeDetails.style.display = 'none';
        return;
    }

    const route = state.currentRoute;

    if (!route) {
        statusIcon.textContent = '📍';
        statusText.textContent = t('selectStartPrompt');
        routeDetails.style.display = 'none';
        return;
    }

    if (route.status === 'startBlocked') {
        statusIcon.textContent = '🚫';
        statusText.textContent = t('startBlocked');
        statusText.classList.add('error');
        routeDetails.style.display = 'none';
        return;
    }

    if (route.status === 'noRoute') {
        statusIcon.textContent = '⚠️';
        statusText.textContent = t('noRoute');
        statusText.classList.add('warning');
        routeDetails.style.display = 'none';
        return;
    }

    if (route.status === 'found') {
        statusIcon.textContent = '✅';
        statusText.textContent = t('routeFound');
        statusText.classList.add('success');
        routeDetails.style.display = 'flex';

        // Build path display with arrows
        const pathHtml = route.path.map((id, i) => {
            if (i < route.path.length - 1) {
                return `<span class="path-node">${id}</span><span class="arrow"> → </span>`;
            }
            return `<span class="path-node">${id}</span>`;
        }).join('');
        routePath.innerHTML = `<strong>${t('pathLabel')}:</strong> ${pathHtml}`;

        const exitNode = getNode(route.exit);
        const exitLabel = exitNode ? exitNode.label : route.exit;
        routeCost.innerHTML = `<strong>${t('costLabel')}:</strong> ${route.cost} &nbsp;|&nbsp; <strong>${t('exitLabel')}:</strong> ${exitLabel}`;
    }
}

// ═══════════ CONTROL PANEL GENERATION ═══════════
function generateControls() {
    const data = state.buildingData;
    if (!data) return;

    // Show sections
    document.getElementById('startSection').style.display = '';
    document.getElementById('hazardSection').style.display = '';
    document.getElementById('actionsSection').style.display = '';

    // ─── Node toggles (rooms & junctions) ───
    const nodeToggles = document.getElementById('nodeToggles');
    nodeToggles.innerHTML = '';

    const roomsJunctions = data.nodes.filter(n => n.type === 'room' || n.type === 'junction');
    for (const node of roomsJunctions) {
        const isBlocked = state.blockedNodes.has(node.id);
        const item = createToggleItem(
            node.id,
            `${node.label} (${node.id})`,
            node.type,
            isBlocked,
            (checked) => toggleBlockNode(node.id, checked)
        );
        nodeToggles.appendChild(item);
    }

    // ─── Exit toggles ───
    const exitToggles = document.getElementById('exitToggles');
    exitToggles.innerHTML = '';

    const exits = data.nodes.filter(n => n.type === 'exit');
    for (const node of exits) {
        const isClosed = state.closedExits.has(node.id);
        const item = createToggleItem(
            node.id,
            `${node.label} (${node.id})`,
            'exit',
            isClosed,
            (checked) => toggleCloseExit(node.id, checked)
        );
        exitToggles.appendChild(item);
    }

    // ─── Edge toggles ───
    const edgeToggles = document.getElementById('edgeToggles');
    edgeToggles.innerHTML = '';

    for (const edge of data.edges) {
        const fromNode = getNode(edge.from);
        const toNode = getNode(edge.to);
        const label = `${fromNode ? fromNode.label : edge.from} ↔ ${toNode ? toNode.label : edge.to} (${edge.id})`;
        const isBlocked = state.blockedEdges.has(edge.id);
        const item = createToggleItem(
            edge.id,
            label,
            'corridor',
            isBlocked,
            (checked) => toggleBlockEdge(edge.id, checked)
        );
        edgeToggles.appendChild(item);
    }

    // Update group titles
    document.querySelector('#nodeToggleGroup .toggle-group-title').textContent = t('roomsJunctions');
    document.querySelector('#exitToggleGroup .toggle-group-title').textContent = t('exits');
    document.querySelector('#edgeToggleGroup .toggle-group-title').textContent = t('corridors');
}

function createToggleItem(id, label, type, isActive, onChange) {
    const item = document.createElement('div');
    item.classList.add('toggle-item');
    item.id = `toggle-${id}`;
    if (isActive) item.classList.add('blocked');

    const labelDiv = document.createElement('div');
    labelDiv.classList.add('toggle-label');

    const dot = document.createElement('span');
    dot.classList.add('node-type-dot', type);
    labelDiv.appendChild(dot);

    const text = document.createElement('span');
    text.textContent = label;
    labelDiv.appendChild(text);

    const switchLabel = document.createElement('label');
    switchLabel.classList.add('toggle-switch');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = isActive;
    input.id = `check-${id}`;
    input.addEventListener('change', (e) => {
        onChange(e.target.checked);
        if (e.target.checked) {
            item.classList.add('blocked');
        } else {
            item.classList.remove('blocked');
        }
    });

    const slider = document.createElement('span');
    slider.classList.add('toggle-slider');

    switchLabel.appendChild(input);
    switchLabel.appendChild(slider);

    item.appendChild(labelDiv);
    item.appendChild(switchLabel);

    return item;
}

// ═══════════ EVENT HANDLERS ═══════════
function selectStart(nodeId) {
    const node = getNode(nodeId);
    if (!node) return;
    if (node.type === 'exit') return; // Can't select exits as start
    if (state.blockedNodes.has(nodeId)) return; // Can't select blocked nodes

    state.selectedStart = nodeId;

    const badge = document.getElementById('startBadge');
    badge.textContent = `${node.label} (${node.id})`;
    badge.classList.remove('empty');

    recalculateRoute();
    renderGraph();
    renderRoute();
}

function toggleBlockNode(nodeId, blocked) {
    if (blocked) {
        state.blockedNodes.add(nodeId);
    } else {
        state.blockedNodes.delete(nodeId);
    }
    recalculateRoute();
    renderGraph();
    renderRoute();
}

function toggleCloseExit(exitId, closed) {
    if (closed) {
        state.closedExits.add(exitId);
    } else {
        state.closedExits.delete(exitId);
    }
    recalculateRoute();
    renderGraph();
    renderRoute();
}

function toggleBlockEdge(edgeId, blocked) {
    if (blocked) {
        state.blockedEdges.add(edgeId);
    } else {
        state.blockedEdges.delete(edgeId);
    }
    recalculateRoute();
    renderGraph();
    renderRoute();
}

function recalculateRoute() {
    if (!state.selectedStart) {
        state.currentRoute = null;
        updateRouteDisplay();
        return;
    }
    state.currentRoute = computeRoute(state.selectedStart);
    updateRouteDisplay();
}

function resetAll() {
    const data = state.buildingData;
    if (!data) return;

    // Restore initial state from file
    state.blockedNodes = new Set(data.initial_state.blocked_nodes || []);
    state.blockedEdges = new Set(data.initial_state.blocked_edges || []);
    state.closedExits = new Set(data.initial_state.closed_exits || []);

    // Keep selected start but recalculate
    recalculateRoute();
    generateControls();
    renderGraph();
    renderRoute();
}

// ═══════════ FILE LOADING ═══════════
function loadBuildingData(data) {
    const errors = validateBuilding(data);
    if (errors.length > 0) {
        showError(t('invalidFile') + errors[0]);
        return false;
    }

    state.buildingData = data;
    state.blockedNodes = new Set(data.initial_state.blocked_nodes || []);
    state.blockedEdges = new Set(data.initial_state.blocked_edges || []);
    state.closedExits = new Set(data.initial_state.closed_exits || []);
    state.selectedStart = null;
    state.currentRoute = null;

    // Update UI
    document.getElementById('buildingName').textContent = data.building;
    hideError();

    generateControls();
    state.isInitialRender = true;
    renderGraph();
    state.isInitialRender = false;
    clearSvgLayer('routeLayer');
    updateRouteDisplay();

    // Update start badge
    const badge = document.getElementById('startBadge');
    badge.textContent = t('noneSelected');
    badge.classList.add('empty');

    return true;
}

function showError(message) {
    const section = document.getElementById('errorSection');
    const text = document.getElementById('errorText');
    text.textContent = message;
    section.style.display = '';
}

function hideError() {
    document.getElementById('errorSection').style.display = 'none';
}

// ═══════════ INITIALIZATION ═══════════
function init() {
    // Language toggle
    document.getElementById('langToggle').addEventListener('click', switchLanguage);

    // File input
    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                loadBuildingData(data);
            } catch (err) {
                showError(t('invalidFile') + err.message);
            }
        };
        reader.readAsText(file);
    });

    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetAll);

    // Auto-load building.json
    fetch('building.json')
        .then(res => {
            if (!res.ok) throw new Error('File not found');
            return res.json();
        })
        .then(data => {
            loadBuildingData(data);
        })
        .catch(() => {
            // building.json not available, user needs to upload
            console.log('No default building.json found. Please upload a file.');
        });
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
