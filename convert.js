const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const LIBREOFFICE_PATH = process.env.LIBREOFFICE_PATH;

module.exports = async (filepath, outdir, convertTo, numAttempts) => {
  const commands = [
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

  const expectedOutpath = filepath.replace(
    path.extname(filepath),
    `.${convertTo}`
  );

  console.info(`\n\nas\n\n`);
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
      });

      child.on("close", (status) => {
        resolve({ stdout, stderr, status });
      });
    });

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
      `Unable to convert file. On the last attempt (${numAttempts}/${numAttempts}) the output was as follows - stdout: "${stdout}". stderr: "${stderr}".`
    );
  }
};
