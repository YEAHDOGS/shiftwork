// Local forward proxy that injects egress-proxy auth preemptively.
// Lets Chromium (which won't send Proxy-Authorization without a 407) egress.
import net from "net";
import { URL } from "url";

const EGRESS_HOST = "fd8b:4f84:7d32:99::1";
const EGRESS_PORT = 3128;
const u = new URL(process.env.https_proxy);
const AUTH = "Basic " + Buffer.from(
  decodeURIComponent(u.username) + ":" + decodeURIComponent(u.password)
).toString("base64");

const server = net.createServer((client) => {
  let buf = Buffer.alloc(0);
  let target = null;

  const onData = (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    if (!target) {
      const end = buf.indexOf("\r\n\r\n");
      if (end === -1) return;
      const head = buf.slice(0, end).toString("latin1");
      const [reqLine, ...headerLines] = head.split("\r\n");
      const [method, targetUrl] = reqLine.split(" ");
      const headers = {};
      for (const l of headerLines) {
        const i = l.indexOf(":");
        if (i > 0) headers[l.slice(0, i).trim().toLowerCase()] = l.slice(i + 1).trim();
      }
      client.removeListener("data", onData);
      if (method === "CONNECT") {
        const [host, port] = targetUrl.split(":");
        target = net.connect(EGRESS_PORT, EGRESS_HOST, () => {
          target.write(`CONNECT ${host}:${port || 443} HTTP/1.1\r\nHost: ${host}\r\nProxy-Authorization: ${AUTH}\r\n\r\n`);
          // wait for 200 then pipe
          let hbuf = Buffer.alloc(0);
          const onHead = (c) => {
            hbuf = Buffer.concat([hbuf, c]);
            const e = hbuf.indexOf("\r\n\r\n");
            if (e === -1) return;
            const hs = hbuf.slice(0, e).toString("latin1");
            target.removeListener("data", onHead);
            if (/^HTTP\/\d(\.\d)? 200/.test(hs)) {
              client.write("HTTP/1.1 200 Connection Established\r\n\r\n");
              const rest = hbuf.slice(e + 4);
              if (rest.length) target.write(rest);
              client.pipe(target).pipe(client);
            } else {
              client.write("HTTP/1.1 502 Bad Gateway\r\n\r\n");
              client.end(); target.end();
            }
          };
          target.on("data", onHead);
        });
        target.on("error", () => { client.end(); });
      } else {
        // plain HTTP: rebuild request with absolute URI -> forward
        const parsed = new URL(targetUrl.startsWith("http") ? targetUrl : `http://${headers.host}${targetUrl}`);
        target = net.connect(EGRESS_PORT, EGRESS_HOST, () => {
          const lines = [`${method} ${parsed.href} HTTP/1.1`];
          let hasAuth = false, hasHost = false;
          for (const l of headerLines) {
            const n = l.slice(0, l.indexOf(":")).trim().toLowerCase();
            if (n === "proxy-authorization") { hasAuth = true; continue; }
            if (n === "proxy-connection") continue;
            if (n === "host") hasHost = true;
            lines.push(l);
          }
          if (!hasHost) lines.push(`Host: ${parsed.host}`);
          if (!hasAuth) lines.push(`Proxy-Authorization: ${AUTH}`);
          lines.push("", "");
          target.write(lines.join("\r\n"));
          target.write(buf.slice(end + 4));
          client.pipe(target).pipe(client);
        });
        target.on("error", () => { client.end(); });
      }
      client.on("error", () => {});
    }
  };
  client.on("data", onData);
  client.on("error", () => {});
});

server.listen(8899, "127.0.0.1", () => console.log("proxy up on 127.0.0.1:8899"));
