const downloadMedia = require("./downloadAndSaveFile.js");
const convertFile = require("./convert.js");
const { uploadThumbnails } = require("./uploadToS3");
const jwt = require("./jwtValidation");

const DEFAULT_ATTEMPTS = process.env.DEFAULT_ATTEMPTS || 3;

/**
 * Handles file download, conversion and upload
 *
 * Sample Event:
 * {
 *     "headers": {
 *         "Authorization": "Bearer <JWT_TOKEN>"
 *    },
 *     "body": {
 *         "media_url": <MEDIA_URL>,
 *         "convert_to": "pdf"
 *     }
 * }
 *
 * @param {Object} event - function invocation parameters
 * - headers (required): the request headers
 *    - headers.Authorization (required): the JWT token
 * - body (required): the request body
 *    - body.media_url (required): the URL of the file to convert
 *    - body.convert_to (optional): the file format of the converted type. Will be
 *     converted to pdf if not specified
 *    - body.num_attempts (optional): number of conversion attempts to make. If not
 *     specified, defaults to `DEFAULT_ATTEMPTS`
 *
 * @throws {Error} if any required param is missing
 * or the 'convert_to' format is not supported
 *
 * @returns {Object} - the S3 URL of the converted file
 */
module.exports.handler = async (event) => {
  if (!event.body || !event.headers) {
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      statusCode: 401,
      body: JSON.stringify({
        status: 401,
        message: "Invalid Body. Please check the request body and try again.",
      }),
    };
  }

  // Check if the request is authorized
  const checkToken = await jwt.validateJWT(event);
  if (!(checkToken && checkToken.companyId)) {
    return {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
      statusCode: 401,
      body: JSON.stringify({
        status: 401,
        message: "Authentication Error",
      }),
    };
  }

  const mediaUrl = event.body.media_url;
  const numAttempts = event.body.num_attempts || DEFAULT_ATTEMPTS;
  const convertTo = event.body.convert_to || "pdf";

  // If 'convert_to' is specified in `event` then use that. Otherwise,
  // attempt to infer it from `output_path`

  const supportedTargetTypes = ["pdf"];
  // [("pdf", "png", "jpg", "jpeg")];

  if (!mediaUrl) {
    throw new Error(`Please specify a media_url to convert.`);
  }

  if (!supportedTargetTypes.includes(convertTo)) {
    throw new Error(
      `We do not support the submitted Target file type - "${convertTo}". Check back later.`
    );
  }

  const downloadPath = await downloadMedia(mediaUrl, "/tmp");

  console.info(
    `Successfully downloaded\n::->> ${mediaUrl} - at\n::->>${downloadPath}.`
  );

  const uploadPath = await convertFile(
    downloadPath,
    "/tmp",
    convertTo,
    numAttempts
  );

  const s3UploadLink = await uploadThumbnails(
    [uploadPath],
    checkToken.companyId
  );

  console.info(
    `Successfully uploaded converted document to "${s3UploadLink}".`
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ s3UploadLink }),
    // conversion,
    // ls: ji,
  };
};
