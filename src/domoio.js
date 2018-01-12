var Request = require('request');
let W3CWebSocket = require('websocket').w3cwebsocket
var {Socket} = require('phoenix');

var BASE_URL = process.env.BASE_URL || "https://app.domoio.com";

var _token = null;
var _project_id;

var _socket;
var _callbacks = {};


const on = (event_name, callback) => {
  _callbacks[event_name] = callback;
};


const start = (opt) => {

  let env = process.env;

  let email = opt.email || env.DOMOIO_EMAIL;
  let password = opt.password || env.DOMOIO_PASSWORD;
  _project_id = opt.project_id || env.DOMOIO_PROJECT_ID;

  _request("POST", "/api/get_token", {email, password})
    .then(data => {
      _token = data.token;
      _connectSocket();
    });
};


const setPort = (device_id, port_id, value) => {
  let url = "/api/projects/" + _project_id + "/devices/" + device_id + "/ports/" + port_id
  _request("PUT", url, {value: value})
};


const _connectSocket = () => {
  let server = BASE_URL.replace("http", "ws")
  _socket = new Socket(server + "/socket", {transport: W3CWebSocket, params: {token: _token}})
  _socket.connect()

  _socket.onError( (e) => {
    if (e.message == "received bad response code from server 403") {
      //dispatch("SIGNED_OUT")
    }
    console.log("there was an error with the connection!")
  })

  _socket.onClose( (e) => {
    console.log("the connection was dropped")
    if (_callbacks.disconnect) _callbacks.disconnect()
  })


  // Now that you are connected, you can join channels with a topic:
  let channel = _socket.channel("project", {project_id: _project_id})
  channel.join()
    .receive("ok", resp => {
      console.log("Joined successfully", resp)
      if (_callbacks.connect) _callbacks.connect()
    })
    .receive("error", resp => { console.log("Unable to join", resp) })

  // Forward events
  channel.on("event", payload => {
    let callback = _callbacks[payload.event];
    if (callback) callback(payload.body);
  })
};



const _request = (method, url, json) => {
  let uri = BASE_URL + url;

  let options = {method, uri, json};

  if (_token) {
    options.headers = {authtoken: _token};
  }

  return new Promise((done, reject) => {
    Request(options, (error, response, body) => {
      if (response.statusCode < 300) {
        done(body);
      }
      reject({error, response, body});
    });
  });
};



module.exports =  { start, on, setPort }
