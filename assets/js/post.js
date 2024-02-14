const ENDPOINT = 'https://rsvp-sf5ynstwha-uc.a.run.app';

const ID = (n) => n.replace(/[^0-9]/g, '');

function makeRequest(method, path, bearer, payload) {
  return new Promise(function (resolve, reject) {
    const xhr = new XMLHttpRequest();
    const url = `${ENDPOINT}${path}`;

    xhr.open(method, url);
    xhr.setRequestHeader('Content-type', 'application/json');
    if (bearer)
      xhr.setRequestHeader('Authorization', bearer);
    xhr.onload = function () {
      if (this.status >= 200 && this.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject({
          status: this.status,
          statusText: xhr.statusText,
        });
      }
    };
    xhr.onerror = function () {
      reject({
        status: this.status,
        statusText: xhr.statusText
      });
    };
    xhr.send(payload ? JSON.stringify(payload) : null);
  });
}

const get = async (path) => await makeRequest('GET', path);
const post = async (path,payload) => await makeRequest('POST', path, null, payload);

const aget = async (path,bearer) => await makeRequest('GET', path, bearer);
const apost = async (path,bearer,payload) => await makeRequest('POST', path, bearer, payload);

const config = async (key) => {
  const info = await get(`/config/${key}`);
  return (info?.data === undefined) ? null : info.data;
};

