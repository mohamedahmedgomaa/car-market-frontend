const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlPath = 'file:///C:/Users/mido1/PhpstormProjects/car-market-frontend/feasibility/study_v4.html';
const outputPath = 'C:\\Users\\mido1\\PhpstormProjects\\car-market-frontend\\feasibility\\NegmCars_Feasibility_Study_v4.pdf';

console.log('Launching Edge in headless CDP mode...');
const edgeProc = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  htmlPath
]);

setTimeout(() => {
  http.get('http://127.0.0.1:9222/json', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      try {
        const targets = JSON.parse(data);
        const page = targets.find(t => t.type === 'page');
        if (!page) {
          console.error('Page target not found in targets:', targets);
          edgeProc.kill();
          process.exit(1);
        }

        console.log('Connecting to WS:', page.webSocketDebuggerUrl);
        const ws = new WebSocket(page.webSocketDebuggerUrl);

        ws.on('open', () => {
          console.log('WS connection open, requesting Page.printToPDF...');
          ws.send(JSON.stringify({
            id: 100,
            method: 'Page.printToPDF',
            params: {
              paperWidth: 8.27,
              paperHeight: 11.69,
              marginTop: 0,
              marginBottom: 0,
              marginLeft: 0,
              marginRight: 0,
              printBackground: true,
              displayHeaderFooter: false,
              preferCSSPageSize: true
            }
          }));
        });

        ws.on('message', (message) => {
          const res = JSON.parse(message);
          if (res.id === 100) {
            if (res.result && res.result.data) {
              const pdfBuffer = Buffer.from(res.result.data, 'base64');
              fs.writeFileSync(outputPath, pdfBuffer);
              console.log(`✅ SUCCESS! PDF saved to ${outputPath} (${pdfBuffer.length} bytes)`);
            } else {
              console.error('❌ Failed to render PDF:', res);
            }
            ws.close();
            edgeProc.kill();
            process.exit(0);
          }
        });

        ws.on('error', (err) => {
          console.error('WS Error:', err);
          edgeProc.kill();
          process.exit(1);
        });

      } catch (err) {
        console.error('JSON parse error:', err);
        edgeProc.kill();
        process.exit(1);
      }
    });
  }).on('error', (err) => {
    console.error('HTTP get error:', err);
    edgeProc.kill();
    process.exit(1);
  });
}, 3000);
