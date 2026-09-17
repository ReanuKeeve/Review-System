const legacyGroup = document.body.dataset.reviewGroup;
const legacyTarget = 'review.html?group=' + encodeURIComponent(legacyGroup);
const continueLink = document.getElementById('continue-link');

if (continueLink) continueLink.href = legacyTarget;
window.location.replace(legacyTarget);
