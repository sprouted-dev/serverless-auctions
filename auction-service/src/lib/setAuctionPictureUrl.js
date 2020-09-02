import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export async function setAuctionPictureUrl({ id, imageUrl }) {

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set picture = :picture',
    ExpressionAttributeValues: {
      ':picture': imageUrl
    },
    ReturnValues: 'ALL_NEW'
  };

  const { Attributes: updatedAuction } = await dynamodb.update(params).promise();
  return updatedAuction;
}