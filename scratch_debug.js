const WebSocket = require('ws');
const http = require('http');

http.get('http://localhost:9222/json', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const targets = JSON.parse(data);
      const target = targets.find(t => t.type === 'page');
      if (!target) {
        console.error('No page target found');
        process.exit(1);
      }
      
      const wsUrl = target.webSocketDebuggerUrl;
      console.log('Connecting to:', wsUrl);
      
      const ws = new WebSocket(wsUrl);
      
      ws.on('open', () => {
        // Enable domains
        ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
        ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
        
        console.log('Navigating to http://localhost:5173/admin/dashboard...');
        setTimeout(() => {
          ws.send(JSON.stringify({
            id: 3,
            method: 'Page.navigate',
            params: { url: 'http://localhost:5173/admin/dashboard' }
          }));
        }, 500);
      });
      
      ws.on('message', (msg) => {
        const response = JSON.parse(msg);
        
        // Console API logs
        if (response.method === 'Runtime.consoleAPICalled') {
          const args = response.params.args.map(a => {
            if (a.value !== undefined) return a.value;
            return JSON.stringify(a);
          }).join(' ');
          console.log(`[Console - ${response.params.type}]`, args);
        }
        
        // Uncaught exceptions
        if (response.method === 'Runtime.exceptionThrown') {
          console.error('\n[CRITICAL BROWSER EXCEPTION]');
          console.error(response.params.exceptionDetails.exception.description || JSON.stringify(response.params.exceptionDetails));
          console.error('\n');
        }
      });
      
      // Auto exit after 7 seconds
      setTimeout(() => {
        console.log('Done monitoring. Exiting...');
        process.exit(0);
      }, 7000);
      
    } catch (e) {
      console.error('Error parsing JSON:', e);
    }
  });
}).on('error', (err) => {
  console.error('Error fetching targets:', err);
});
