const getForgingDelegates = async function (client) {
  const delegates = await client.getForgingDelegates();
  this.successLog(delegates, 'forging delegates:');
};

const getDelegatesByVoteWeight = async function (
  client,
  pageInfo = { offset: 1, limit: 1, pageNumber: 1, order: 'asc' }
) {
  const delegates = await client.getDelegatesByVoteWeight(
    pageInfo.offset,
    pageInfo.limit,
    pageInfo.order
  );

  await this.pagination(delegates, pageInfo, 1, getDelegatesByVoteWeight, [
    client,
    pageInfo,
  ]);
};

module.exports = {
  getForgingDelegates,
  getDelegatesByVoteWeight,
};
