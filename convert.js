const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH;
const PDF_CAIRO_PATH = process.env.PDF_CAIRO_PATH;

module.exports = async (filepath, outdir, convertTo, numAttempts) => {
  let commands = [
    LIBREOFFICE_PATH,

    // Without this, LibreOffice will return 'Fatal Error: The application
    // cannot be started. User installation could not be completed' because
    // AWS Lambda invocations do not have write access to
    // ~/.config/libreoffice
    "-env:UserInstallation=file:///tmp/",

    "--headless",
    "--invisible",
    "--nodefault",
    "--nofirststartwizard",
    "--nolockcheck",
    "--nologo",
    "--norestore",
    "--writer",

    "--convert-to",
    convertTo,

    "--outdir",
    outdir,

    filepath,
  ];

  // If the convert_to is jpeg, the extension should be jpg (because pdfcairo only exports to jpg)
  let expectedOutpath = filepath.replace(
    path.extname(filepath),
    `.${["jpeg", "jpg"].includes(convertTo) ? "jpg" : convertTo}`
  );

  // only supporting pdf to jpg/png/jpeg for now
  if (["jpg", "png", "jpeg"].includes(convertTo)) {
    const pdfcairoArgs = [
      `${PDF_CAIRO_PATH}/pdftocairo`,
      // "-f",
      // "1",
      // "-l",
      // "1",
      // "-scale-to-fit",
      // "-scale-to-x",
      // "1280",
      // "-jpeg",
      `-${convertTo}`,
      "-singlefile",
      "-scale-to",
      "1280",
      filepath,
      expectedOutpath.split(".")[0],
    ];
    commands = pdfcairoArgs;
  }

  // On a cold start, LibreOffice often requires several attempts to convert
  // a file before it succeeds
  for (let attempt = 0; attempt < numAttempts; attempt++) {
    const { stdout, stderr, status } = await new Promise((resolve) => {
      const child = spawn(commands[0], commands.slice(1));
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();

        /**
         * If the error message indicates that the file could not be loaded,
         * then the chances are that Document is password protected. In this
         * case, we should not retry the conversion.
         */
        if (stderr.includes("source file could not be loaded")) {
          attempt = 1000;
        }
      });

      child.on("close", (status) => {
        resolve({ stdout, stderr, status });
      });
    });

    // If the conversion was successful, return the path to the converted file
    if (status === 0 && fs.existsSync(expectedOutpath)) {
      console.info(
        `Conversion successful on attempt ${
          attempt + 1
        }/${numAttempts}. stdout: "${stdout}". stderr: "${stderr}".`
      );
      return expectedOutpath;
      // break;
    }

    console.info(
      `Conversion attempt ${
        attempt + 1
      }/${numAttempts} failed. stdout: "${stdout}". stderr: "${stderr}".`
    );
  }

  // If all attempts fail, raise an error and report the output and error
  // messages from the last attempt
  if (!fs.existsSync(expectedOutpath)) {
    const { stdout, stderr } = await new Promise((resolve) => {
      const child = spawn(commands[0], commands.slice(1));
      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", () => {
        resolve({ stdout, stderr });
      });
    });

    throw new Error(
      stderr.includes("source file could not be loaded")
        ? "You cannot share password protected documents on LinkedIn."
        : "We encountered some error. Please try again!"
    );
  }
};

// function to get the pdf metadata
module.exports.getPdfMetadata = async (filepath) => {
  const dataObj = {};
  let commands = [`${PDF_CAIRO_PATH}/pdfinfo`, filepath];

  const { stdout, stderr, status } = await new Promise((resolve) => {
    const child = spawn(commands[0], commands.slice(1));
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (status) => {
      resolve({ stdout, stderr, status });
    });
  });

  if (status === 0) {
    stdout.split("\n").forEach((str) => {
      const strArr = str.split(":").map((s) => (s && s.trim()) || "");
      dataObj[strArr[0].toLowerCase()] = strArr[1];
    });

    console.log("dataObj received: success");
  } else {
    throw new Error(`Error executing the command. Exit code: ${status}`);
  }

  return dataObj;
};
