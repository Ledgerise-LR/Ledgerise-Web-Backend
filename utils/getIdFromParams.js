
function getIdFromParams(subCollectionId, tokenId) {
  return subCollectionId.toString().concat("-").concat(tokenId.toString());
}

module.exports = { getIdFromParams };
