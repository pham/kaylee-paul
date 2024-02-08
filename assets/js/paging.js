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

function page(e, id, contentId, html) {
  if (e?.classList)
    e.classList.remove('visible');

  const el = document.getElementById(id);
  if (el?.classList)
    el.classList.add('visible');

  if (contentId && html) {
    const content = document.getElementById(contentId);
    if (content)
      content.innerHTML = html;
  }
}
