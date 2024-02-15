function access(e) {
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
    callback(passcode.value);
    query('#auth').remove();
    sessionStorage.setItem('bearer', passcode.value);
  } catch (err) {
    passcode.classList.add('error');
    passcode.value = '';
    sessionStorage.removeItem('bearer');
    console.error(err);
  }

  e.disabled =
  passcode.disabled = false;
}

(async () => {
  const bearer = sessionStorage.getItem('bearer');
  if (bearer) {
    query('#auth input[name="passcode"]').value = bearer;
    access(query('#auth-btn'));
  }
})();

