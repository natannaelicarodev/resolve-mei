const { View } = require('react-native');

// Under Jest the detector renders its children directly and every gesture is a
// chainable no-op builder. Components mount and their layout is asserted; the
// gesture behaviour itself is exercised in the app, not here.
function builder() {
  const chain = {};
  const methods = [
    'onBegin',
    'onStart',
    'onChange',
    'onUpdate',
    'onEnd',
    'onFinalize',
    'onTouchesDown',
    'onTouchesUp',
    'enabled',
    'maxDuration',
    'minDuration',
    'minDistance',
    'activeOffsetX',
    'activeOffsetY',
    'failOffsetX',
    'failOffsetY',
    'simultaneousWithExternalGesture',
    'requireExternalGestureToFail',
    'shouldCancelWhenOutside',
    'hitSlop',
    'runOnJS',
    'withRef',
  ];
  for (const name of methods) chain[name] = () => chain;
  return chain;
}

module.exports = {
  GestureDetector: View,
  GestureHandlerRootView: View,
  Gesture: {
    Pan: builder,
    Tap: builder,
    LongPress: builder,
    Fling: builder,
    Pinch: builder,
    Rotation: builder,
    Native: builder,
    Manual: builder,
    Simultaneous: builder,
    Race: builder,
    Exclusive: builder,
  },
  PanGestureHandler: View,
  TapGestureHandler: View,
  ScrollView: View,
  Directions: {},
  State: {},
};
