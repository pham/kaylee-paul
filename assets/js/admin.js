async function list() {
  const pug = location.hash.substr(1)
    || location.pathname.split('/')[2];

  const info = await get('/list');

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
  const ret = await post(`/insert/${id}`, {
    guests: parseInt(guests),
    phone,
    name,
    manual: true,
  });

  if (ret?.success)
    location.href = `/rsvp#${id}`;

  return populate('rsvp-add');
}

