function list(info) {
  if (!info?.data) return;

  const {data} = info;
  const arr = [];

  for (const id in data) {
    const { name,confirmed,type,company,phone } = data[id];
    if (!company) continue;

    for (const guest of company) {
      const kid = guest.match(/\*$/) ? true : false;
      arr.push({
        name: guest.replace(/\*$/,''),
        id,
        kid,
        type,
        phone,
        confirmed,
      });
    }
  }

  const sort = (a,b) => {
    const at = a.type || 5;
    const bt = b.type || 5;
    return at < bt ? -1
      : at > bt ? 1
      : a.id < b.id ? -1
      : a.id > b.id ? 1
      : a.name.localeCompare(b.name);
  };

  return arr.sort(sort);
}

function draw(data) {
  const info = list(data);
  if (!info) return;

  const _el = (id) => document.getElementById(id);
  const el = _el('list');

  let accepted = 0;
  let remained = 0;
  let children = 0;

  for (const {name,confirmed,id,phone,kid} of info) {
    const icon = kid ? 'child_care' : confirmed ? 'check' : '';
    el.innerHTML += `
      <tr id='${id}'>
        <td><span class='material-symbols-outlined'>${icon}</span></td>
        <th><a href='/rsvp#${id}'>${name}</a></th>
        <td><code>${phone}</code></td>
      </tr>
    `;

    if (confirmed === undefined) {
      remained++;
    } else if (confirmed) {
      accepted++;
    }
    if (kid) children ++;
  }

  _el('_accepted').innerText = accepted;
  _el('_remained').innerText = remained;
  _el('_children').innerText = children;
  _el('_total').innerText = remained + accepted;
  _el('stats').hidden = false;
}

async function download(fname='guests.csv') {
  const passcode = LocalStorage.getItem('bearer');
  const info = await list(await aget('/list', passcode));
  if (!info) return false;

  const data = [
    'ID,Name,Type,Phone,Tag',
  ];
  let idx = 1;
  for (const {name,type,phone,kid} of info) {
    data.push([idx++, name, type, phone, kid ? 'kid' : ''].join(','));
  }

  const csvData = new Blob( ['\ufeff'+data.join("\n") ], {
    type: 'text/csv;charset=utf-8;'
  });
  const csvURL = navigator.msSaveBlob
    ? navigator.msSaveBlob (csvData,fname)
    : window.URL.createObjectURL(csvData);

  const link = document.createElement('a');
  link.href = csvURL;
  link.setAttribute('download', fname);
  link.click();
  link.remove();
  return true;
}

async function callback(pw) {
  try {
    const info = await aget('/list', pw);
    draw(info);
    query('#guests').classList.add('visible');
    return true;
  } catch {
    return false;
  }
}

