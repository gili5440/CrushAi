import { registerRootComponent } from 'expo';
import { I18nManager } from 'react-native';

import App from './App';

// CrushAI is Hebrew-first: force RTL layout so flex rows, tab bar order, and
// text alignment mirror the design system automatically. Takes effect after
// the next JS reload (RN cannot flip layout direction on a live app).
if (!I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
