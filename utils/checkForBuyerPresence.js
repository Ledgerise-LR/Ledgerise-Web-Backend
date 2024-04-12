
function checkForBuyerPresence(buyerAddress, eachCollaboratorSet) {
  let flag = 1;
  eachCollaboratorSet.forEach(eachCollaborator => {
    if (eachCollaborator.split("_")[1] == buyerAddress || !buyerAddress) {
      flag = 0;
    }
  })

  return flag;
}

module.exports = { checkForBuyerPresence }
