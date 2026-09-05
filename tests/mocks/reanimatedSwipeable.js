const { View } = require('react-native');
const { createElement } = require('react');

// Under Jest the swipe gesture itself is not exercised — only that the
// actions exist and the row's own content still renders. `progress` is a
// fake shared value so `renderRightActions` callbacks (which read
// `progress.value`) don't throw.
const fakeProgress = { value: 1 };

function Swipeable({ children, renderRightActions, renderLeftActions }) {
  const rightActions = renderRightActions
    ? renderRightActions(fakeProgress, fakeProgress, {
        close: () => undefined,
        openLeft: () => undefined,
        openRight: () => undefined,
        reset: () => undefined,
      })
    : null;
  const leftActions = renderLeftActions
    ? renderLeftActions(fakeProgress, fakeProgress, {
        close: () => undefined,
        openLeft: () => undefined,
        openRight: () => undefined,
        reset: () => undefined,
      })
    : null;
  return createElement(View, null, leftActions, children, rightActions);
}

module.exports = Swipeable;
module.exports.default = Swipeable;
module.exports.SwipeDirection = { LEFT: 'left', RIGHT: 'right' };
