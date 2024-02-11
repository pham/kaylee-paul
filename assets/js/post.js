const ENDPOINT = 'https://rsvp-sf5ynstwha-uc.a.run.app';

const ID = (n) => n.replace(/[^0-9]/g, '');

function post(path, params, callback) {
  const http = new XMLHttpRequest();
  const url = `${ENDPOINT}/${path}`;

  http.open('POST', url, true);
  http.setRequestHeader('Content-type', 'application/json');

  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      callback(JSON.parse(http.responseText));
    }
  }
  http.send(JSON.stringify(params));
}

function get(path, callback) {
  const http = new XMLHttpRequest();
  const url = `${ENDPOINT}${path}`;

  http.open('GET', url);
  http.setRequestHeader('Content-type', 'application/json');

  http.onreadystatechange = function() {
    if (http.readyState == 4 && http.status == 200) {
      callback(JSON.parse(http.responseText));
    }
  }
  http.send();
}

function makeRequest(method, path, payload) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    const url = `${ENDPOINT}${path}`;
    xhr.open(method, url);
    xhr.setRequestHeader('Content-type', 'application/json');
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send(payload ? JSON.stringify(payload) : null);
  });
}

async function lookup(n) {
  let info;
  try {
    info = await makeRequest('GET', `/id/${ID(n)}`);
    info.data.id = ID(n);
  } catch {
    info = null;
  }
  return info;
}

function findNumber(n) {
  const content = document.getElementById('content');

  content.innerText = 'Looking up...';

  get(`/id/${ID(n)}`, (info) => {
    console.log(info)

    const { name, guests } = info.data;

    content.innerHTML = `
      <h1 class='name'>${name}</h1>
      ${guests ? 'Party of ${guests}' : 'Unconfirmed'}
    `;
  });
}

const restore = (e) => {
  const divId = e?.dataset?.id;
  document.getElementById(divId)
    .querySelectorAll('input')
    .forEach( i => i.disabled = false );
  e.disabled = false;
};

const populate = (divId, info) => {
  document.getElementById(divId)
    .querySelectorAll('input, button')
    .forEach( e => {
      e.disabled = false;

      if (info?.confirmed !== undefined && ['phone','name'].includes(e.name))
        e.disabled = true;

      if (e.tagName === 'INPUT' && info)
        e.value = info[e.name] || '';
    });
};

async function respond(e, action) {
  const divId = e?.dataset?.id;
  const el = document.getElementById(divId);
  const ins = el.querySelectorAll('input');
  const data = { };

  e.disabled = true;

  ins.forEach( i => {
    i.classList.remove('error');

    if (!i.value && i.name !== 'message') {
      i.classList.add('error');
      return;
    }

    data[i.name] = i.value;
    i.disabled = true;
  } );

  const {name,phone,guests,message} = data;

  if (!name || !phone || !guests) {
    restore(e);
    return;
  }

  const info = await lookup(phone);

  if (!info || !info.success) {
    alert('Sorry, I cannot find you on the guest list.  Please contact Paul!');
    restore(e);
    return;
  }

  return {
    db: info.data,
    guests,
    phone,
    name,
    message,
  };
}

const now = () => Math.trunc(Date.now() / 1000);

async function accept(e) {
  const info = await respond(e);

  if (!info) return;

  const { name, guests, phone, message, db: { short } } = info;
  const id = ID(phone);

  try {
    const payload = {
      message: `Name: ${name} -- Phone: ${phone}`
    };
    if (message) {
      payload.message += ` -- ${message}`;
      payload.meta = { [`accepted-${now()}`]: message };
    }
    await makeRequest('POST', `/accept/${id}/${guests}`, payload);
    restore(e);
    location.href = `/status#${id}`;
  } catch (er) {
    restore(e);
    location.href = '/error';
  }
}

async function decline(e) {
  const info = await respond(e);

  if (!info) return;

  const { name, guests, phone, message, db: { short } } = info;
  const id = ID(phone);

  try {
    const payload = {
      message: `Name: ${name} -- Phone: ${phone} -- Guests: ${guests}`
    };
    if (message) {
      payload.message += ` -- ${message}`;
      payload.meta = { [`declined-${now()}`]: message };
    }
    await makeRequest('POST', `/decline/${id}`, payload);
    restore(e);
    location.href = `/status#${id}`;
  } catch (er) {
    restore(e);
    location.href = '/error';
  }
}

async function populateRsvp() {
  const conf = await makeRequest('GET', '/config/registration');
  const enabled = !!conf?.data;

  const pug = location.hash.substr(1)
    || location.pathname.split('/')[2];

  if (!pug)
    return enabled ? populate('rsvp') : page(document.querySelector('#rsvp'), 'rsvp-closed');

  const id = ID(pug);
  const info = await lookup(id);

  if (!info || !info.success)
    return enabled ? populate('rsvp') : null;

  const {
    name,
    phone=id,
    guests=1,
    confirmed,
    note,
  } = info.data;

  populate('rsvp', {
    name,
    phone,
    guests,
    confirmed,
  });

  if (note) {
    const el = document.getElementById('note');
    el.hidden = false;
    el.innerHTML = note;
  }

  document.querySelector('#date-time').hidden = false;
  if (confirmed !== undefined) {
    document.getElementById(confirmed ? '_accepted' : '_declined').hidden = false;
  }
}

async function info() {
  const pug = location.hash.substr(1)
    || location.pathname.split('/')[2];

  if (!pug) return;

  return await lookup(pug);
}

function toggleHidden(confirmed, accepted, declined) {
  document.getElementById(confirmed ? accepted : declined).hidden = false;
}

async function list() {
  const pug = location.hash.substr(1)
    || location.pathname.split('/')[2];

  const info = await makeRequest('GET', '/list');

  if (!info?.data) return;

  const {data} = info;
  const arr = [];

  for (const id in data) {
    const { name,confirmed,guests,type } = data[id];
    arr.push({
      name, id, guests, confirmed, type
    });
  }

  return arr.sort( (a,b) => a.type - b.type );
}

async function add(e) {
  const ins = document.querySelectorAll('#rsvp-add input');
  const data = { };

  e.disabled = true;

  ins.forEach( i => {
    i.classList.remove('error');

    if (!i.value) {
      i.classList.add('error');
      return;
    }

    data[i.name] = i.value;
    i.disabled = true;
  } );

  const {name,phone,guests} = data;

  if (!name || !phone || !guests)
    return populate('rsvp-add');

  const info = await lookup(phone);

  if (info?.success) {
    alert(`${phone} already exists`);
    return populate('rsvp-add');
  }

  const id = ID(phone);
  const ret = await makeRequest('POST', `/insert/${id}`, {
    guests: parseInt(guests),
    phone,
    name,
    manual: true,
  });

  if (ret?.success)
    location.href = `/rsvp#${id}`;

  return populate('rsvp-add');
}
