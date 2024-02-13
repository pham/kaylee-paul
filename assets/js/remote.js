const query = (id) => document.querySelector(id);
const now = () => Math.trunc(Date.now() / 1000);

async function lookup(n) {
  let info;
  try {
    info = await get(`/id/${ID(n)}`);
    info.data.id = ID(n);
  } catch {
    info = null;
  }
  return info;
}

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

async function info() {
  const pug = location.hash.substr(1)
    || location.pathname.split('/')[2];

  if (!pug) return;

  return await lookup(pug);
}

function toggleHidden(confirmed, accepted, declined) {
  document.getElementById(confirmed ? accepted : declined).hidden = false;
}
