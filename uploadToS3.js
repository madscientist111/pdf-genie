const fs = require("fs");
const aws = require("aws-sdk");
const shortid = require("shortid");
const envVariable = require("./config");
const s3Stream = require("s3-upload-stream");

const s3 = new aws.S3({
  apiVersion: "2006-03-01",
  region: envVariable.region,
  accessKeyId: envVariable.accessKey,
  secretAccessKey: envVariable.secretKey,
});

const upload = async (thumbnail, companyId) =>
  new Promise((resolve, reject) => {
    const key = `${Date.now()}-${shortid.generate()}.pdf`;
    const media = fs.createReadStream(thumbnail);

    const upload = s3Stream(s3).upload({
      Bucket: envVariable.bucketName,
      Key: `${companyId}/${key}`,
      ACL: "public-read",
      StorageClass: "REDUCED_REDUNDANCY",
      ContentType: "application/pdf",
    });
    media.pipe(upload);

    upload.on("error", (err) => {
      try {
        console.log("encountered error", thumbnail);
        console.log("---");
        console.log(err);
        console.log("---");
        fs.unlink(thumbnail, () => {});
      } catch (err) {
        console.log("encountered error - upload.on catch");
        console.log(err);
        //ignore
      }
      reject();
    });

    upload.on("uploaded", () => {
      console.info("uploaded successfully!");
      try {
        fs.unlink(thumbnail, () => {});
      } catch (err) {
        console.log(err);
        //ignore
      }
      let thumbnailUrl = `https://${envVariable.bucketName}.s3.amazonaws.com/${companyId}/${key}`;
      resolve(thumbnailUrl);
    });
  });

const uploadThumbnails = async (thumbnails, companyId) => {
  const thumbnailUrls = await Promise.all(
    thumbnails.map((thumbnail) => upload(thumbnail, companyId))
  );
  return thumbnailUrls;
};

module.exports = { upload, uploadThumbnails };
