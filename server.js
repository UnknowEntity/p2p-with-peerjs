var express = require("express");
var bodyParser = require("body-parser");
var app = express();
var http = require("http").Server(app);
var Peer = require("peerjs");

const PORT = 3000;

app.use(express.static(__dirname));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var peerList = [];

const key = Date.now();

var peer = new Peer(key);

var getConnect = (remotePeerId) => {
  var conn = peer.connect(remotePeerId);
  handleConnection(conn);
};

peer.on("connection", function (conn) {
  conn.send({ type: 200, content: "connection confirm" });
  console.log("Connected with peer: " + conn.peer);
  handleConnection(conn);
});

var handleConnection = (conn) => {
  conn.on("open", function () {
    conn.on("data", (data) => {
      if (data.type === 200) {
        console.log(data.content);
        if (peerList.length > 1) {
          conn.send({ type: 300, peerList });
          broadcastMessage({ type: 400, remoteId: conn.peer });
        }
      } else if (data.type === 300) {
        peerList = data.peerList;
        console.log("recive peers list");
      } else if (data.type === 400) {
        getConnect(data.remoteId);
        console.log("connect to new peer");
      } else if (data.type === 500) {
        console.log(`Node ${key} said hello`);
      }
    });

    conn.on("error", function () {
      // handle error
      connectionError(conn);
    });

    conn.on("close", function () {
      // Handle connection closed
      connectionClose(conn);
    });
    peerList.push({ removeId: conn.peer, connection: conn });
  });
};

var broadcastMessage = (message) => {
  for (var i = 0; i < connections.length; i++) {
    connections[i].send(message);
  }
};

app.get("/id", (req, res) => {
  res.json(key);
});

app.get("/new_node", (req, res) => {
  const { remoteId } = req.query;
  getConnect(remoteId);
});

app.get("/hello", (req, res) => {
  broadcastMessage({ type: 500 });
});

var server = http.listen(PORT, () => {
  console.log(`Express server running on ${PORT}...`);
});
