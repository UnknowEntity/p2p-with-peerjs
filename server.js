var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var Peer = require("peerjs-nodejs");

const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var peerList = [];

const key = `Node-${Date.now()}`;

var peer = new Peer(key);

var getConnect = (remotePeerId) => {
  var conn = peer.connect(remotePeerId);
  conn.serialization = "json";
  console.log("Trying to connected with peer: " + conn.peer);
  peerList.push(conn);
  handleConnection(conn);
};

peer.on("connection", function (conn) {
  conn.serialization = "json";
  console.log("Connected with peer: " + conn.peer);
  peerList.push(conn);
  handleConnection(conn);
});

var handleConnection = (conn) => {
  conn.on("open", function () {
    conn.send({ type: 200, content: "connection confirm" });
    conn.on("data", (data) => {
      console.log(`Data send: type ${data.type}`);
      if (data.type === 200) {
        console.log(data.content);
        if (peerList.length > 0) {
          broadcastMessage({ type: 400, remoteId: conn.peer });
        }
      } else if (data.type === 400) {
        if (data.remoteId !== key) {
          getConnect(data.remoteId);
          console.log("connect to new peer");
        }
      } else if (data.type === 500) {
        console.log(`Node ${key} said hello`);
      }
    });

    conn.on("error", function () {
      // handle error
      //connectionError(conn);
      console.log(`Node ${conn.peer} error`);
    });

    conn.on("close", function () {
      // Handle connection closed
      //connectionClose(conn);
      console.log(`Node ${conn.peer} closed`);
    });
  });
};

var broadcastMessage = (message) => {
  for (var i = 0; i < peerList.length; i++) {
    peerList[i].send(message);
  }
};

app.get("/id", (req, res) => {
  res.json(key);
});

app.get("/new_node", (req, res) => {
  const { remoteId } = req.query;
  getConnect(remoteId);
  res.json({ msg: "ok" });
});

app.get("/hello", (req, res) => {
  broadcastMessage({ type: 500 });
  res.json(peerList.length);
});

var server = http.listen(PORT, () => {
  console.log(`Express server running on ${PORT}...`);
});
