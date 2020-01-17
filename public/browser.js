const ws = new WebSocket('ws://localhost:8080', 'gggv');
const main = document.getElementById('main');

ws.addEventListener('open', event => {
  console.log('opened', event);
  ws.send('{"kind": "listen"}')
})

ws.addEventListener('message', event => {
  let msg = JSON.parse(event.data);
  switch (msg.kind) {
    case 'delete':
      doDelete(msg);
      break;
    case 'update':
      doUpdate(msg);
      break;
    case 'setup':
      doSetup(msg);
      break;
    default:
      return console.log(`Unhandled message kind: ${event.data}`)
  }
  console.dir(state);
})

let state = {};
let doDelete = msg => {
  const { key } = msg;
  delete state[key];
  // delete html element
  const container = document.getElementById(`${key}-container`);
  main.removeChild(container);
  const label = document.getElementById(`${key}-label`);
  container.removeChild(label);
  const slider = document.getElementById(`${key}-slider`);
  container.removeChild(slider);
};

let doUpdate = ({ key, value }) => {
  state[key].value = value;
  // update value of html control
  const elt = document.getElementById(`${key}-slider`);
  elt.value = value;
};

let doSetup = ({ key, min, max, value }) => {
  state[key] = { value, min, max };
  // recreate all html elements
  const container = document.createElement('DIV');
  container.id = `${key}-container`

  const label = document.createElement('SPAN');
  label.id = `${key}-label`
  label.innerText = key;

  const slider = document.createElement('INPUT');
  slider.id = `${key}-slider`;
  slider.setAttribute('type', 'range');
  slider.setAttribute('min', min);
  slider.setAttribute('max', max);
  slider.setAttribute('step', 'any');
  slider.value = value;
  slider.oninput = e => {
    const { value } = e.target;
    ws.send(JSON.stringify({
      kind: 'update',
      key,
      value: Number(value)
    }))
  }

  container.appendChild(label);
  container.appendChild(slider);
  main.appendChild(container);
};
