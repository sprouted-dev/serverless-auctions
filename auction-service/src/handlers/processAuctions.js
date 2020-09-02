import { getExpiredAuctions } from "../lib/getExpiredAuctions";
import { closeAuction } from "../lib/closeAuction";
import createError from "http-errors";

async function processAuctions(event, context) {
  try {
    const auctionsToClose = await getExpiredAuctions();
    const closeAuctions = auctionsToClose.map(a => closeAuction(a));

    await Promise.all(closeAuctions);
    return { closed: closeAuctions.length };
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }
}

export const handler = processAuctions;