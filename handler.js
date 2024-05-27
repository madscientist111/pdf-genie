const downloadMedia = require("./downloadAndSaveFile.js");
const convertFile = require("./convert.js");
const { getPdfMetadata } = require("./convert.js");
const { uploadThumbnails } = require("./uploadToS3");
const jwt = require("./jwtValidation");
const path = require("path");

const DEFAULT_ATTEMPTS = process.env.DEFAULT_ATTEMPTS || 3;

const getErrorResponse = (statusCode = 0, errorMessage = "") => ({
  statusCode: statusCode || 400,
  headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
  },
  body: JSON.stringify({
    status: statusCode || 400,
    message: "Validation Failed",
    reasons: [
      { message: errorMessage || "We encountered an error. Please try again!" },
    ],
  }),
});

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
  try {
    console.log("event", event);
    // Set the response headers
    // need to set the headers for AWS API Gateway
    // also applies to rest of the objects like this
    const response = {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Methods": "POST,GET,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
      },
    };

    if (!event.body) {
      return getErrorResponse(
        400,
        "Invalid Body. Please check the request body and try again."
      );
    }

    let body = {};

    try {
      body = JSON.parse(event.body);
    } catch (err) {
      return getErrorResponse(
        400,
        "Invalid Body. Please check the request body and try again."
      );
    }

    // Check if the request is authorized
    const checkToken = await jwt.validateJWT(event);
    if (!(checkToken && checkToken.companyId)) {
      return getErrorResponse(401, "Authentication Error");
    }

    const mediaUrl = body.media_url;
    const numAttempts = body.num_attempts || DEFAULT_ATTEMPTS;
    const convertTo = body.convert_to || "pdf";

    // If 'convert_to' is specified in `event` then use that. Otherwise,
    // attempt to infer it from `output_path`

    const supportedTargetTypes = ["pdf"];
    // [("pdf", "png", "jpg", "jpeg")];

    if (!mediaUrl) {
      return getErrorResponse(400, "Please specify a media_url to convert");
      // throw new Error(`Please specify a media_url to convert.`);
    }

    if (!supportedTargetTypes.includes(convertTo)) {
      return getErrorResponse(
        400,
        `We do not support the submitted Target file type - "${convertTo}". Check back later.`
      );
    }

    const downloadPath = await downloadMedia(mediaUrl, "/tmp");

    console.info(
      `Successfully downloaded\n::->> ${mediaUrl} - at\n::->>${downloadPath}.`
    );

    let metaData = {};

    const convertedPdfPath = downloadPath.includes(".pdf")
      ? downloadPath
      : await convertFile(downloadPath, "/tmp", convertTo, numAttempts);

    try {
      metaData = await getPdfMetadata(convertedPdfPath);
    } catch (er) {
      // ignore
      console.log("Error While Fetching Metadata", er);
    }

    // TODO: convert all the pages of PDF to images
    // the param can not be jpg, it only supports jpeg
    const imgPath = await convertFile(
      convertedPdfPath,
      "/tmp",
      "jpeg",
      numAttempts
    );

    // upload the converted pdf file to S3
    const pdfLink = downloadPath.includes(".pdf")
      ? mediaUrl
      : await uploadThumbnails([convertedPdfPath], checkToken.companyId);

    // upload the converted image files to S3
    const imgLinks = await uploadThumbnails(
      [imgPath],
      checkToken.companyId,
      path.extname(imgPath).replace(".", "")
    );

    console.info(
      `Successfully uploaded converted document to "${pdfLink} and ${imgLinks}".`
    );

    return {
      ...response,
      statusCode: 200,
      body: JSON.stringify({
        metaData,
        pdfLink,
        imageLinks: imgLinks,
      }),
    };
  } catch (err) {
    console.log("errrrr");
    console.log(err);
    return getErrorResponse(400, err.message);
  }
};
