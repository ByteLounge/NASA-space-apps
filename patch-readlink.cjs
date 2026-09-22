const fs = require("node:fs");

function patch(target) {
  if (!target) return;

  const origReadlinkSync = target.readlinkSync;
  if (origReadlinkSync) {
    target.readlinkSync = function (path, options) {
      try {
        return origReadlinkSync.call(target, path, options);
      } catch (err) {
        if (err && err.code === "EISDIR") {
          err.code = "EINVAL";
        }
        throw err;
      }
    };
  }

  const origReadlink = target.readlink;
  if (origReadlink) {
    target.readlink = function (path, options, callback) {
      let cb = callback;
      let opts = options;
      if (typeof opts === "function") {
        cb = opts;
        opts = {};
      }
      return origReadlink.call(target, path, opts, (err, linkString) => {
        if (err && err.code === "EISDIR") {
          err.code = "EINVAL";
        }
        if (cb) cb(err, linkString);
      });
    };
  }
}

patch(fs);
if (fs.promises) {
  const origPromisesReadlink = fs.promises.readlink;
  if (origPromisesReadlink) {
    fs.promises.readlink = async function (path, options) {
      try {
        return await origPromisesReadlink.call(fs.promises, path, options);
      } catch (err) {
        if (err && err.code === "EISDIR") {
          err.code = "EINVAL";
        }
        throw err;
      }
    };
  }
}
