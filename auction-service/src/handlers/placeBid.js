import AWS from 'aws-sdk';
import createError from 'http-errors';
import commonMiddleware from '../lib/commonMiddleware';
import validator from '@middy/validator';
import { getAuctionById } from './getAuction';
import placeBidSchema from '../lib/schemas/placeBidSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  const {id} = event.pathParameters;
  const {amount} = event.body;
  const {email} = event.requestContext.authorizer;

  let updatedAuction;

  const auction = await getAuctionById(id);

  if (auction.seller === email) {
    throw new createError.BadRequest('You cannot bid on your own item, loser.');
  }

  if (auction.highestBid.bidder === email) {
    throw new createError.BadRequest('You already have the highest bid, dumbass.');
  }

  if (amount <= auction.highestBid.amount) {
    throw new createError.Forbidden(`Your bid must be higher than ${auction.highestBid.amount}!`);
  }

  if (auction.status !== 'OPEN') {
    throw new createError.BadRequest('You cannot bid on closed auctions');
  }

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id },
    UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
    ExpressionAttributeValues: {
      ':bidder': email,
      ':amount': amount
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const { Attributes } = await dynamodb.update(params).promise();
    updatedAuction = Attributes;
  } catch(error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  if (!updatedAuction) {
    throw new createError.NotFound(`Auction with ID "${id}" not found!`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid)
  .use(validator({ inputSchema: placeBidSchema }));