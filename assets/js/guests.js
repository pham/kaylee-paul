(async () => {
  const info = await list();
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
})();

