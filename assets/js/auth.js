async function access(e) {
  const divId = e?.dataset?.id;
  const passcode = query(`#${divId} input[name="passcode"]`)

  passcode.classList.remove('error');

  if (!passcode.value) {
    passcode.classList.add('error');
    return;
  }

  e.disabled = true;
  passcode.disabled = true;

  const perm = await callback(passcode.value);
  if (perm) {
    query('#auth').remove();
    sessionStorage.setItem('bearer', passcode.value);
  } else {
    passcode.classList.add('error');
    passcode.value = '';
    sessionStorage.removeItem('bearer');
  }

  e.disabled =
  passcode.disabled = false;
}

(async () => {
  const bearer = sessionStorage.getItem('bearer');
  const form = query('#auth form');
  const inp = query('#auth input[name="passcode"]');
  const btn = query('#auth-btn');
  if (bearer) {
    inp.value = bearer;
    access(btn);
  } else {
    form.addEventListener('submit', e => {
      e.preventDefault();
      access(btn);
    });
  }
})();

