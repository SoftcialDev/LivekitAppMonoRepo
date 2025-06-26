const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {});

function injectMainWorld(fn) {
  const run = () => {
    const s = document.createElement('script');
    s.textContent = `(${fn})();`;
    document.documentElement.appendChild(s);
    s.remove();
  };
  document.documentElement ? run() : window.addEventListener('DOMContentLoaded', run);
}

injectMainWorld(() => {
  window.__lkStats = { res: '–', lastSent: 0, lastRecv: 0, up: '0.0', down: '0.0' };

  ['getUserMedia', 'getDisplayMedia'].forEach(fn => {
    const orig = navigator.mediaDevices[fn].bind(navigator.mediaDevices);
    navigator.mediaDevices[fn] = async c => {
      const v = (c && c.video !== false) ? (c.video || {}) : {};
      Object.assign(v, { width: { exact: 640 }, height: { exact: 480 } });
      const stream = await orig({ ...c, video: v });
      const s = stream.getVideoTracks()[0].getSettings();
      window.__lkStats.res = `${s.width}×${s.height}`;
      return stream;
    };
  });

  window.__pcs = [];
  const NativePC = window.RTCPeerConnection;
  window.RTCPeerConnection = function (...args) {
    const pc = new NativePC(...args);
    window.__pcs.push(pc);

    const restart = () => {
      if (pc.signalingState !== 'closed') {
        pc.createOffer({ iceRestart: true })
          .then(o => pc.setLocalDescription(o))
          .catch(() => {});
      }
    };
    pc.addEventListener('iceconnectionstatechange', () => {
      if (pc.iceConnectionState === 'failed') restart();
    });
    pc.addEventListener('connectionstatechange', () => {
      if (pc.connectionState === 'failed') restart();
    });
    return pc;
  };
  window.RTCPeerConnection.prototype = NativePC.prototype;

  setInterval(async () => {
    let sent = 0, recv = 0;
    for (const pc of window.__pcs) {
      const stats = await pc.getStats();
      stats.forEach(r => {
        if (r.type === 'outbound-rtp' && r.bytesSent)     sent += r.bytesSent;
        if (r.type === 'inbound-rtp'  && r.bytesReceived) recv += r.bytesReceived;
      });
    }
    const dS = sent - window.__lkStats.lastSent;
    const dR = recv - window.__lkStats.lastRecv;
    window.__lkStats.lastSent = sent;
    window.__lkStats.lastRecv = recv;
    window.__lkStats.up   = ((dS * 8) / 1000).toFixed(1);
    window.__lkStats.down = ((dR * 8) / 1000).toFixed(1);

    window.dispatchEvent(new CustomEvent('lk-stats', { detail: window.__lkStats }));
  }, 1000);
});

window.addEventListener('lk-stats', e => {
  const { res, up, down } = e.detail;
  ipcRenderer.send('stats', { resText: res, up, down });
});

window.addEventListener('DOMContentLoaded', () => {
  const box = document.createElement('div');
  Object.assign(box.style, {
    position: 'fixed',
    top: '10px',
    right: '10px',
    background: 'rgba(0,0,0,0.8)',
    color: '#0f0',
    padding: '6px 10px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    fontSize: '13px',
    whiteSpace: 'pre',
    zIndex: 999999,
    pointerEvents: 'none'
  });
  document.body.appendChild(box);

  window.addEventListener('lk-stats', ev => {
    const { res, up, down } = ev.detail;
    box.textContent = `Res: ${res}\n↑ ${up} kb/s  ↓ ${down} kb/s`;
  });
});
