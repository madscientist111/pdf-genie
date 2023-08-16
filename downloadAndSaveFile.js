const path = require("path");
const axios = require("axios");
const fs = require("fs");

const downloadAndSaveFile = async (url, dir) => {
  const filename = `${Date.now()}-${path.basename(url)}`;
  const filePath = path.join(dir, filename);

  const response = await axios({ method: "GET", url, responseType: "stream" });
  response.data.pipe(fs.createWriteStream(filePath));

  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve(filePath);
    });

    response.data.on("error", () => {
      reject();
    });
  });
};

module.exports = downloadAndSaveFile;
