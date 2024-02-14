async function list(bearer) {
  const pug = location.hash.substr(1)
    || location.pathname.split('/')[2];

  const info = await aget('/list', bearer);

  if (!info?.data) return;

  const {data} = info;
  const arr = [];

  for (const id in data) {
    const { name,confirmed,guests,type,invited,doubtful } = data[id];
    arr.push({
      name, id, guests, confirmed, type, invited, doubtful
    });
  }

  const sort = (a,b) => {
    const at = a.type || 5;
    const bt = b.type || 5;
    return at < bt ? -1
      : at > bt ? 1
      : a.name.localeCompare(b.name);
  };

  return arr.sort(sort);
}

async function init(bearer) {
  const info = await list(bearer);
  if (!info) return;

  const _el = (id) => document.getElementById(id);
  const el = _el('list');

  let accepted = 0;
  let declined = 0;
  let remained = 0;

  for (const {name,confirmed,invited,doubtful,guests,id} of info) {
    const icon = confirmed ? 'check'
      : confirmed === false ? 'close'
      : invited ? 'schedule' : '';
    el.innerHTML += `
      <tr>
        <td><span class='material-symbols-outlined'>${icon}</span></td>
        <th><a href='/rsvp#${id}'>${name}</a></th>
        <td><code>${id}</code></td>
        <td>${guests || ''}</td>
      </tr>
    `;

    const count = parseInt(guests || 0);

    if (confirmed === undefined && !doubtful) {
      remained += count || 0;
    } else if (confirmed) {
      accepted += count;
    } else {
      declined += count;
    }
  }

  _el('_accepted').innerText = accepted;
  _el('_declined').innerText = declined;
  _el('_remained').innerText = remained;
  _el('_total').innerText = remained + accepted;
  _el('stats').hidden = false;
}

(async () => {
  await init('lovelove');
})();

