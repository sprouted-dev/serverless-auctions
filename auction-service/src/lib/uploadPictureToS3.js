import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export async function uploadPictureToS3({ Key, Body }) {
  const { Location: location } = await s3.upload({
    Bucket: process.env.AUCTIONS_BUCKET_NAME,
    Key,
    Body,
    ContentEncoding: 'base64',
    ContentType: 'image/jpeg'
  }).promise();

  return location;
}