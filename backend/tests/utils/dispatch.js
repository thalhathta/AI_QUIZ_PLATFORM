import { EventEmitter } from "node:events";

export function dispatch(app, { method = "GET", path = "/", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = path;
    req.originalUrl = path;
    req.path = path;
    req.headers = { ...headers };
    req.app = app;
    req.ip = "127.0.0.1";
    req.socket = { remoteAddress: "127.0.0.1" };
    req.connection = req.socket;

    if (body !== undefined) {
      req.body = body;
    }

    const res = new EventEmitter();
    res.app = app;
    res.headers = {};
    res.statusCode = 200;

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    res.setHeader = (name, value) => {
      res.headers[name.toLowerCase()] = value;
    };

    res.getHeader = (name) => res.headers[name.toLowerCase()];
    res.getHeaders = () => ({ ...res.headers });
    res.hasHeader = (name) => name.toLowerCase() in res.headers;
    res.removeHeader = (name) => {
      delete res.headers[name.toLowerCase()];
    };

    const finish = () => {
      resolve({
        statusCode: res.statusCode,
        body: res.body,
        headers: res.headers,
      });
    };

    res.json = (payload) => {
      res.body = payload;
      res.emit("finish");
      return res;
    };

    res.send = (payload) => {
      res.body = payload;
      res.emit("finish");
      return res;
    };

    res.end = (payload) => {
      res.body = payload;
      res.emit("finish");
      return res;
    };

    res.once("finish", finish);

    app.handle(req, res, (err) => {
      if (err) {
        reject(err);
      } else if (res.body === undefined) {
        finish();
      }
    });
  });
}
