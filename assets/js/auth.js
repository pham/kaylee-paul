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

  try {
    const pw = passcode.value;
    await aget('/access', pw);
    query('#auth').remove();
    localStorage.setItem('bearer', pw);
    callback(pw);
  } catch(error) {
    passcode.classList.add('error');
    passcode.value = '';
    localStorage.removeItem('bearer');
    console.error(error);
  }

  e.disabled =
  passcode.disabled = false;
}

(async () => {
  const bearer = localStorage.getItem('bearer');
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

