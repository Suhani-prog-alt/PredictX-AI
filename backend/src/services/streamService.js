let clients = [];

const addClient = (res) => {
    clients.push(res);
    console.log(`[SSE] Client connected. Total active clients: ${clients.length}`);
};

const removeClient = (res) => {
    clients = clients.filter(c => c !== res);
    console.log(`[SSE] Client disconnected. Total active clients: ${clients.length}`);
};

const broadcast = (data) => {
    console.log(`[SSE] Broadcasting update to ${clients.length} clients`);
    clients.forEach(c => {
        c.write(`data: ${JSON.stringify(data)}\n\n`);
    });
};

module.exports = {
    addClient,
    removeClient,
    broadcast
};
