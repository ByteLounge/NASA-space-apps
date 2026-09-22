import fs from "node:fs";

// Fix for Node 24 on Windows where libuv returns EISDIR instead of EINVAL when readlink is called on non-symlink files
const origReadlinkSync = fs.readlinkSync;
fs.readlinkSync = function (path, options) {
  try {
    return origReadlinkSync.call(fs, path, options);
  } catch (err) {
    if (err && err.code === "EISDIR") {
      err.code = "EINVAL";
    }
    throw err;
  }
};

const origReadlink = fs.readlink;
fs.readlink = function (path, options, callback) {
  let cb = callback;
  let opts = options;
  if (typeof opts === "function") {
    cb = opts;
    opts = {};
  }
  return origReadlink.call(fs, path, opts, (err, linkString) => {
    if (err && err.code === "EISDIR") {
      err.code = "EINVAL";
    }
    if (cb) cb(err, linkString);
  });
};

if (fs.promises && fs.promises.readlink) {
  const origPromisesReadlink = fs.promises.readlink;
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
