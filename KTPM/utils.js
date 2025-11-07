const Url = require('./models/Url.js');

function makeID(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
}

function findOrigin(id) {
  return Url.findByPk(id).then(record => record ? record.url : null);
}

function create(id, url) {
  return Url.create({ id, url }).then(() => id);
}

async function shortUrl(url) {
  while (true) {
    const newID = makeID(5);
    const exists = await findOrigin(newID);
    if (exists === null) {
      await create(newID, url);
      return newID;
    }
  }
}

module.exports = {
  findOrigin,
  shortUrl,
};
