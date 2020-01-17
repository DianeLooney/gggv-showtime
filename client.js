const WSC = require('websocket').client;

const client = new WSC();

client.on('connect', (connection) => {
  connection.on('message', (msg) => {
    msg = JSON.parse(msg.utf8Data);
    console.log(msg);
  })
  /*
  connection.send(JSON.stringify({
    kind: 'setup',
    data: {
      bananas: { min: 0, max: 10, value: 5 },
    },
  }));
  */
  connection.send(JSON.stringify({
    kind: 'listen',
  }));
  /*setInterval(() => {
    connection.send(JSON.stringify({
      kind: 'update',
      key: 'bananas',
      value: 4,
    }))
  }, 1000);*/
})


client.connect('ws://localhost:8080/', 'gggv');
