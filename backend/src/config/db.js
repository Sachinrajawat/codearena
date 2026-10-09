const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);

const mongoose = require('mongoose');

async function main(){
    await mongoose.connect(process.env.DB_CONNECT_STRING);
}

module.exports = main;