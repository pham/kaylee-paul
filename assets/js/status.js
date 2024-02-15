function error() {
  query('#_notfound').hidden = false;
  query('#rsvp').hidden = false;
}

(async () => {
  const data = await info();
  if (!data?.data) return error();

  const { name, short, guests, confirmed, phone, id } = data.data;
  if (confirmed === undefined) return error();

  const el = query('h1 span');
  el.innerText = confirmed ? 'accepted' : 'declined';
  el.hidden = false;

  query('h2.name').innerText = name;
  if (short)
    query('p span.short').innerText = short + ', your';

  toggleHidden(confirmed, '_accepted', '_declined');
  toggleHidden(confirmed, 'info', 'rsvp');

  if (!confirmed)
    query('#rsvp a').href = `/rsvp#${id}`;
  else
    query('p span.large').innerText = guests;
})();
