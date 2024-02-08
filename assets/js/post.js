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
  const content = document.getElementById('lookup-content');
  let info;
  try {
    info = await makeRequest('GET', `/id/${ID(n)}`);
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

async function respond(e, action) {
  const divId = e?.dataset?.id;
  const el = document.getElementById(divId);
  const ins = el.querySelectorAll('input');
  const data = { };
  const accepted = document.getElementById('accepted-content');
  const declined = document.getElementById('declined-content');
  const error = document.getElementById('error-content');

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
    page(el, 'error', 'error-content', `
      Sorry, I cannot find you on the guest list.
      Please contact Paul!
    `);
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

async function accept(e) {
  const divId = e?.dataset?.id;
  const el = document.getElementById(divId);
  const info = await respond(e);

  const { name, guests, phone, message, db: { short } } = info;
  const id = ID(phone);

  let salutation = 'Your';

  if (short)
    salutation = `Dear ${short}, your`;

  try {
    await makeRequest('POST', `/accept/${id}/${guests}`, {
      message: `${message || ''} -- Name: ${name} -- Phone: ${phone}`,
    });
    page(el, 'accepted', 'accepted-content', `
      <h1 class='name'>${name}</h1>
      <p>
        Thank you! You are confirmed for party of ${guests}.
      </p>
      <p>
        ${salutation} presence will be a blessing to us!
        We can't wait to celebrate this moment with you.
      </p>

      <p>
        Love,<br/>
        Paul & Kaylee
      </p>
    `);
  } catch (er) {
    page(el, 'error', 'error-content', 'Sorry, I cannot confirm your request');
  }

  restore(e);
}

async function decline(e) {
  const divId = e?.dataset?.id;
  const el = document.getElementById(divId);
  const info = await respond(e);

  const { name, guests, phone, message, db: { short } } = info;
  const id = ID(phone);

  let salutation = 'Your';

  if (short)
    salutation = `Dear ${short}, your`;

  try {
    await makeRequest('POST', `/decline/${id}`, {
      message: `${message || ''} -- Name: ${name} -- Phone: ${phone} -- Guests: ${guests}`,
    });
    page(el, 'declined', 'declined-content', `
      <h1 class='name'>${name}</h1>
      <p>
        ${salutation} presence will be missed at our wedding!
        Let's keep in touch.
      </p>

      <p>
        Love,<br/>
        Paul & Kaylee
      </p>
    `);
  } catch (er) {
    page(el, 'error', 'error-content', `
      ${salutation} answer can't be recorded.
      It's ok, we will miss you though.
    `);
  }

  restore(e);
}

