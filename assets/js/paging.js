function toggleVisibility(e) {
  if (e?.classList)
    e.classList.add('invisible');

  const id = e?.dataset?.id;
  const el = document.getElementById(id);

  if (el?.classList) {
    el.classList.toggle('visible');
    setTimeout( () => e.classList.remove('invisible'), 1000 );
  }
}
