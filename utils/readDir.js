/**
 * can be used to check the contents of the directories
 * to see if the files are getting downloaded or not
 * also, if they are getting converted and saved properly or not
 */

const fs = require("fs");

const readTestFolder = (testFolder) => {
  return new Promise((resolve, reject) => {
    fs.readdir(testFolder, (err, files) => {
      if (err) {
        reject(err);
      } else {
        resolve(files);
      }
    });
  });
};

const main = async (testFolder = "./") => {
  try {
    const files = await readTestFolder(testFolder);
    files.forEach((file) => {
      console.log(file);
    });
  } catch (err) {
    console.error(err);
  }
};

module.exports = main;
