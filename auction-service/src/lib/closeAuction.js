import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

const sendMessage = ({subject, recipient, body}) => {
  return sqs.sendMessage({
    QueueUrl: process.env.MAIL_QUEUE_URL,
    MessageBody: JSON.stringify({
      subject,
      recipient,
      body
    })
  }).promise();
};

export async function closeAuction(auction) {

  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: { id: auction.id },
    UpdateExpression: 'set #status = :status',
    ExpressionAttributeValues: {
      ':status': 'CLOSED',
    },
    ExpressionAttributeNames: {
      '#status': 'status'
    }
  };

  await dynamodb.update(params).promise();
  const { title, seller, highestBid } = auction;
  const { bidder, amount } = highestBid;

  const messages = [];

  if (amount > 0) {
    messages.push(sendMessage({
      subject: 'SOLD MuthaFucka!',
      recipient: seller,
      body: `Fuck ya! You done sold dat "${title}" for $${amount}`
    }));

    messages.push(sendMessage({
        subject: 'WTF.',
        recipient: bidder,
        body: `Did you really need another "${title}" for $${amount} dumbass?`
      }));
  } else {
    messages.push(sendMessage({
      subject: 'No Soup For You',
      recipient: seller,
      body: `Sorry, no body wanted your piece of shit "${title}".`
    }));
  }


  return Promise.all(messages);
}