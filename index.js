const WSS = require('websocket').server;
const http = require('http');
const redis = require('redis');
const client = redis.createClient({ url: process.env.GGGV_REDIS });
const sub = redis.createClient({ url: process.env.GGGV_REDIS });

const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const serve = serveStatic('public', { 'index': ['index.html', 'index.htm'] })
const server = http.createServer((req, res) => {
  serve(req, res, finalhandler(req, res));
});

server.listen(3000, () => {
  console.log("Server up");
});

let listeners = [];

const wss = new WSS({ httpServer: server, autoAcceptConnections: false });
wss.on('request', (request) => {
  const conn = request.accept('gggv', request.origin);
  console.log('Connection accepted');

  conn.on('close', () => {
    listeners = listeners.filter(x => x !== conn);
  });

  conn.on('message', msg => {
    try {
      msg = JSON.parse(msg.utf8Data);
    } catch (ex) {
      return;
    }
    console.log(msg)
    switch (msg.kind) {
      case 'listen':
        client.KEYS('/data/*', (err, data) => {
          if (err) throw err;

          console.log("/data/ keys: ", data)
          data.forEach(key => {
            client.HGETALL(key, (err, data) => {
              if (err) throw err;

              const { min, max, value } = data;
              conn.sendUTF(JSON.stringify({ kind: 'setup', key: key.slice(6), min, max, value }));
            })
          });
        });

        listeners.push(conn);
        break;
      case 'setup':
        client.KEYS('/data/*', (err, data) => {
          if (err) throw err;

          console.log(data);
          for (const key in data) {
            if (msg[k]) return;

            client.DEL(`/data/${key}`);
            client.publish('/data', JSON.stringify({ kind: 'delete', key: key.slice(6) }));
          }
        })
        for (const key in msg.data) {
          const { min, max, value } = msg.data[key];
          client.HSET(`/data/${key}`, 'min', min);
          client.HSET(`/data/${key}`, 'max', max);
          client.HSET(`/data/${key}`, 'value', value);
          client.publish('/data', JSON.stringify({ kind: 'setup', key, min, max, value }));
        }
        break;
      case 'update':
        const { key, value } = msg;
        client.HSET(`/data/${key}`, 'value', value);
        client.publish('/data', JSON.stringify({ kind: 'update', key, value }));
        break;
    }
  });
});

sub.on('message', (channel, msg) => {
  console.log(`[redis] ${msg}`)
  listeners.forEach(conn => {
    conn.sendUTF(msg)
  })
});

sub.subscribe('/data');
