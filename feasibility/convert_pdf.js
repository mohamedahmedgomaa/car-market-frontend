import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import WebSocket from 'ws';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const htmlPath = 'file:///C:/Users/mido1/PhpstormProjects/car-market-frontend/feasibility/study_v4.html';
const outputPath = 'C:\\Users\\mido1\\PhpstormProjects\\car-market-frontend\\feasibility\\NegmCars_Feasibility_Study_v4.pdf';

console.log('Starting Edge process...');
const edgeProcess = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  htmlPath
]);

setTimeout(async () => {
  try {
    http.get('http://127.0.0.1:9222/json', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const targets = JSON.parse(data);
        const pageTarget = targets.find(t => t.type === 'page');
        if (!pageTarget) {
          console.error('No page target found');
          edgeProcess.kill();
          process.exit(1);
        }

        const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
        ws.on('open', () => {
          console.log('Connected to CDP websocket, requesting PDF...');
          ws.send(JSON.stringify({
            id: 1,
            method: 'Page.printToPDF',
            params: {
              paperWidth: 8.27, // A4
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

        ws.on('message', (msg) => {
          const resp = JSON.parse(msg);
          if (resp.id === 1) {
            if (resp.result && resp.result.data) {
              const buffer = Buffer.from(resp.result.data, 'base64');
              fs.writeFileSync(outputPath, buffer);
              console.log(`Successfully written PDF to ${outputPath} (${buffer.length} bytes)`);
            } else {
              console.error('PDF generation failed:', resp);
            }
            ws.close();
            edgeProcess.kill();
            process.exit(0);
          }
        });
      });
    });
  } catch (err) {
    console.error('Error:', err);
    edgeProcess.kill();
    process.exit(1);
  }
}, 2000);
