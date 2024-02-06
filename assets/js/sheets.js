const SPREADSHEET_ID = '1XXKcCwr-bHTahb7revK7_QT5Spo3cKYZKcDxolrkl4c';
const SHEET = 'Guests';
const RANGE = `${SHEET}!C3:G`;
const API_KEY = 'AIzaSyBal21JhTttdaegvzcI65FwmhRXkhDoVIA';
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4';
let gapiInited = false;

function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
}

async function getData() {
  let response;
  const content = document.getElementById('content');

  content.innerText = 'Looking up your info...';

  try {
    response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: RANGE,
    });
  } catch (err) {
    content.innerText = err.message;
    return;
  }

  const range = response.result;
  if (!range || !range.values || range.values.length == 0) {
    content.innerText = 'No values found.';
    return;
  }

  let row = 2;
  const data = {};

  for (const [type,order,name,number,guests] of range.values) {
    row++;
    if (number) {
      const phone = number.replace(/[^0-9]/g, '');
      data[phone] = {
        type, order, name, row, number, guests
      };
    }
  }

  content.innerText = `Found ${Object.keys(data).length} records`;
  return data;
}

async function getRow(n) {
  const content = document.getElementById('content');
  const data = await getData();
  const phone = n.replace(/[^0-9]/g, '');

  if (!data[phone]) {
    content.innerText = 'We do not have a record of your RSVP :(';
    return;
  }

  return data[phone];
}

async function findNumber(n) {
  const content = document.getElementById('content');
  const {name,guests} = await getRow(n);

  content.innerHTML = `
    <h3>${name}</h3>
    ${guests ? 'Confirmed ${guests} guests' : 'Unconfirmed'}
  `;
}

async function confirm(e) {
  const id = e?.dataset?.id;
  const el = document.getElementById(id);
  const ins = el.querySelectorAll('input');
  const data = { };

  ins.forEach( i => {
    i.classList.remove('error');

    if (!i.value) {
      i.classList.add('error');
      return;
    }
    data[i.name] = i.value;
  });

  const {name,phone,guests} = data;

  if (!name || !phone || !guests)
    return;

  const info = await getRow(phone);
  if (!info) {
    alert('Sorry, I cannot find you on the guest list. Please contact Paul!');
    return;
  }

  confirmRSVP(info, guests, (r) => alert(JSON.stringify(r)));
}

function confirmRSVP(data, value, callback) {
  const { row, guests } = data;

  if (guests && guests == value) {
    alert(`Already confirmed ${guests}`);
    return;
  }

  const resource = [ [ value ] ];
  try {
    gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET}!G${row}`,
      valueInputOption: 'RAW',
      resource,
    }).then((response) => {
      const result = response.result;
      console.log(`${result.updatedCells} cells updated.`);
      if (callback) callback(response);
    });
  } catch (err) {
    alert(err.message);
    return;
  }
}

