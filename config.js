const envVariable = (env) => ({
  secret: env.JWT_SECRET,
  region: env.REGION,
  accessKey: env.awsAccessKey,
  secretKey: env.awsSecretKey,
  bucketName: env.IMAGE_BUCKET_NAME,
  cloudFrontUrl: env.IMAGE_CLOUD_URL || "",
});

module.exports = envVariable(process.env);
