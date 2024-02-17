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
  const passcode = sessionStorage.getItem('bearer');
  const ret = await apost(`/insert/${id}`, passcode, {
    guests: parseInt(guests),
    phone,
    name,
    manual: true,
  });

  if (ret?.success)
    location.href = `/rsvp#${id}`;

  return populate('rsvp-add');
}

function callback() {
  query('#rsvp-add').classList.add('visible');
}
