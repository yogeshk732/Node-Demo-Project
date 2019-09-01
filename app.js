/* import http from 'http';

http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain'
    })
    res.end('Hello World\n')
}).listen(3000, '127.0.0.1')

console.log('Server running at http://127.0.0.1:3000/')

 */

require("dotenv").config({
    silent: true
});
/* require("babel-register")({
    presets: ["es2016-node4", "es2017"]
});
 */
const path = require("path");
require(path.resolve("./app/server.js"));