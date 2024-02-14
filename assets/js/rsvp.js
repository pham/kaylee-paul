const restore = (e) => {
  const divId = e?.dataset?.id;
  query(`#${divId}`)
    .querySelectorAll('input')
    .forEach( i => i.disabled = false );
  e.disabled = false;
};

async function respond(e, action) {
  const divId = e?.dataset?.id;
  const el = query(`#${divId}`)
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
    await post(`/accept/${id}/${guests}`, payload);
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
    await post(`/decline/${id}`, payload);
    restore(e);
    location.href = `/status#${id}`;
  } catch (er) {
    restore(e);
    location.href = '/error';
  }
}

async function populateRsvp() {
  const enabled = await config('registration');

  const pug = location.hash.substr(1)
    || location.pathname.split('/')[2];

  if (!pug)
    return enabled ? populate('rsvp') : page(query('#rsvp'), 'rsvp-closed');

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
    const el = query('#note');
    el.hidden = false;
    el.innerHTML = note;
  }

  query('#date-time').hidden = false;
  if (confirmed !== undefined) {
    query(confirmed ? '#_accepted' : '#_declined').hidden = false;
  }
}

(async () => {
  populateRsvp();
  const text = await config('texts');
  if (text?.['rsvp-tag']) {
    query('#rsvp-tag').innerHTML = text['rsvp-tag'];
  }
})();
